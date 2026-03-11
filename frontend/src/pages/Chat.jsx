import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft, Flag, Video } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { ReportModal } from '@/components/ReportModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [match, setMatch] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchData();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchData = async () => {
    try {
      const [userRes, matchesRes, messagesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/matches`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/chat/${matchId}`, { withCredentials: true })
      ]);
      
      setUser(userRes.data);
      const currentMatch = matchesRes.data.find(m => m.match_id === matchId);
      setMatch(currentMatch);
      setMessages(messagesRes.data);
    } catch (error) {
      toast.error('Failed to load chat');
      navigate('/matches');
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const wsUrl = `${BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')}/api/ws/chat/${matchId}`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      wsRef.current?.send(JSON.stringify({
        user: { user_id: user?.user_id, name: user?.name }
      }));
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        setMessages(prev => [...prev, data.message]);
      }
    };
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(
        `${BACKEND_URL}/api/chat`,
        { match_id: matchId, message: newMessage },
        { withCredentials: true }
      );
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const otherUser = match?.other_user;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar user={user} />
      
      {/* Chat Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/matches')}
                data-testid="back-to-matches-btn"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <Avatar className="w-12 h-12">
                <AvatarImage src={otherUser?.picture} />
                <AvatarFallback className="bg-primary text-white">
                  {otherUser?.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="font-bold text-lg" data-testid="chat-user-name">{otherUser?.name}</h2>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate(`/video-call/${matchId}`)}
                className="btn-primary rounded-full"
                data-testid="start-video-call-btn"
              >
                <Video className="h-4 w-4 mr-2" />
                Video Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReport(true)}
                data-testid="report-user-btn"
              >
                <Flag className="h-4 w-4 mr-2" />
                Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl py-6 space-y-4" data-testid="messages-container">
          {messages.map((msg, index) => {
            const isOwn = msg.sender_id === user?.user_id;
            
            return (
              <div
                key={msg.message_id || index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${index}`}
              >
                <div
                  className={`max-w-md px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-muted rounded-bl-none'
                  }`}
                >
                  <p className="break-words">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    isOwn ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl py-4">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              data-testid="message-input"
            />
            <Button type="submit" className="btn-primary rounded-full px-6" data-testid="send-message-btn">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {showReport && (
        <ReportModal
          reportedUserId={otherUser?.user_id}
          reportedUserName={otherUser?.name}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}