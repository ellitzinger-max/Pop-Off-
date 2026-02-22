import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import '@/App.css';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import Dashboard from '@/pages/Dashboard';
import TrendingTopics from '@/pages/TrendingTopics';
import CreateTopic from '@/pages/CreateTopic';
import VideoRoom from '@/pages/VideoRoom';
import Profile from '@/pages/Profile';
import ProfileSetup from '@/pages/ProfileSetup';
import Preferences from '@/pages/Preferences';
import SocialConnections from '@/pages/SocialConnections';
import SwipeMatch from '@/pages/SwipeMatch';
import Matches from '@/pages/Matches';
import Chat from '@/pages/Chat';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';

function AppRouter() {
  const location = useLocation();
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/trending" element={<ProtectedRoute><TrendingTopics /></ProtectedRoute>} />
        <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
        <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
        <Route path="/social-connections" element={<ProtectedRoute><SocialConnections /></ProtectedRoute>} />
        <Route path="/swipe" element={<ProtectedRoute><SwipeMatch /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
        <Route path="/chat/:matchId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/create-topic" element={<ProtectedRoute><CreateTopic /></ProtectedRoute>} />
        <Route path="/room/:topicId" element={<ProtectedRoute><VideoRoom /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;