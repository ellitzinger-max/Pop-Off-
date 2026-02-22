import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Calendar, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Profile() {
  const [user, setUser] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, topicsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/topics`)
      ]);
      
      setUser(userRes.data);
      const myTopics = topicsRes.data.filter(t => t.creator_id === userRes.data.user_id);
      setTopics(myTopics);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 md:px-6 max-w-4xl py-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-8" data-testid="profile-title">My Profile</h1>
        
        {/* User Info Card */}
        <Card className="glass-effect shadow-xl mb-8" data-testid="profile-info-card">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-6">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={user?.picture} />
                <AvatarFallback className="bg-primary text-white text-3xl">
                  {user?.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <h2 className="text-2xl font-bold" data-testid="profile-name">{user?.name}</h2>
                
                <div className="flex items-center text-muted-foreground">
                  <Mail className="w-4 h-4 mr-2" />
                  <span data-testid="profile-email">{user?.email}</span>
                </div>
                
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Joined {new Date(user?.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Topics */}
        <Card className="glass-effect shadow-xl" data-testid="my-topics-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-6 h-6 mr-2" />
              My Topics ({topics.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topics.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="no-topics-message">
                You haven't created any topics yet
              </p>
            ) : (
              <div className="space-y-4">
                {topics.map((topic, index) => (
                  <div
                    key={topic.topic_id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-all"
                    data-testid={`my-topic-${index}`}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{topic.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{topic.description}</p>
                    </div>
                    <Badge className="bg-primary/20 text-primary">{topic.category}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}