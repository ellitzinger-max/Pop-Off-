# Pop Off! - Product Requirements Document

## Overview
**Pop Off!** is a topic-based video chat platform where users can connect over video to discuss specific topics, vent frustrations, or socialize in a safe, judgment-free environment.

## Core Features

### Authentication
- [x] Email/password signup and login
- [x] Google Social Login (Emergent-managed)
- [ ] Two-Factor Authentication (2FA) with authenticator app

### Topic-Based Video Chat
- [x] Create and browse topics with categories
- [x] HD video chat rooms powered by Agora
- [x] Real-time WebSocket messaging
- [x] Participant limits per room

### Discovery & Matching
- [x] Browse topics by category
- [x] Trending topics page with categories
- [x] **Search bar** for finding specific topics ✅ IMPLEMENTED
- [x] Swipe-and-match feature based on interests
- [x] Advanced user preferences (age, gender, etc.)

### Monetization
- [x] **Topic Boost** with Stripe integration ✅ IMPLEMENTED
  - 24-Hour Boost ($4.99)
  - 7-Day Boost ($19.99)
  - Featured Placement ($29.99)
- [x] **In-app currency** earned by watching reward ads ✅ IMPLEMENTED (MOCKED)
- [x] **Native Ads** placeholder ✅ IMPLEMENTED (MOCKED)
- [ ] Premium subscription to remove ads

### Social & Engagement
- [x] **Social Media Linking** ✅ IMPLEMENTED
  - Twitter/X, Facebook, Instagram, LinkedIn, TikTok, Reddit
- [x] **Social Sharing** component for topics ✅ IMPLEMENTED
- [x] User profiles with interests
- [x] AI-powered report moderation (OpenAI)

### Gamification (Upcoming)
- [ ] Daily active user streaks
- [ ] Engagement badges
- [ ] Ice-breaker prompts
- [ ] Smart notifications

## Technical Stack

### Frontend
- React with Tailwind CSS
- Shadcn/UI components
- Framer Motion for animations
- Sonner for toast notifications

### Backend
- FastAPI (Python)
- MongoDB (motor async driver)
- Agora SDK for video
- Stripe for payments
- OpenAI for AI moderation

### Integrations
- **Agora**: Video chat functionality
- **Stripe**: Payment processing (test keys configured)
- **OpenAI**: AI-powered content moderation
- **Emergent Google Auth**: Social login

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/session` - Google OAuth callback
- `GET /api/auth/me` - Get current user

### Topics
- `GET /api/topics` - List all active topics
- `GET /api/topics/search` - Search topics by keyword
- `POST /api/topics` - Create new topic
- `GET /api/trending/{category}` - Get trending topics

### Boost & Monetization
- `GET /api/boost/packages` - Get available boost packages
- `POST /api/boost/checkout` - Create Stripe checkout session
- `GET /api/boost/status/{session_id}` - Check payment status

### Ads & Currency
- `GET /api/ads/config` - Get user's ad config
- `POST /api/ads/reward` - Grant coins for watching ad

### Social
- `GET /api/social/platforms` - List available platforms
- `POST /api/social/connect` - Connect social account
- `GET /api/social/connected` - Get connected accounts
- `POST /api/social/share` - Log a share action

## Database Collections
- `users` - User profiles and preferences
- `topics` - Topic rooms
- `matches` - User matches
- `chat_messages` - Chat history
- `reports` - User reports
- `payment_transactions` - Stripe transactions
- `ad_views` - Ad view history
- `social_shares` - Share tracking

## What's Been Implemented (Feb 2026)

### Session 1 - Core Features
- Full-stack app scaffold
- Video chat with Agora
- Topic creation and browsing
- User authentication (email + Google)
- Swipe matching system
- AI moderation for reports
- Trending topics with categories
- User preferences page

### Session 2 - Monetization & Social Features
- **Topic Boost** with Stripe checkout ✅
- **Reward Video Ads** with coins system (MOCKED) ✅
- **Native Ads** placeholder component (MOCKED) ✅
- **Social Media Connections** page ✅
- **Social Sharing** component on topic cards ✅
- **Search Bar** for topics ✅
- Global "Pop Off" → "Pop Off!" branding ✅

## Pending Tasks

### High Priority (P0)
1. Complete 2FA implementation with authenticator app

### Medium Priority (P1)
2. Implement gamification MVP (streaks + badges + ice-breakers)
3. Replace mocked ads with real ad network integration

### Low Priority (P2)
4. Premium subscription for ad removal
5. Backend refactoring (split large server.py into modules)

## Known Mocked Components
- `NativeAd.jsx` - Displays placeholder with "MOCK AD - Integration Pending"
- `RewardAdModal.jsx` - 5-second countdown simulation instead of real video ad

## UI/UX Design
- Color scheme: Red, orange, and yellow gradient
- Glass-morphism effects
- Modern rounded components
- Responsive design

## Environment Variables Required
```
# Backend
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
EMERGENT_LLM_KEY=your_key
STRIPE_API_KEY=sk_test_...

# Frontend
REACT_APP_BACKEND_URL=https://your-app.preview.emergentagent.com
REACT_APP_AGORA_APP_ID=your_agora_app_id
```
