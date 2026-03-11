import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Video } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/matches`, {
        withCredentials: true
      });
      setMatches(response.data);
    } catch (error) {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-6 max-w-4xl py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2" data-testid="matches-title">
              My Matches
            </h1>
            <p className="text-muted-foreground">Connect with people you've matched with</p>
          </div>
          <Badge className="bg-primary text-white text-lg px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            {matches.length}
          </Badge>
        </div>

        {matches.length === 0 ? (
          <Card className="glass-effect text-center py-20" data-testid="no-matches">
            <CardContent>
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Matches Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start swiping to find people who share your interests!
              </p>
              <button
                onClick={() => navigate('/swipe')}
                className="btn-primary px-6 py-3 rounded-full font-semibold"
              >
                Start Swiping
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" data-testid="matches-list">
            {matches.map((match, index) => (
              <Card
                key={match.match_id}
                className="hover-lift glass-effect"
                data-testid={`match-card-${index}`}
              >
                <CardContent className="flex items-center justify-between p-6">
                  <div 
                    className="flex items-center space-x-4 flex-1 cursor-pointer"
                    onClick={() => navigate(`/chat/${match.match_id}`)}
                  >
                    <Avatar className="w-16 h-16 border-2 border-primary/20">
                      <AvatarImage src={match.other_user.picture} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xl">
                        {match.other_user.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{match.other_user.name}</h3>
                      
                      {match.last_message ? (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {match.last_message.message}
                        </p>
                      ) : (
                        <p className="text-sm text-primary">Start a conversation!</p>
                      )}
                      
                      {match.other_user.interests && match.other_user.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {match.other_user.interests.slice(0, 3).map((interest, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/video-call/${match.match_id}`)}
                      className="rounded-full text-pink-500 border-pink-300 hover:bg-pink-50"
                      data-testid={`video-call-btn-${index}`}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Video
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/chat/${match.match_id}`)}
                      className="rounded-full btn-primary"
                      data-testid={`chat-btn-${index}`}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}