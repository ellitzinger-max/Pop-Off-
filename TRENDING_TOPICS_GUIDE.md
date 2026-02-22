# Trending Topics Feature - Pop Off

## Overview

The Trending Topics feature provides curated category-based video chat rooms with a maximum of 10 participants per session. Topics are automatically ranked by popularity using a trending algorithm.

## Categories

### 1. **Trending News/Current Events** (`trending-news`)
Discuss breaking news, politics, world events, and current affairs.

### 2. **Pop Culture** (`pop-culture`)  
Talk about celebrities, viral trends, memes, social media, and entertainment industry news.

### 3. **Books/Film/Music/Other Media** (`media`)
Discuss movies, TV shows, books, music, podcasts, and all forms of media.

### 4. **Art/Cooking/DIY** (`creative`)
Share creative pursuits including art, cooking recipes, DIY projects, crafts, and hobbies.

## Features

### Room Capacity Management
- **Maximum 10 users per room** enforced at backend
- Real-time participant count display
- "Room Full" indicator prevents joining overcrowded rooms
- Automatic participant tracking (join/leave)

### Trending Algorithm

Topics are scored based on three factors:

```javascript
trending_score = (recency_score * 1.0) + (view_score * 1.0) + (participant_score * 1.0)

where:
- recency_score = max(0, 100 - hours_old * 2)  // Newer topics score higher
- view_score = view_count * 5                   // Each view adds 5 points
- participant_score = current_participants * 20 // Active rooms score higher
```

**Visual Indicators**:
- 🔥 **Hot** (score > 200): Orange border, "Hot" badge
- ⭐ **Popular** (score > 100): Primary border, "Popular" badge
- Regular: Standard styling

### API Endpoints

#### GET `/api/trending/categories`
Returns all available trending categories

**Response**:
```json
{
  "categories": [
    {"id": "trending-news", "name": "Trending News/Current Events"},
    {"id": "pop-culture", "name": "Pop Culture"},
    {"id": "media", "name": "Books/Film/Music/Other Media"},
    {"id": "creative", "name": "Art/Cooking/DIY"}
  ]
}
```

#### GET `/api/trending/{category}`
Get trending topics for a specific category, sorted by trending score

**Parameters**:
- `category`: Category ID (trending-news, pop-culture, media, creative)
- `limit`: Maximum topics to return (default: 20)

**Response**:
```json
[
  {
    "topic_id": "topic_abc123",
    "title": "Discussing the latest AI developments",
    "description": "Let's talk about GPT-5 and its impact",
    "category": "trending-news",
    "creator_id": "user_xyz",
    "creator_name": "Alex",
    "max_participants": 10,
    "current_participants": 7,
    "active": true,
    "is_trending": false,
    "view_count": 45,
    "trending_score": 215.5,
    "created_at": "2026-02-17T..."
  }
]
```

#### POST `/api/topics/{topic_id}/join`
Join a topic room (increments participant count and view count)

**Response**:
```json
{
  "message": "Joined successfully",
  "current_participants": 8
}
```

**Errors**:
- `409`: Room is full (10/10 participants)
- `404`: Topic not found
- `401`: Not authenticated

#### POST `/api/topics/{topic_id}/leave`
Leave a topic room (decrements participant count)

**Response**:
```json
{
  "message": "Left successfully"
}
```

## Frontend Implementation

### TrendingTopics Page (`/trending`)

**Features**:
- Category tabs for easy navigation
- Grid layout showing trending topics
- Real-time participant count
- Visual indicators for hot/popular topics
- Join button with capacity check
- Responsive design for mobile/desktop

**States**:
- **Empty state**: Shows "No Active Conversations" with CTA to create topic
- **Loading state**: Spinner while fetching data
- **Error state**: Toast notification on API failure
- **Full room state**: Disabled join button with "Room Full" message

### Creating Trending Topics

Users can create topics in trending categories from `/create-topic` page:

**New Categories Available**:
- 🔥 Trending News/Current Events
- ⭐ Pop Culture
- 📚 Books/Film/Music/Media
- 🎨 Art/Cooking/DIY

**Defaults**:
- `max_participants`: 10 (enforced for trending categories)
- `is_trending`: false (set to true by admin/algorithm)
- `view_count`: 0 (incremented on joins)
- `trending_score`: 0 (calculated automatically)

## User Flow

1. **Navigate to Trending** (`/trending`)
2. **Select Category**: Click on category tab
3. **Browse Topics**: View trending conversations with scores
4. **Check Capacity**: See X/10 participants before joining
5. **Join Room**: Click "Join Video Chat" button
6. **Participate**: Video chat opens in `/room/{topic_id}`
7. **Leave Room**: Participant count auto-decrements on leave

## Database Schema

**Topics Collection** (extended):
```javascript
{
  topic_id: "topic_abc123",
  title: "Discussing the latest AI developments",
  description: "Let's talk about GPT-5 and its impact",
  category: "trending-news", // New trending categories
  creator_id: "user_xyz",
  creator_name: "Alex",
  max_participants: 10,
  current_participants: 7,  // Real-time tracking
  active: true,
  is_trending: false,       // NEW: Manual trending flag
  view_count: 45,           // NEW: Total views
  trending_score: 215.5,    // NEW: Calculated score
  created_at: "2026-02-17T..."
}
```

## Navigation Updates

**Navbar**:
- New "🔥 Trending" link (first position for prominence)
- Highlighted with fire emoji for visibility

**Landing Page**:
- "Explore Trending" CTA button (coming soon)

## Admin Features (Future)

Potential admin capabilities:
- Manually promote topics to trending
- Set custom trending score multipliers
- Feature specific conversations
- Analytics dashboard for trending metrics

## Best Practices

### For Users

**Creating Trending Topics**:
- Use attention-grabbing titles
- Be specific about discussion focus
- Post during peak hours (evenings/weekends)
- Choose the right category

**Joining Trending Rooms**:
- Join early before rooms fill up
- Check participant count before joining
- Be prepared for active discussions
- Respect the 10-person limit

### For Developers

**Scaling Considerations**:
- Consider caching trending scores (update every 5 minutes)
- Implement connection pooling for high traffic
- Add rate limiting on join/leave endpoints
- Monitor room capacity across multiple servers

**Performance**:
- Index on `category` and `trending_score` fields
- Limit query results to 20-50 topics per category
- Use projection to exclude unnecessary fields
- Implement pagination for large result sets

## Analytics

**Trackable Metrics**:
- Views per topic
- Join rate (joins / views)
- Average participants per room
- Peak activity times per category
- Popular categories
- User retention in trending vs regular topics

## Future Enhancements

- [ ] Real-time trending score updates via WebSocket
- [ ] Scheduled/recurring trending topics
- [ ] "Coming Up" section for scheduled events
- [ ] User notifications for new hot topics in interests
- [ ] Trending topic history/archives
- [ ] Category-specific moderators
- [ ] Featured creators program
- [ ] Trending badges for users

---

**Join the conversation!** 🔥
