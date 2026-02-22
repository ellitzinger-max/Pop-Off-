# Pop Off - Matching & Moderation Features Guide

## New Features Overview

### 1. Swipe & Match System
Find conversation partners based on shared interests, location, and activity level using a Tinder-style swipe interface.

### 2. AI-Powered Content Moderation
Automated system that analyzes user behavior and enforces community guidelines using OpenAI GPT-4o.

---

## Swipe & Match Feature

### How It Works

**Matching Algorithm**:
- **Common Interests (40% weight)**: Prioritizes users who share your selected interests
- **Location Proximity (30% weight)**: Prefers users in same city/state
- **Activity Level (30% weight)**: Matches with active users who create topics

**User Flow**:
1. Complete profile setup (`/profile-setup`)
2. Select interests, add bio, location, and age
3. Navigate to "Find Matches" (`/swipe`)
4. Swipe right (like) or left (pass) on suggested users
5. When both users like each other, it's a match!
6. View matches at `/matches`
7. Start chatting at `/chat/{matchId}`

### API Endpoints

#### GET `/api/matches/suggestions`
Returns personalized match suggestions with scoring

**Response**:
```json
[
  {
    "user_id": "user_abc123",
    "name": "Alex",
    "bio": "Love discussing mental health...",
    "interests": ["Mental Health", "Fitness", "Books"],
    "city": "San Francisco",
    "state": "CA",
    "age": 28,
    "match_score": 87.5,
    "common_interests": ["Mental Health", "Fitness"]
  }
]
```

#### POST `/api/matches/swipe`
Record swipe action and check for match

**Request**:
```json
{
  "target_user_id": "user_abc123",
  "action": "like" // or "pass"
}
```

**Response**:
```json
{
  "match": true,
  "match_id": "match_xyz789"
}
```

#### GET `/api/matches`
Get all matches for current user

#### GET `/api/chat/{match_id}`
Get chat history for a match

#### POST `/api/chat`
Send a message to a match

**Request**:
```json
{
  "match_id": "match_xyz789",
  "message": "Hey! Loved your bio about mental health"
}
```

---

## AI Content Moderation System

### How It Works

**Report Categories**:
1. **Hate Speech**: Discriminatory language, slurs, violence against groups
2. **Illegal Activity**: Discussion or promotion of illegal acts
3. **Nudity**: Explicit sexual content or nudity requests
4. **Transactions**: Attempting to sell products/services
5. **Harassment**: Threatening, bullying, or stalking
6. **Spam**: Repetitive promotional content

**Moderation Process**:
1. User submits report via Report button (in chat or video room)
2. System gathers reported user's message history (last 50 messages)
3. OpenAI GPT-4o analyzes the content for violations
4. AI provides:
   - Violation found: true/false
   - Confidence level: high/medium/low
   - Reasoning for decision
   - Recommended action

**Automated Actions**:
- **No Action**: No violation found
- **Warning**: Low confidence violation (logged)
- **1-Day Suspension**: First offense or medium confidence
- **7-Day Suspension**: Second offense or high confidence severe violation
- **Permanent Ban**: Third offense or extremely severe violations

**Progressive Discipline**:
- Suspension count tracked per user
- Multiple suspensions lead to harsher penalties
- After 3+ suspensions, user is at risk of permanent ban

### API Endpoints

#### POST `/api/reports`
Submit a user report

**Request**:
```json
{
  "reported_user_id": "user_abc123",
  "category": "hate_speech",
  "description": "User made discriminatory comments",
  "context": "In chat during video call about relationships"
}
```

**Response**:
```json
{
  "report_id": "report_xyz789",
  "message": "Report submitted successfully"
}
```

**Background Processing**:
After submission, the system automatically:
1. Fetches user's recent messages
2. Calls OpenAI GPT-4o for analysis
3. Updates report with AI analysis
4. Applies suspension if violation confirmed

### Database Schema

**Reports Collection**:
```javascript
{
  report_id: "report_xyz789",
  reporter_id: "user_def456",
  reported_user_id: "user_abc123",
  category: "hate_speech",
  description: "User made discriminatory comments",
  context: "In video chat",
  status: "reviewed", // pending, reviewed, failed
  ai_analysis: {
    violation_found: true,
    confidence: "high",
    reasoning: "User used discriminatory slurs...",
    recommended_action: "suspension_7days"
  },
  created_at: "2026-02-17T..."
}
```

**Suspensions Collection**:
```javascript
{
  suspension_id: "susp_xyz789",
  user_id: "user_abc123",
  reason: "suspension_7days",
  suspended_until: "2026-02-24T...",
  created_at: "2026-02-17T..."
}
```

**Users Collection** (updated fields):
```javascript
{
  // ... existing fields
  suspension_count: 2,
  is_suspended: true,
  suspended_until: "2026-02-24T..."
}
```

---

## Profile Setup

Users must complete their profile to use matching features.

**Required Fields**:
- **Interests**: Select 1-10 interests from predefined list

**Optional Fields**:
- **Bio**: Short description
- **City & State**: For location-based matching
- **Age**: For demographic matching

**Available Interests**:
Relationships, Mental Health, News & Politics, Movies & TV, Books & Reading, Music, Sports, Gaming, Fitness, Cooking, Travel, Art & Design, Technology, Career, Parenting, Spirituality, Fashion, Photography, Science, Humor

---

## Usage Tips

### For Users

**Improving Match Quality**:
1. Select diverse interests (not just one category)
2. Write an engaging bio
3. Add accurate location for local matches
4. Stay active by creating topics

**Reporting Best Practices**:
- Be specific in your description
- Select the most appropriate category
- Provide context (when/where it happened)
- Report genuine violations only

### For Admins

**Monitoring Suspensions**:
```javascript
// Check suspended users
db.users.find({ is_suspended: true })

// View recent reports
db.reports.find().sort({ created_at: -1 }).limit(10)

// Check suspension history
db.suspensions.find({ user_id: "user_abc123" })
```

**Manual Review** (if needed):
```javascript
// Update report status
db.reports.updateOne(
  { report_id: "report_xyz789" },
  { $set: { status: "manual_review" } }
)

// Lift suspension early
db.users.updateOne(
  { user_id: "user_abc123" },
  { $set: { is_suspended: false, suspended_until: null } }
)
```

---

## Technical Implementation

### OpenAI Integration

Using `emergentintegrations` library with Emergent LLM Key:

```python
from emergentintegrations.llm.chat import LlmChat, UserMessage

api_key = os.getenv("EMERGENT_LLM_KEY")

chat = LlmChat(
    api_key=api_key,
    session_id=f"moderation_{report_id}",
    system_message="You are an expert content moderator..."
).with_model("openai", "gpt-4o")

response = await chat.send_message(UserMessage(text=moderation_prompt))
```

### WebSocket for Real-time Chat

```javascript
const wsUrl = `wss://your-app.com/api/ws/chat/${matchId}`;
const ws = new WebSocket(wsUrl);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'new_message') {
    addMessageToUI(data.message);
  }
};
```

---

## Privacy & Safety

**Data Storage**:
- Chat messages stored for moderation purposes
- Messages analyzed only when reports filed
- User location limited to city/state level
- No precise geolocation tracking

**User Protection**:
- Progressive discipline system
- AI analysis reduces bias
- Appeal process (manual review available)
- Block functionality (coming soon)

**GDPR Compliance**:
- Users can request data deletion
- Clear privacy policy about AI moderation
- Transparent suspension reasons

---

## Future Enhancements

- [ ] Block users functionality
- [ ] Appeal system for suspensions
- [ ] Video frame analysis for nudity detection
- [ ] Admin dashboard for reports
- [ ] User karma/reputation system
- [ ] Match preferences (age range, distance)
- [ ] Ice breaker prompts for chats
- [ ] Voice message support

---

## Testing

### Test Matching Flow:
1. Create 2 test users with overlapping interests
2. Complete profiles for both
3. Log in as User A, swipe right on User B
4. Log in as User B, swipe right on User A
5. Verify match created
6. Send messages between users

### Test Moderation:
1. Create test user
2. Send messages with test violations
3. Submit report
4. Check AI analysis in database
5. Verify suspension applied if violation found

---

**Built with safety and connection in mind** 💜
