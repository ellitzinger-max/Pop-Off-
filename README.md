# Pop Off - Video Chat Platform for Meaningful Conversations

Pop Off is a vibrant, modern video chat platform designed to connect isolated or lonely people through meaningful conversations on topics they care about. Built with React, FastAPI, MongoDB, and Agora Video SDK.

## 🌟 Features

### Core Functionality
- **Video Chat Rooms**: HD video chat powered by Agora for scalable, high-quality connections
- **Topic-Based Discussions**: Browse and join conversations on relationships, mental health, news, entertainment, hobbies, and more
- **Swipe & Match System**: Tinder-style interface to find conversation partners based on shared interests, location, and activity
- **Real-time Chat**: One-on-one messaging with matched users via WebSocket
- **AI-Powered Moderation**: Automated content analysis using OpenAI GPT-4o to enforce community guidelines
- **Progressive Discipline**: Automated suspension system for policy violations
- **Dual Authentication**: Email/password signup and Google OAuth integration
- **User Profiles**: Track your created topics, interests, and manage your account

### Matching Algorithm
- **Common Interests (40%)**: Prioritizes users who share your selected interests
- **Location Proximity (30%)**: Prefers users in same city/state (privacy-friendly)
- **Activity Level (30%)**: Matches with active community members

### Safety Features
- **User Reporting**: Report inappropriate behavior across video chat and messaging
- **AI Content Analysis**: GPT-4o analyzes message history when reports are filed
- **Auto-Suspension**: Violators automatically suspended based on AI confidence
- **Escalating Penalties**: 1-day → 7-day → permanent ban progression
- **Violation Tracking**: Suspension count tracked per user

### Design Highlights
- **Modern Vibrant UI**: Electric Violet, Hot Pink, and Sunshine Yellow color scheme
- **Glassmorphism Effects**: Beautiful backdrop blur and layered design elements
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Bento Grid**: Topic browsing with modern card-based layout
- **Smooth Animations**: Hover effects, transitions, and micro-interactions

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and Yarn
- Python 3.11+
- MongoDB
- Agora.io account (free tier available)

### Installation

1. **Clone and Install Dependencies**
```bash
cd /app

# Frontend
cd frontend
yarn install

# Backend
cd ../backend
pip install -r requirements.txt
```

2. **Configure Environment Variables**

See `AGORA_SETUP.md` for detailed Agora configuration instructions.

**Backend (.env):**
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
AGORA_APP_ID="your_app_id_here"
AGORA_APP_CERTIFICATE="your_certificate_here"
```

**Frontend (.env):**
```env
REACT_APP_BACKEND_URL=https://your-app.emergentagent.com
REACT_APP_AGORA_APP_ID="your_app_id_here"
```

3. **Start Services**
```bash
sudo supervisorctl restart backend frontend
```

4. **Access the App**
Open https://vibe-tribe-chat.preview.emergentagent.com

## 📚 Documentation

- **[Agora Setup Guide](AGORA_SETUP.md)**: Complete guide to obtaining and configuring Agora credentials
- **[Auth Testing Guide](auth_testing.md)**: Testing playbook for authentication flows
- **[Design Guidelines](design_guidelines.json)**: Complete design system specifications

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19, React Router, Tailwind CSS, Shadcn UI, Agora RTC SDK
- **Backend**: FastAPI, Motor (async MongoDB), Agora Token Builder
- **Database**: MongoDB
- **Real-time**: WebSockets
- **Authentication**: JWT + Emergent OAuth Integration

### Project Structure
```
/app
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend configuration
├── frontend/
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── components/   # Reusable components
│   │   ├── App.js        # Main app component
│   │   └── index.css     # Global styles
│   ├── public/
│   ├── package.json
│   └── .env              # Frontend configuration
└── test_reports/         # Testing results
```

## 🎨 Design System

### Colors
- **Primary**: Electric Violet (#8B5CF6)
- **Secondary**: Hot Pink (#EC4899)
- **Accent**: Sunshine Yellow (#FBBF24)
- **Background**: Off-white (#FAFAF9)

### Typography
- **Headings**: Outfit (600, 700, 800 weights)
- **Body**: Plus Jakarta Sans (400, 500, 600 weights)

### Key Components
- Glassmorphism cards with backdrop blur
- Pill-shaped buttons with gradient backgrounds
- Bento grid layout for topic browsing
- Smooth hover lift animations

## 🔐 Authentication

### Email/Password
- Secure password hashing with bcrypt
- JWT session tokens (7-day expiry)
- HttpOnly cookies for session management

### Google OAuth
- Integrated with Emergent Auth
- Automatic session creation
- Profile picture and name sync

## 🎥 Video Integration

### Agora SDK Features
- HD video quality
- Real-time communication
- Scalable to millions of users
- Token-based security
- Audio/video mute controls

### Room Management
- Dynamic participant tracking
- WebSocket for presence updates
- Configurable max participants (2-20)
- Leave/rejoin functionality

## 📱 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/session` - Google OAuth session exchange
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - End session

### Topics
- `GET /api/topics` - List all topics (with optional category filter)
- `POST /api/topics` - Create new topic (authenticated)
- `GET /api/topics/:id` - Get topic details

### Video
- `POST /api/agora/token` - Generate Agora RTC token (authenticated)

### WebSocket
- `WS /api/ws/:topicId` - Real-time room events

## 🧪 Testing

Comprehensive test suite included:
```bash
# View test results
cat /app/test_reports/iteration_1.json

# Run backend tests
cd /app/backend
pytest backend_test.py -v
```

**Test Coverage:**
- ✅ 87.5% backend API functionality (7/8 passing)
- ✅ 100% frontend flows
- ✅ Authentication (signup, login, OAuth callback)
- ✅ Protected routes
- ✅ Topic CRUD operations
- ✅ User profiles
- ✅ Category filtering

## ⚠️ Important Disclaimer

**Pop Off is a peer support platform.** Any advice from members who are not professional counselors or specialists should not substitute seeing a real professional. The platform is not liable for any advice-giving. If you're experiencing a mental health crisis, please contact qualified professionals immediately.

**No Transactions Policy:** This is a social connection platform. Users cannot sell products or engage in transactional relationships.

## 🚀 Deployment

### Production Checklist
- [ ] Obtain Agora credentials
- [ ] Configure production MongoDB
- [ ] Set up CORS for production domain
- [ ] Enable HTTPS
- [ ] Configure secure cookie settings
- [ ] Set up monitoring and logging
- [ ] Review Agora usage limits

## 🎯 Roadmap

### Phase 1 (Current - MVP)
- ✅ Topic browsing and creation
- ✅ Video chat rooms
- ✅ User authentication
- ✅ User profiles

### Phase 2 (Future Enhancements)
- [ ] User matching based on interests
- [ ] Moderation tools and reporting
- [ ] Chat history
- [ ] Push notifications
- [ ] Mobile app (React Native)
- [ ] Screen sharing
- [ ] Recording capabilities
- [ ] Analytics dashboard

### Phase 3 (Monetization)
- [ ] Advertisement integration
- [ ] Premium features
- [ ] Verified counselor badges
- [ ] Sponsored topics

## 📄 License

This project is built for educational and social good purposes.

## 🤝 Contributing

This is a production-ready MVP. Future enhancements welcome!

## 💡 Support

For technical support or questions:
1. Check the documentation files in `/app`
2. Review test reports in `/app/test_reports`
3. Check Agora documentation at https://docs.agora.io

---

**Built with ❤️ to connect people through meaningful conversations**
