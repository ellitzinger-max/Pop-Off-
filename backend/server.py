from fastapi import FastAPI, APIRouter, HTTPException, status, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import time
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Set
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from agora_token_builder import RtcTokenBuilder
import structlog
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Pop Off! API")
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = structlog.get_logger()

INTERESTS_OPTIONS = [
    "Relationships", "Mental Health", "News & Politics", "Movies & TV",
    "Books & Reading", "Music", "Sports", "Gaming", "Fitness", "Cooking",
    "Travel", "Art & Design", "Technology", "Career", "Parenting",
    "Spirituality", "Fashion", "Photography", "Science", "Humor"
]

TRENDING_CATEGORIES = [
    "trending-news",
    "pop-culture", 
    "media",
    "creative"
]

CATEGORY_NAMES = {
    "trending-news": "Trending News/Current Events",
    "pop-culture": "Pop Culture",
    "media": "Books/Film/Music/Other Media",
    "creative": "Art/Cooking/DIY"
}

REPORT_CATEGORIES = ["hate_speech", "illegal_activity", "nudity", "transactions", "harassment", "spam"]

BOOST_PACKAGES = {
    "24hour": {"duration_hours": 24, "price": 4.99, "coins": 500, "name": "24-Hour Boost"},
    "7day": {"duration_hours": 168, "price": 19.99, "coins": 2000, "name": "7-Day Boost"},
    "featured": {"duration_hours": 72, "price": 29.99, "coins": 3000, "name": "Featured Placement (3 days)"}
}

PREMIUM_PLANS = {
    "monthly": {"duration_days": 30, "price": 4.99, "name": "Premium Monthly"},
    "yearly": {"duration_days": 365, "price": 39.99, "name": "Premium Yearly"}
}

AD_REWARDS = {
    "video_ad": {"coins": 50, "cooldown_minutes": 5},
    "native_ad_view": {"coins": 5, "cooldown_minutes": 1}
}

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.user_info: Dict[WebSocket, dict] = {}
    
    async def connect(self, room_id: str, websocket: WebSocket, user_data: dict):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        self.user_info[websocket] = user_data
    
    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        if websocket in self.user_info:
            del self.user_info[websocket]
    
    async def broadcast(self, room_id: str, message: dict):
        if room_id not in self.active_connections:
            return
        disconnected = []
        for connection in self.active_connections[room_id]:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(room_id, conn)

connection_manager = ConnectionManager()

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    bio: Optional[str] = None
    interests: List[str] = []
    city: Optional[str] = None
    state: Optional[str] = None
    age: Optional[int] = None
    coins: int = 0
    is_premium: bool = False
    premium_until: Optional[datetime] = None
    connected_socials: Dict[str, Dict] = {}
    current_streak: int = 0
    longest_streak: int = 0
    last_active_date: Optional[str] = None
    badges: List[str] = []
    suspension_count: int = 0
    is_suspended: bool = False
    suspended_until: Optional[datetime] = None
    created_at: datetime

class SocialConnection(BaseModel):
    platform: str
    platform_user_id: str
    username: str
    access_token: Optional[str] = None
    profile_url: Optional[str] = None

class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    interests: Optional[List[str]] = None
    city: Optional[str] = None
    state: Optional[str] = None
    age: Optional[int] = None
    picture: Optional[str] = None

class UserPreferences(BaseModel):
    group_size_min: Optional[int] = 1
    group_size_max: Optional[int] = 10
    age_range_min: Optional[int] = 18
    age_range_max: Optional[int] = 100
    preferred_genders: Optional[List[str]] = []
    preferred_ethnicities: Optional[List[str]] = []
    preferred_political_affiliations: Optional[List[str]] = []
    preferred_sexual_orientations: Optional[List[str]] = []
    preferred_income_brackets: Optional[List[str]] = []
    preferred_topics: Optional[List[str]] = []

class SwipeAction(BaseModel):
    target_user_id: str
    action: str

class ChatMessageCreate(BaseModel):
    match_id: str
    message: str

class ChatMessage(BaseModel):
    message_id: str
    match_id: str
    sender_id: str
    message: str
    timestamp: datetime

class ReportCreate(BaseModel):
    reported_user_id: str
    category: str
    description: str
    context: Optional[str] = None

class TopicCreate(BaseModel):
    title: str
    category: str
    description: str
    max_participants: int = 10  # Default 10, max allowed is 24
    is_trending: bool = False

class Topic(BaseModel):
    topic_id: str
    title: str
    category: str
    description: str
    creator_id: str
    creator_name: str
    max_participants: int
    current_participants: int = 0
    active: bool = True
    is_trending: bool = False
    view_count: int = 0
    trending_score: float = 0
    created_at: datetime

class TokenResponse(BaseModel):
    token: str
    channel_name: str
    user_id: str

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

async def get_current_user(request: Request) -> Optional[User]:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    if user_doc.get('suspended_until'):
        if isinstance(user_doc['suspended_until'], str):
            user_doc['suspended_until'] = datetime.fromisoformat(user_doc['suspended_until'])
        if user_doc['suspended_until'].tzinfo is None:
            user_doc['suspended_until'] = user_doc['suspended_until'].replace(tzinfo=timezone.utc)
    
    return User(**user_doc)

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pwd = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_pwd,
        "picture": None,
        "bio": None,
        "interests": [],
        "city": None,
        "state": None,
        "age": None,
        "coins": 100,
        "is_premium": False,
        "premium_until": None,
        "suspension_count": 0,
        "is_suspended": False,
        "suspended_until": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    session_token = f"session_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    user_response = {"user_id": user_id, "email": user_data.email, "name": user_data.name, "picture": None}
    
    response = JSONResponse(content={"user": user_response, "message": "User created successfully"})
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    return response

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user_doc.get("is_suspended"):
        suspended_until = user_doc.get("suspended_until")
        if suspended_until:
            if isinstance(suspended_until, str):
                suspended_until = datetime.fromisoformat(suspended_until)
            if suspended_until.tzinfo is None:
                suspended_until = suspended_until.replace(tzinfo=timezone.utc)
            if suspended_until > datetime.now(timezone.utc):
                raise HTTPException(status_code=403, detail=f"Account suspended until {suspended_until.isoformat()}")
            else:
                await db.users.update_one({"user_id": user_doc["user_id"]}, {"$set": {"is_suspended": False, "suspended_until": None}})
    
    session_token = f"session_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    user_response = {
        "user_id": user_doc["user_id"],
        "email": user_doc["email"],
        "name": user_doc["name"],
        "picture": user_doc.get("picture")
    }
    
    response = JSONResponse(content={"user": user_response, "message": "Login successful"})
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    return response

@api_router.post("/auth/session")
async def create_session(request: Request):
    data = await request.json()
    session_id = data.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            session_data = response.json()
    except Exception as e:
        logger.error("Session validation failed", error=str(e))
        raise HTTPException(status_code=500, detail="Session validation failed")
    
    email = session_data.get("email")
    name = session_data.get("name")
    picture = session_data.get("picture")
    
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    
    if user_doc:
        user_id = user_doc["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "password": None,
            "bio": None,
            "interests": [],
            "city": None,
            "state": None,
            "age": None,
            "coins": 100,
            "is_premium": False,
            "premium_until": None,
            "suspension_count": 0,
            "is_suspended": False,
            "suspended_until": None,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user_doc)
    
    session_token = session_data.get("session_token")
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    user_response = {"user_id": user_id, "email": email, "name": name, "picture": picture}
    
    response = JSONResponse(content={"user": user_response})
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    return response

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="session_token", path="/")
    return response

@api_router.put("/users/profile")
async def update_profile(profile_data: UserProfileUpdate, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    update_fields = {}
    if profile_data.bio is not None:
        update_fields["bio"] = profile_data.bio
    if profile_data.interests is not None:
        update_fields["interests"] = profile_data.interests
    if profile_data.city is not None:
        update_fields["city"] = profile_data.city
    if profile_data.state is not None:
        update_fields["state"] = profile_data.state
    if profile_data.age is not None:
        update_fields["age"] = profile_data.age
    if profile_data.picture is not None:
        update_fields["picture"] = profile_data.picture
    
    if update_fields:
        update_fields["profile_completed"] = True
        await db.users.update_one({"user_id": user.user_id}, {"$set": update_fields})
    
    return {"message": "Profile updated successfully"}

@api_router.post("/users/pop-off-topic")
async def set_pop_off_topic(request: Request):
    """Set the user's current pop-off topic for matching"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = await request.json()
    topic = data.get("topic", "")
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "current_pop_off_topic": topic,
            "pop_off_topic_set_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": "Pop off topic saved", "topic": topic}

@api_router.post("/users/upload-photo")
async def upload_photo(request: Request):
    """Upload profile photo - stores as base64 for simplicity"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    form = await request.form()
    file = form.get("file")
    
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Read file content and convert to base64
    import base64
    content = await file.read()
    
    # Validate file size (5MB max)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    # Get content type
    content_type = file.content_type or "image/jpeg"
    
    # Convert to base64 data URL
    base64_content = base64.b64encode(content).decode('utf-8')
    data_url = f"data:{content_type};base64,{base64_content}"
    
    # Update user's picture
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"picture": data_url}}
    )
    
    return {"url": data_url, "message": "Photo uploaded successfully"}

@api_router.get("/users/interests")
async def get_interests():
    return {"interests": INTERESTS_OPTIONS}

@api_router.get("/users/preference-options")
async def get_preference_options():
    """Get all available options for user preferences"""
    return {
        "genders": ["Male", "Female", "Non-binary", "Prefer not to say", "Other"],
        "ethnicities": ["Asian", "Black/African American", "Hispanic/Latino", "White/Caucasian", "Middle Eastern", "Native American", "Pacific Islander", "Mixed/Multiracial", "Other", "Prefer not to say"],
        "political_affiliations": ["Liberal", "Conservative", "Moderate", "Libertarian", "Progressive", "Independent", "Apolitical", "Prefer not to say"],
        "sexual_orientations": ["Heterosexual", "Homosexual", "Bisexual", "Pansexual", "Asexual", "Questioning", "Prefer not to say", "Other"],
        "income_brackets": ["Under $25k", "$25k-$50k", "$50k-$75k", "$75k-$100k", "$100k-$150k", "$150k-$200k", "Over $200k", "Prefer not to say"],
        "topics": INTERESTS_OPTIONS
    }

@api_router.put("/users/preferences")
async def update_preferences(preferences: UserPreferences, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    prefs_dict = preferences.model_dump(exclude_none=True)
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"preferences": prefs_dict}}
    )
    
    return {"message": "Preferences updated successfully"}

@api_router.get("/users/preferences")
async def get_preferences(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "preferences": 1})
    
    return user_doc.get("preferences", {})

@api_router.get("/matches/suggestions")
async def get_match_suggestions(request: Request, limit: int = 20):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    already_swiped = await db.swipes.find({"user_id": user.user_id}, {"_id": 0, "target_user_id": 1}).to_list(None)
    swiped_ids = [s["target_user_id"] for s in already_swiped]
    swiped_ids.append(user.user_id)
    
    query = {
        "user_id": {"$nin": swiped_ids},
        "is_suspended": False,
        "interests": {"$exists": True, "$ne": []}
    }
    
    candidates = await db.users.find(query, {"_id": 0, "password": 0}).to_list(100)
    
    scored_candidates = []
    for candidate in candidates:
        score = 0
        
        common_interests = set(user.interests).intersection(set(candidate.get("interests", [])))
        interest_score = len(common_interests) * 10
        score += interest_score * 0.4
        
        if user.state and candidate.get("state"):
            if user.state == candidate["state"]:
                if user.city and candidate.get("city") and user.city == candidate["city"]:
                    location_score = 100
                else:
                    location_score = 50
            else:
                location_score = 0
        else:
            location_score = 25
        score += location_score * 0.3
        
        recent_activity = await db.topics.count_documents({"creator_id": candidate["user_id"], "created_at": {"$gte": datetime.now(timezone.utc) - timedelta(days=7)}})
        activity_score = min(recent_activity * 20, 100)
        score += activity_score * 0.3
        
        scored_candidates.append({
            **candidate,
            "match_score": round(score, 2),
            "common_interests": list(common_interests)
        })
    
    scored_candidates.sort(key=lambda x: x["match_score"], reverse=True)
    
    return scored_candidates[:limit]

@api_router.post("/matches/swipe")
async def swipe_user(swipe_data: SwipeAction, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if swipe_data.action not in ["like", "pass"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    swipe_doc = {
        "swipe_id": f"swipe_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "target_user_id": swipe_data.target_user_id,
        "action": swipe_data.action,
        "created_at": datetime.now(timezone.utc)
    }
    await db.swipes.insert_one(swipe_doc)
    
    is_match = False
    if swipe_data.action == "like":
        reverse_swipe = await db.swipes.find_one({
            "user_id": swipe_data.target_user_id,
            "target_user_id": user.user_id,
            "action": "like"
        }, {"_id": 0})
        
        if reverse_swipe:
            match_id = f"match_{uuid.uuid4().hex[:12]}"
            match_doc = {
                "match_id": match_id,
                "user_ids": sorted([user.user_id, swipe_data.target_user_id]),
                "created_at": datetime.now(timezone.utc)
            }
            await db.matches.insert_one(match_doc)
            is_match = True
            
            return {"match": True, "match_id": match_id}
    
    return {"match": False}

@api_router.get("/matches")
async def get_matches(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    matches = await db.matches.find(
        {"user_ids": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    enriched_matches = []
    for match in matches:
        other_user_id = [uid for uid in match["user_ids"] if uid != user.user_id][0]
        other_user = await db.users.find_one({"user_id": other_user_id}, {"_id": 0, "password": 0})
        
        if other_user:
            last_message_cursor = db.chat_messages.find(
                {"match_id": match["match_id"]},
                {"_id": 0}
            ).sort("timestamp", -1).limit(1)
            last_messages = await last_message_cursor.to_list(1)
            last_message = last_messages[0] if last_messages else None
            
            enriched_matches.append({
                **match,
                "other_user": other_user,
                "last_message": last_message
            })
    
    return enriched_matches

@api_router.get("/chat/{match_id}")
async def get_chat_messages(match_id: str, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    match = await db.matches.find_one({"match_id": match_id}, {"_id": 0})
    if not match or user.user_id not in match["user_ids"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    messages = await db.chat_messages.find(
        {"match_id": match_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(500)
    
    return messages

@api_router.post("/chat")
async def send_chat_message(message_data: ChatMessageCreate, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    match = await db.matches.find_one({"match_id": message_data.match_id}, {"_id": 0})
    if not match or user.user_id not in match["user_ids"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "match_id": message_data.match_id,
        "sender_id": user.user_id,
        "message": message_data.message,
        "timestamp": datetime.now(timezone.utc)
    }
    await db.chat_messages.insert_one(message_doc)
    
    await connection_manager.broadcast(f"chat_{message_data.match_id}", {
        "type": "new_message",
        "message": message_doc
    })
    
    return message_doc

@api_router.post("/reports")
async def create_report(report_data: ReportCreate, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if report_data.category not in REPORT_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid report category")
    
    report_id = f"report_{uuid.uuid4().hex[:12]}"
    report_doc = {
        "report_id": report_id,
        "reporter_id": user.user_id,
        "reported_user_id": report_data.reported_user_id,
        "category": report_data.category,
        "description": report_data.description,
        "context": report_data.context,
        "status": "pending",
        "ai_analysis": None,
        "created_at": datetime.now(timezone.utc)
    }
    await db.reports.insert_one(report_doc)
    
    try:
        await process_report_with_ai(report_id, report_data.reported_user_id, report_data.category)
    except Exception as e:
        logger.error("AI moderation failed", error=str(e))
    
    return {"report_id": report_id, "message": "Report submitted successfully"}

async def process_report_with_ai(report_id: str, reported_user_id: str, category: str):
    messages = await db.chat_messages.find(
        {"sender_id": reported_user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)
    
    message_history = "\n".join([f"{msg['timestamp']}: {msg['message']}" for msg in reversed(messages)])
    
    if not message_history:
        message_history = "No message history available."
    
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        logger.error("EMERGENT_LLM_KEY not configured")
        return
    
    moderation_prompt = f"""You are a content moderation AI for a video chat platform. Analyze the following user's message history for violations.

Report Category: {category}
User's Recent Messages:
{message_history}

Determine if the user has violated our policies:
- Hate speech: Discriminatory language, slurs, promoting violence against groups
- Illegal activity: Discussing or promoting illegal acts
- Nudity: Explicit sexual content or nudity requests
- Transactions: Attempting to sell products/services
- Harassment: Threatening, bullying, or stalking behavior
- Spam: Repetitive promotional content

Provide your analysis in JSON format:
{{
  "violation_found": true/false,
  "confidence": "high"/"medium"/"low",
  "reasoning": "Brief explanation",
  "recommended_action": "no_action"/"warning"/"suspension_1day"/"suspension_7days"/"permanent_ban"
}}"""
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"moderation_{report_id}",
            system_message="You are an expert content moderator. Analyze content objectively and provide clear reasoning."
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=moderation_prompt)
        response = await chat.send_message(user_message)
        
        import re
        json_match = re.search(r'\{[^}]+\}', response, re.DOTALL)
        if json_match:
            ai_analysis = json.loads(json_match.group())
        else:
            ai_analysis = {"error": "Failed to parse AI response", "raw_response": response}
        
        await db.reports.update_one(
            {"report_id": report_id},
            {"$set": {"ai_analysis": ai_analysis, "status": "reviewed"}}
        )
        
        if ai_analysis.get("violation_found") and ai_analysis.get("confidence") in ["high", "medium"]:
            await apply_suspension(reported_user_id, ai_analysis.get("recommended_action", "warning"))
        
    except Exception as e:
        logger.error("AI analysis error", error=str(e))
        await db.reports.update_one(
            {"report_id": report_id},
            {"$set": {"ai_analysis": {"error": str(e)}, "status": "failed"}}
        )

async def apply_suspension(user_id: str, action: str):
    if action == "no_action" or action == "warning":
        return
    
    suspension_duration = {
        "suspension_1day": timedelta(days=1),
        "suspension_7days": timedelta(days=7),
        "permanent_ban": timedelta(days=36500)
    }.get(action, timedelta(days=1))
    
    suspended_until = datetime.now(timezone.utc) + suspension_duration
    
    await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "is_suspended": True,
                "suspended_until": suspended_until
            },
            "$inc": {"suspension_count": 1}
        }
    )
    
    suspension_doc = {
        "suspension_id": f"susp_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "reason": action,
        "suspended_until": suspended_until,
        "created_at": datetime.now(timezone.utc)
    }
    await db.suspensions.insert_one(suspension_doc)

@api_router.get("/trending/categories")
async def get_trending_categories():
    """Get all trending categories"""
    return {
        "categories": [
            {"id": cat, "name": CATEGORY_NAMES[cat]}
            for cat in TRENDING_CATEGORIES
        ]
    }

@api_router.get("/trending/{category}")
async def get_trending_topics(category: str, limit: int = 20):
    """Get trending topics for a specific category"""
    if category not in TRENDING_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    query = {
        "active": True,
        "category": category,
        "max_participants": {"$lte": 10}
    }
    
    topics = await db.topics.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for topic in topics:
        if isinstance(topic['created_at'], str):
            topic['created_at'] = datetime.fromisoformat(topic['created_at'])
        
        hours_old = (datetime.now(timezone.utc) - topic['created_at']).total_seconds() / 3600
        recency_score = max(0, 100 - hours_old * 2)
        
        view_score = topic.get('view_count', 0) * 5
        participant_score = topic.get('current_participants', 0) * 20
        
        topic['trending_score'] = recency_score + view_score + participant_score
    
    topics.sort(key=lambda x: x.get('trending_score', 0), reverse=True)
    
    return topics[:limit]

@api_router.post("/topics/{topic_id}/join")
async def join_topic_room(topic_id: str, request: Request):
    """Join a topic room (increment participant count)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    topic = await db.topics.find_one({"topic_id": topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    if topic['current_participants'] >= topic['max_participants']:
        raise HTTPException(status_code=409, detail="Room is full")
    
    await db.topics.update_one(
        {"topic_id": topic_id},
        {
            "$inc": {"current_participants": 1, "view_count": 1}
        }
    )
    
    return {"message": "Joined successfully", "current_participants": topic['current_participants'] + 1}

@api_router.post("/topics/{topic_id}/leave")
async def leave_topic_room(topic_id: str, request: Request):
    """Leave a topic room (decrement participant count)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    await db.topics.update_one(
        {"topic_id": topic_id, "current_participants": {"$gt": 0}},
        {"$inc": {"current_participants": -1}}
    )
    
    return {"message": "Left successfully"}

@api_router.post("/topics")
async def create_topic(topic_data: TopicCreate, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Validate max_participants (max 24)
    max_participants = min(topic_data.max_participants, 24)
    if max_participants < 2:
        max_participants = 2
    
    topic_id = f"topic_{uuid.uuid4().hex[:12]}"
    
    topic_doc = {
        "topic_id": topic_id,
        "title": topic_data.title,
        "category": topic_data.category,
        "description": topic_data.description,
        "creator_id": user.user_id,
        "creator_name": user.name,
        "max_participants": max_participants,
        "current_participants": 0,
        "active": True,
        "is_trending": False,
        "is_boosted": False,
        "is_featured": False,
        "boost_type": None,
        "boosted_until": None,
        "view_count": 0,
        "trending_score": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.topics.insert_one(topic_doc)
    
    response_data = {
        "topic_id": topic_id,
        "title": topic_data.title,
        "category": topic_data.category,
        "description": topic_data.description,
        "creator_id": user.user_id,
        "creator_name": user.name,
        "max_participants": max_participants,
        "current_participants": 0,
        "active": True,
        "is_trending": False,
        "view_count": 0,
        "trending_score": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    return response_data

@api_router.get("/topics")
async def get_topics(category: Optional[str] = None):
    query = {"active": True}
    if category:
        query["category"] = category
    
    topics = await db.topics.find(query, {"_id": 0}).to_list(100)
    
    current_time = datetime.now(timezone.utc)
    
    for topic in topics:
        if isinstance(topic['created_at'], str):
            topic['created_at'] = datetime.fromisoformat(topic['created_at'])
        
        boosted_until = topic.get('boosted_until')
        if boosted_until:
            if isinstance(boosted_until, str):
                boosted_until = datetime.fromisoformat(boosted_until)
            if boosted_until.tzinfo is None:
                boosted_until = boosted_until.replace(tzinfo=timezone.utc)
            
            if boosted_until < current_time:
                topic['is_boosted'] = False
                topic['is_featured'] = False
            else:
                topic['is_boosted'] = True
    
    boosted_topics = [t for t in topics if t.get('is_boosted')]
    regular_topics = [t for t in topics if not t.get('is_boosted')]
    
    featured = [t for t in boosted_topics if t.get('is_featured')]
    other_boosted = [t for t in boosted_topics if not t.get('is_featured')]
    
    featured.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
    other_boosted.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
    regular_topics.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
    
    return featured + other_boosted + regular_topics

@api_router.get("/topics/search")
async def search_topics(
    q: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50
):
    """Search topics by keyword, title, description, or category"""
    query = {"active": True}
    
    if category:
        query["category"] = category
    
    if q:
        search_pattern = {"$regex": q, "$options": "i"}
        query["$or"] = [
            {"title": search_pattern},
            {"description": search_pattern},
            {"creator_name": search_pattern}
        ]
    
    topics = await db.topics.find(query, {"_id": 0}).to_list(limit)
    
    current_time = datetime.now(timezone.utc)
    
    for topic in topics:
        if isinstance(topic['created_at'], str):
            topic['created_at'] = datetime.fromisoformat(topic['created_at'])
        
        boosted_until = topic.get('boosted_until')
        if boosted_until:
            if isinstance(boosted_until, str):
                boosted_until = datetime.fromisoformat(boosted_until)
            if boosted_until.tzinfo is None:
                boosted_until = boosted_until.replace(tzinfo=timezone.utc)
            
            if boosted_until < current_time:
                topic['is_boosted'] = False
                topic['is_featured'] = False
            else:
                topic['is_boosted'] = True
    
    boosted_topics = [t for t in topics if t.get('is_boosted')]
    regular_topics = [t for t in topics if not t.get('is_boosted')]
    
    featured = [t for t in boosted_topics if t.get('is_featured')]
    other_boosted = [t for t in boosted_topics if not t.get('is_featured')]
    
    featured.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
    other_boosted.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
    regular_topics.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
    
    return featured + other_boosted + regular_topics

@api_router.get("/topics/{topic_id}")
async def get_topic(topic_id: str):
    topic = await db.topics.find_one({"topic_id": topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    if isinstance(topic['created_at'], str):
        topic['created_at'] = datetime.fromisoformat(topic['created_at'])
    
    return topic


@api_router.get("/boost/packages")
async def get_boost_packages():
    """Get available boost packages"""
    return {"packages": BOOST_PACKAGES}

@api_router.post("/boost/checkout")
async def create_boost_checkout(request: Request):
    """Create Stripe checkout session for topic boost"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = await request.json()
    package_id = data.get("package_id")
    topic_id = data.get("topic_id")
    origin_url = data.get("origin_url")
    
    if package_id not in BOOST_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid boost package")
    
    if not topic_id or not origin_url:
        raise HTTPException(status_code=400, detail="topic_id and origin_url required")
    
    topic = await db.topics.find_one({"topic_id": topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    if topic["creator_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="You can only boost your own topics")
    
    package = BOOST_PACKAGES[package_id]
    amount = package["price"]
    
    stripe_api_key = os.getenv("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/boost-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{origin_url}/dashboard"
    
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user.user_id,
            "topic_id": topic_id,
            "package_id": package_id,
            "boost_type": "topic_boost"
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    payment_doc = {
        "payment_id": f"pay_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "user_id": user.user_id,
        "topic_id": topic_id,
        "package_id": package_id,
        "amount": amount,
        "currency": "usd",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    await db.payment_transactions.insert_one(payment_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/boost/status/{session_id}")
async def get_boost_payment_status(session_id: str, request: Request):
    """Check payment status and apply boost if successful"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payment = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if payment["payment_status"] == "completed":
        return {"status": "completed", "message": "Boost already applied"}
    
    stripe_api_key = os.getenv("STRIPE_API_KEY")
    webhook_url = f"{str(request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    checkout_status = await stripe_checkout.get_checkout_status(session_id)
    
    if checkout_status.payment_status == "paid" and payment["payment_status"] != "completed":
        package = BOOST_PACKAGES[payment["package_id"]]
        boost_until = datetime.now(timezone.utc) + timedelta(hours=package["duration_hours"])
        
        update_fields = {
            "is_boosted": True,
            "boosted_until": boost_until,
            "boost_type": payment["package_id"]
        }
        
        if payment["package_id"] == "featured":
            update_fields["is_featured"] = True
        
        await db.topics.update_one(
            {"topic_id": payment["topic_id"]},
            {"$set": update_fields}
        )
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "completed", "completed_at": datetime.now(timezone.utc)}}
        )
        
        return {"status": "completed", "message": "Boost applied successfully"}
    
    return {"status": checkout_status.payment_status, "message": "Payment pending"}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_api_key = os.getenv("STRIPE_API_KEY")
    webhook_url = f"{str(request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            payment = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            
            if payment and payment["payment_status"] != "completed":
                # Handle topic boost payment
                if payment.get("payment_type") == "premium":
                    plan = PREMIUM_PLANS[payment["plan_id"]]
                    premium_until = datetime.now(timezone.utc) + timedelta(days=plan["duration_days"])
                    
                    await db.users.update_one(
                        {"user_id": payment["user_id"]},
                        {"$set": {"is_premium": True, "premium_until": premium_until}}
                    )
                else:
                    # Topic boost
                    package = BOOST_PACKAGES[payment["package_id"]]
                    boost_until = datetime.now(timezone.utc) + timedelta(hours=package["duration_hours"])
                    
                    update_fields = {
                        "is_boosted": True,
                        "boosted_until": boost_until,
                        "boost_type": payment["package_id"]
                    }
                    
                    if payment["package_id"] == "featured":
                        update_fields["is_featured"] = True
                    
                    await db.topics.update_one(
                        {"topic_id": payment["topic_id"]},
                        {"$set": update_fields}
                    )
                
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "completed", "completed_at": datetime.now(timezone.utc)}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logger.error("Webhook error", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/ads/config")
async def get_ad_config(request: Request):
    """Get ad configuration for user"""
    user = await get_current_user(request)
    if not user:
        return {"show_ads": True, "is_premium": False}
    
    premium_active = False
    if user.is_premium and user.premium_until:
        premium_until = user.premium_until
        if isinstance(premium_until, str):
            premium_until = datetime.fromisoformat(premium_until)
        if premium_until.tzinfo is None:
            premium_until = premium_until.replace(tzinfo=timezone.utc)
        premium_active = premium_until > datetime.now(timezone.utc)
    
    return {
        "show_ads": not premium_active,
        "is_premium": premium_active,
        "coins": user.coins,
        "premium_until": user.premium_until.isoformat() if user.premium_until else None
    }

@api_router.post("/ads/reward")
async def watch_reward_ad(request: Request):
    """Grant coins for watching a reward video ad"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = await request.json()
    ad_type = data.get("ad_type", "video_ad")
    
    if ad_type not in AD_REWARDS:
        raise HTTPException(status_code=400, detail="Invalid ad type")
    
    # Get the most recent ad view using find().sort().limit(1)
    ad_views_cursor = db.ad_views.find(
        {"user_id": user.user_id, "ad_type": ad_type},
        {"_id": 0}
    ).sort("created_at", -1).limit(1)
    last_ad_view = await ad_views_cursor.to_list(1)
    last_ad_view = last_ad_view[0] if last_ad_view else None
    
    if last_ad_view:
        last_view_time = last_ad_view["created_at"]
        if isinstance(last_view_time, str):
            last_view_time = datetime.fromisoformat(last_view_time)
        if last_view_time.tzinfo is None:
            last_view_time = last_view_time.replace(tzinfo=timezone.utc)
        
        cooldown = timedelta(minutes=AD_REWARDS[ad_type]["cooldown_minutes"])
        if datetime.now(timezone.utc) - last_view_time < cooldown:
            raise HTTPException(status_code=429, detail="Please wait before watching another ad")
    
    coins_earned = AD_REWARDS[ad_type]["coins"]
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"coins": coins_earned}}
    )
    
    ad_view_doc = {
        "view_id": f"view_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "ad_type": ad_type,
        "coins_earned": coins_earned,
        "created_at": datetime.now(timezone.utc)
    }
    await db.ad_views.insert_one(ad_view_doc)
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "coins": 1})
    
    return {
        "coins_earned": coins_earned,
        "total_coins": updated_user["coins"],
        "message": f"You earned {coins_earned} coins!"
    }

@api_router.post("/boost/purchase-with-coins")
async def purchase_boost_with_coins(request: Request):
    """Purchase topic boost using coins"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = await request.json()
    package_id = data.get("package_id")
    topic_id = data.get("topic_id")
    
    if package_id not in BOOST_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid boost package")
    
    topic = await db.topics.find_one({"topic_id": topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    if topic["creator_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="You can only boost your own topics")
    
    package = BOOST_PACKAGES[package_id]
    coins_required = package["coins"]
    
    if user.coins < coins_required:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient coins. You need {coins_required} coins but have {user.coins}"
        )
    
    boost_until = datetime.now(timezone.utc) + timedelta(hours=package["duration_hours"])
    
    update_fields = {
        "is_boosted": True,
        "boosted_until": boost_until,
        "boost_type": package_id
    }
    
    if package_id == "featured":
        update_fields["is_featured"] = True
    
    await db.topics.update_one(
        {"topic_id": topic_id},
        {"$set": update_fields}
    )
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"coins": -coins_required}}
    )
    
    coin_transaction = {
        "transaction_id": f"tx_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "type": "boost_purchase",
        "amount": -coins_required,
        "topic_id": topic_id,
        "package_id": package_id,
        "created_at": datetime.now(timezone.utc)
    }
    await db.coin_transactions.insert_one(coin_transaction)
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "coins": 1})
    
    return {
        "message": "Boost applied successfully!",
        "remaining_coins": updated_user["coins"],
        "boosted_until": boost_until.isoformat()
    }

@api_router.post("/premium/checkout")
async def create_premium_checkout(request: Request):
    """Create Stripe checkout for premium subscription"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = await request.json()
    plan_id = data.get("plan_id")
    origin_url = data.get("origin_url")
    
    if plan_id not in PREMIUM_PLANS:
        raise HTTPException(status_code=400, detail="Invalid premium plan")
    
    if not origin_url:
        raise HTTPException(status_code=400, detail="origin_url required")
    
    plan = PREMIUM_PLANS[plan_id]
    amount = plan["price"]
    
    stripe_api_key = os.getenv("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/premium-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{origin_url}/dashboard"
    
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user.user_id,
            "plan_id": plan_id,
            "payment_type": "premium_subscription"
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    payment_doc = {
        "payment_id": f"pay_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "user_id": user.user_id,
        "plan_id": plan_id,
        "amount": amount,
        "currency": "usd",
        "payment_status": "pending",
        "payment_type": "premium",
        "created_at": datetime.now(timezone.utc)
    }
    await db.payment_transactions.insert_one(payment_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/premium/status/{session_id}")
async def get_premium_payment_status(session_id: str, request: Request):
    """Check premium payment status and activate subscription"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payment = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    

@api_router.get("/social/platforms")
async def get_social_platforms():
    """Get available social media platforms"""
    return {
        "platforms": [
            {"id": "twitter", "name": "Twitter/X", "icon": "twitter", "color": "#1DA1F2"},
            {"id": "facebook", "name": "Facebook", "icon": "facebook", "color": "#1877F2"},
            {"id": "instagram", "name": "Instagram", "icon": "instagram", "color": "#E4405F"},
            {"id": "linkedin", "name": "LinkedIn", "icon": "linkedin", "color": "#0A66C2"},
            {"id": "tiktok", "name": "TikTok", "icon": "tiktok", "color": "#000000"},
            {"id": "reddit", "name": "Reddit", "icon": "reddit", "color": "#FF4500"}
        ]
    }

@api_router.post("/social/connect")
async def connect_social_account(request: Request):
    """Connect a social media account"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = await request.json()
    platform = data.get("platform")
    platform_user_id = data.get("platform_user_id")
    username = data.get("username")
    access_token = data.get("access_token")
    profile_url = data.get("profile_url")
    
    if not platform or not username:
        raise HTTPException(status_code=400, detail="platform and username required")
    
    social_connection = {
        "platform_user_id": platform_user_id or "",
        "username": username,
        "access_token": access_token or "",
        "profile_url": profile_url or f"https://{platform}.com/{username}",
        "connected_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {f"connected_socials.{platform}": social_connection}}
    )
    
    return {"message": f"{platform} account connected successfully", "platform": platform}

@api_router.delete("/social/disconnect/{platform}")
async def disconnect_social_account(platform: str, request: Request):
    """Disconnect a social media account"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$unset": {f"connected_socials.{platform}": ""}}
    )
    
    return {"message": f"{platform} account disconnected"}

@api_router.get("/social/connected")
async def get_connected_socials(request: Request):
    """Get user's connected social media accounts"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "connected_socials": 1})
    
    return {"connected_socials": user_doc.get("connected_socials", {})}

@api_router.post("/social/share")
async def share_to_social(request: Request):
    """Log a social media share action"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = await request.json()
    content_type = data.get("content_type")
    content_id = data.get("content_id")
    platform = data.get("platform")
    
    share_doc = {
        "share_id": f"share_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "content_type": content_type,
        "content_id": content_id,
        "platform": platform,
        "created_at": datetime.now(timezone.utc)
    }
    await db.social_shares.insert_one(share_doc)
    
    if content_type == "topic":
        await db.topics.update_one(
            {"topic_id": content_id},
            {"$inc": {"share_count": 1}}
        )
    
    return {"message": "Share logged successfully"}

@api_router.get("/social/share-content/{content_type}/{content_id}")
async def get_share_content(content_type: str, content_id: str):
    """Get formatted content for social media sharing"""
    
    if content_type == "topic":
        topic = await db.topics.find_one({"topic_id": content_id}, {"_id": 0})
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        share_url = f"https://popoff.app/room/{content_id}"
        
        return {
            "title": f"Join me on Pop Off!: {topic['title']}",
            "description": topic['description'],
            "url": share_url,
            "hashtags": ["PopOff", "VideoChat", topic['category'].replace("-", "")],
            "image_url": "https://popoff.app/og-image.png"
        }
    
    elif content_type == "profile":
        user = await db.users.find_one({"user_id": content_id}, {"_id": 0, "name": 1, "bio": 1, "interests": 1})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        share_url = f"https://popoff.app/profile/{content_id}"
        
        interests_text = ", ".join(user.get("interests", [])[:3])
        
        return {
            "title": f"Check out {user['name']} on Pop Off!",
            "description": user.get("bio", f"Interested in {interests_text}. Join me for great conversations!"),
            "url": share_url,
            "hashtags": ["PopOff", "Connect"],
            "image_url": user.get("picture", "https://popoff.app/og-image.png")
        }
    
    raise HTTPException(status_code=400, detail="Invalid content type")


@api_router.post("/agora/token")
async def generate_agora_token(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = await request.json()
    channel_name = data.get("channel_name")
    
    if not channel_name:
        raise HTTPException(status_code=400, detail="channel_name required")
    
    app_id = os.getenv("AGORA_APP_ID")
    app_certificate = os.getenv("AGORA_APP_CERTIFICATE")
    
    if not app_id or not app_certificate:
        raise HTTPException(status_code=500, detail="Agora not configured")
    
    # Use 0 for uid to allow any user to join
    uid = 0
    expiration_seconds = 3600
    current_time = int(time.time())
    privilege_expired_ts = current_time + expiration_seconds
    
    from agora_token_builder import RtcTokenBuilder
    # Role 1 = Publisher (can publish audio/video)
    token = RtcTokenBuilder.buildTokenWithUid(
        app_id, app_certificate, channel_name, uid, 1, privilege_expired_ts
    )
    
    return TokenResponse(token=token, channel_name=channel_name, user_id=user.user_id)

@api_router.websocket("/ws/chat/{match_id}")
async def chat_websocket(websocket: WebSocket, match_id: str):
    await websocket.accept()
    
    try:
        init_data = await websocket.receive_json()
        user_data = init_data.get("user")
        
        if not user_data:
            await websocket.close(code=1008)
            return
        
        await connection_manager.connect(f"chat_{match_id}", websocket, user_data)
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            await connection_manager.broadcast(f"chat_{match_id}", {
                "type": "message",
                "user": user_data,
                "data": message.get("data"),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
    
    except WebSocketDisconnect:
        connection_manager.disconnect(f"chat_{match_id}", websocket)
    except Exception as e:
        logger.error("WebSocket error", error=str(e))
        connection_manager.disconnect(f"chat_{match_id}", websocket)

@api_router.websocket("/ws/{topic_id}")
async def websocket_endpoint(websocket: WebSocket, topic_id: str):
    await websocket.accept()
    
    try:
        init_data = await websocket.receive_json()
        user_data = init_data.get("user")
        
        if not user_data:
            await websocket.close(code=1008)
            return
        
        await connection_manager.connect(topic_id, websocket, user_data)
        
        await connection_manager.broadcast(topic_id, {
            "type": "user_joined",
            "user": {"name": user_data.get("name"), "user_id": user_data.get("user_id")},
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            await connection_manager.broadcast(topic_id, {
                "type": message.get("type", "message"),
                "user": user_data,
                "data": message.get("data"),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
    
    except WebSocketDisconnect:
        connection_manager.disconnect(topic_id, websocket)
        if websocket in connection_manager.user_info:
            user_data = connection_manager.user_info[websocket]
            await connection_manager.broadcast(topic_id, {
                "type": "user_left",
                "user": {"name": user_data.get("name"), "user_id": user_data.get("user_id")},
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
    except Exception as e:
        logger.error("WebSocket error", error=str(e))
        connection_manager.disconnect(topic_id, websocket)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger_std = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()