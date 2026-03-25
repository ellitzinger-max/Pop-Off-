from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from agora_token_builder import RtcTokenBuilder
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'popoff_db')]

# Agora Configuration
AGORA_APP_ID = os.environ.get('AGORA_APP_ID', '746b1d39d5a5485f829f5b435f9a737e')
AGORA_APP_CERTIFICATE = os.environ.get('AGORA_APP_CERTIFICATE', '')

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'popoff-secret-key-change-in-production-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Pop Off! API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# =============================================================================
# MODELS
# =============================================================================

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    bio: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    age: Optional[int] = None
    profile_photo: Optional[str] = ""
    interests: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    profile_complete: bool = False

class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    age: Optional[int] = None
    profile_photo: Optional[str] = None
    interests: Optional[List[str]] = None
    profile_complete: Optional[bool] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class Topic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    icon: str = ""
    active_users: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MatchRequest(BaseModel):
    mood: str
    custom_message: Optional[str] = ""
    interests: List[str] = []

class Match(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    partner_id: Optional[str] = None
    mood: str
    custom_message: str = ""
    status: str = "searching"  # searching, matched, in_call, ended
    channel_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TokenResponse(BaseModel):
    token: str
    channel: str
    uid: int
    expires_in: int

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_channel_name() -> str:
    timestamp = int(datetime.now().timestamp())
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"popoff-{timestamp}-{random_str}"

# =============================================================================
# AUTH ROUTES
# =============================================================================

@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(user_data: UserCreate):
    # Check if email exists
    existing_user = await db.users.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email.lower(),
        "password_hash": get_password_hash(user_data.password),
        "bio": "",
        "city": "",
        "state": "",
        "age": None,
        "profile_photo": "",
        "interests": [],
        "created_at": datetime.utcnow(),
        "profile_complete": False
    }
    await db.users.insert_one(user)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    # Remove password and ObjectId from response
    user_response = {k: v for k, v in user.items() if k not in ["password_hash", "_id"]}
    if isinstance(user_response.get("created_at"), datetime):
        user_response["created_at"] = user_response["created_at"].isoformat()
    
    return AuthResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_response = {k: v for k, v in user.items() if k not in ["password_hash", "_id"]}
    if isinstance(user_response.get("created_at"), datetime):
        user_response["created_at"] = user_response["created_at"].isoformat()
    
    return AuthResponse(access_token=access_token, user=user_response)

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_response = {k: v for k, v in current_user.items() if k not in ["password_hash", "_id"]}
    if isinstance(user_response.get("created_at"), datetime):
        user_response["created_at"] = user_response["created_at"].isoformat()
    return user_response

# =============================================================================
# PROFILE ROUTES
# =============================================================================

@api_router.put("/profile")
async def update_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": current_user["id"]})
    user_response = {k: v for k, v in updated_user.items() if k not in ["password_hash", "_id"]}
    if isinstance(user_response.get("created_at"), datetime):
        user_response["created_at"] = user_response["created_at"].isoformat()
    
    return user_response

@api_router.post("/profile/photo")
async def upload_profile_photo(photo_data: dict, current_user: dict = Depends(get_current_user)):
    # Photo is expected as base64 string
    photo_base64 = photo_data.get("photo")
    if not photo_base64:
        raise HTTPException(status_code=400, detail="No photo provided")
    
    await db.users.update_one({"id": current_user["id"]}, {"$set": {"profile_photo": photo_base64}})
    return {"message": "Photo uploaded successfully"}

# =============================================================================
# TOPICS ROUTES
# =============================================================================

# Predefined topics
TOPICS_DATA = [
    # Mental Health
    {"name": "Anxiety", "category": "Mental Health", "icon": "brain"},
    {"name": "Depression", "category": "Mental Health", "icon": "cloud"},
    {"name": "Stress", "category": "Mental Health", "icon": "alert-circle"},
    {"name": "Self-Care", "category": "Mental Health", "icon": "heart"},
    {"name": "Therapy", "category": "Mental Health", "icon": "medical-bag"},
    {"name": "Mindfulness", "category": "Mental Health", "icon": "spa"},
    # Relationships
    {"name": "Dating", "category": "Relationships", "icon": "heart-outline"},
    {"name": "Friendship", "category": "Relationships", "icon": "people"},
    {"name": "Family", "category": "Relationships", "icon": "home"},
    {"name": "Breakups", "category": "Relationships", "icon": "heart-broken"},
    {"name": "Marriage", "category": "Relationships", "icon": "diamond"},
    {"name": "LGBTQ+", "category": "Relationships", "icon": "rainbow"},
    # Life & Career
    {"name": "Career Advice", "category": "Life & Career", "icon": "briefcase"},
    {"name": "School", "category": "Life & Career", "icon": "school"},
    {"name": "Finances", "category": "Life & Career", "icon": "cash"},
    {"name": "Life Changes", "category": "Life & Career", "icon": "refresh"},
    {"name": "Goals", "category": "Life & Career", "icon": "flag"},
    {"name": "Motivation", "category": "Life & Career", "icon": "rocket"},
    # Hobbies
    {"name": "Gaming", "category": "Hobbies", "icon": "game-controller"},
    {"name": "Music", "category": "Hobbies", "icon": "musical-notes"},
    {"name": "Movies", "category": "Hobbies", "icon": "film"},
    {"name": "Sports", "category": "Hobbies", "icon": "football"},
    {"name": "Art", "category": "Hobbies", "icon": "color-palette"},
    {"name": "Travel", "category": "Hobbies", "icon": "airplane"},
    {"name": "Food", "category": "Hobbies", "icon": "restaurant"},
    {"name": "Fitness", "category": "Hobbies", "icon": "barbell"},
    # Current Events
    {"name": "Politics", "category": "Current Events", "icon": "megaphone"},
    {"name": "News", "category": "Current Events", "icon": "newspaper"},
    {"name": "Social Issues", "category": "Current Events", "icon": "globe"},
    {"name": "Technology", "category": "Current Events", "icon": "phone-portrait"},
    {"name": "Environment", "category": "Current Events", "icon": "leaf"},
    # Just Vibing
    {"name": "Random Chat", "category": "Just Vibing", "icon": "chatbubbles"},
    {"name": "Making Friends", "category": "Just Vibing", "icon": "people-circle"},
    {"name": "Night Owls", "category": "Just Vibing", "icon": "moon"},
    {"name": "Vent Session", "category": "Just Vibing", "icon": "megaphone"},
    {"name": "Good Vibes Only", "category": "Just Vibing", "icon": "sunny"},
]

@api_router.get("/topics")
async def get_topics():
    return TOPICS_DATA

@api_router.get("/topics/categories")
async def get_topic_categories():
    categories = {}
    for topic in TOPICS_DATA:
        cat = topic["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(topic)
    return categories

# =============================================================================
# MATCHING & VIDEO CALL ROUTES
# =============================================================================

# Store active matches in memory (in production, use Redis)
active_searches = {}

@api_router.post("/match/search")
async def start_matching(match_request: MatchRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Check if user already has an active search
    if user_id in active_searches:
        existing = active_searches[user_id]
        if existing["status"] == "matched":
            response = {k: v for k, v in existing.items() if k != "_id"}
            if isinstance(response.get("created_at"), datetime):
                response["created_at"] = response["created_at"].isoformat()
            return response
    
    # Look for compatible match
    partner_id = None
    channel_name = None
    
    for search_user_id, search_data in list(active_searches.items()):
        if search_user_id != user_id and search_data["status"] == "searching":
            # Found a match!
            partner_id = search_user_id
            channel_name = generate_channel_name()
            
            # Update partner's match
            active_searches[partner_id]["status"] = "matched"
            active_searches[partner_id]["partner_id"] = user_id
            active_searches[partner_id]["channel_name"] = channel_name
            break
    
    # Create match record
    match_data = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "partner_id": partner_id,
        "mood": match_request.mood,
        "custom_message": match_request.custom_message or "",
        "status": "matched" if partner_id else "searching",
        "channel_name": channel_name,
        "created_at": datetime.utcnow()
    }
    
    active_searches[user_id] = match_data.copy()
    
    # Save to database (make a copy to avoid modifying original)
    db_data = match_data.copy()
    await db.matches.insert_one(db_data)
    
    # Return response without _id
    match_data["created_at"] = match_data["created_at"].isoformat()
    return match_data

@api_router.get("/match/status")
async def get_match_status(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    if user_id in active_searches:
        match_data = active_searches[user_id].copy()
        if isinstance(match_data.get("created_at"), datetime):
            match_data["created_at"] = match_data["created_at"].isoformat()
        return match_data
    
    return {"status": "idle"}

@api_router.post("/match/cancel")
async def cancel_matching(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    if user_id in active_searches:
        del active_searches[user_id]
    
    return {"message": "Match cancelled"}

@api_router.post("/match/end")
async def end_call(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    if user_id in active_searches:
        match_data = active_searches[user_id]
        partner_id = match_data.get("partner_id")
        
        # End for both users
        if partner_id and partner_id in active_searches:
            del active_searches[partner_id]
        del active_searches[user_id]
        
        # Update database
        await db.matches.update_one(
            {"id": match_data["id"]},
            {"$set": {"status": "ended", "ended_at": datetime.utcnow()}}
        )
    
    return {"message": "Call ended"}

# =============================================================================
# AGORA TOKEN ROUTES
# =============================================================================

@api_router.get("/agora/token", response_model=TokenResponse)
async def get_agora_token(channel: str, current_user: dict = Depends(get_current_user)):
    if not AGORA_APP_ID:
        raise HTTPException(status_code=500, detail="Agora not configured")
    
    # Generate UID from user ID
    uid = abs(hash(current_user["id"])) % (10**9)
    
    # Token expires in 1 hour
    expiration_seconds = 3600
    current_timestamp = int(datetime.now().timestamp())
    privilege_expired_ts = current_timestamp + expiration_seconds
    
    # If we have app certificate, generate a proper token
    if AGORA_APP_CERTIFICATE:
        try:
            token = RtcTokenBuilder.buildTokenWithUid(
                AGORA_APP_ID,
                AGORA_APP_CERTIFICATE,
                channel,
                uid,
                1,  # Role: Publisher
                privilege_expired_ts
            )
        except Exception as e:
            logging.error(f"Token generation error: {e}")
            # Return app ID as token for testing without certificate
            token = AGORA_APP_ID
    else:
        # No certificate - use app ID directly (for testing only)
        token = AGORA_APP_ID
    
    return TokenResponse(
        token=token,
        channel=channel,
        uid=uid,
        expires_in=expiration_seconds
    )

@api_router.get("/agora/app-id")
async def get_agora_app_id():
    return {"app_id": AGORA_APP_ID}

# =============================================================================
# MATCH HISTORY ROUTES
# =============================================================================

@api_router.get("/matches/history")
async def get_match_history(current_user: dict = Depends(get_current_user)):
    matches = await db.matches.find({
        "$or": [
            {"user_id": current_user["id"]},
            {"partner_id": current_user["id"]}
        ],
        "status": "ended"
    }).sort("created_at", -1).limit(50).to_list(50)
    
    for match in matches:
        match["_id"] = str(match["_id"])
        if isinstance(match.get("created_at"), datetime):
            match["created_at"] = match["created_at"].isoformat()
        if isinstance(match.get("ended_at"), datetime):
            match["ended_at"] = match["ended_at"].isoformat()
    
    return matches

# =============================================================================
# HOT TOPICS / TRENDING
# =============================================================================

@api_router.get("/hot")
async def get_hot_topics():
    # Get topics with most recent activity
    recent_matches = await db.matches.find({
        "created_at": {"$gte": datetime.utcnow() - timedelta(hours=24)}
    }).to_list(1000)
    
    # Count topics from moods
    mood_counts = {}
    for match in recent_matches:
        mood = match.get("mood", "")
        if mood:
            mood_counts[mood] = mood_counts.get(mood, 0) + 1
    
    # Sort by count
    hot_topics = sorted(mood_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return [{"topic": topic, "count": count} for topic, count in hot_topics]

# =============================================================================
# HEALTH CHECK
# =============================================================================

@api_router.get("/")
async def root():
    return {"message": "Pop Off! API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
