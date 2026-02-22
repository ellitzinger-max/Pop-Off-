import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Heart, MapPin, Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function SwipeMatch() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/matches/suggestions`, {
        withCredentials: true
      });
      setSuggestions(response.data);
    } catch (error) {
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action) => {
    if (swiping || currentIndex >= suggestions.length) return;
    
    setSwiping(true);
    const currentUser = suggestions[currentIndex];

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/matches/swipe`,
        {
          target_user_id: currentUser.user_id,
          action: action
        },
        { withCredentials: true }
      );

      if (response.data.match) {
        toast.success(`It's a match with ${currentUser.name}! 🎉`);
        setTimeout(() => navigate('/matches'), 1500);
      }

      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      toast.error('Swipe failed');
    } finally {
      setSwiping(false);
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

  const currentUser = suggestions[currentIndex];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-6 max-w-2xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2" data-testid="swipe-title">
            Find Your Match
          </h1>
          <p className="text-muted-foreground">Swipe to connect with people who share your interests</p>
        </div>

        {!currentUser ? (
          <Card className="glass-effect text-center py-20" data-testid="no-more-users">
            <CardContent>
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">No More Suggestions</h2>
              <p className="text-muted-foreground mb-6">
                Check back later for new people to connect with!
              </p>
              <Button onClick={() => navigate('/matches')} className="btn-primary rounded-full">
                View My Matches
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentUser.user_id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-effect overflow-hidden shadow-2xl" data-testid="swipe-card">
                  {/* User Image/Avatar */}
                  <div className="relative h-96 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    {currentUser.picture ? (
                      <img
                        src={currentUser.picture}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-9xl font-bold text-primary/30">
                        {currentUser.name[0].toUpperCase()}
                      </div>
                    )}
                    
                    {/* Match Score Badge */}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary text-white text-lg px-4 py-2">
                        {currentUser.match_score}% Match
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    {/* Name and Location */}
                    <div>
                      <h2 className="text-3xl font-bold" data-testid="user-name">{currentUser.name}</h2>
                      {currentUser.age && <span className="text-2xl text-muted-foreground">, {currentUser.age}</span>}
                      
                      {(currentUser.city || currentUser.state) && (
                        <div className="flex items-center text-muted-foreground mt-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>
                            {currentUser.city && `${currentUser.city}, `}{currentUser.state}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {currentUser.bio && (
                      <p className="text-lg leading-relaxed">{currentUser.bio}</p>
                    )}

                    {/* Common Interests */}
                    {currentUser.common_interests && currentUser.common_interests.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 text-primary">Common Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.common_interests.map((interest, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Interests */}
                    {currentUser.interests && currentUser.interests.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.interests.map((interest, idx) => (
                            <Badge key={idx} variant="outline">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Swipe Buttons */}
            <div className="flex justify-center items-center space-x-8 mt-8">
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleSwipe('pass')}
                disabled={swiping}
                className="w-20 h-20 rounded-full border-2 hover:border-red-500 hover:bg-red-50"
                data-testid="pass-btn"
              >
                <X className="w-10 h-10 text-red-500" />
              </Button>
              
              <Button
                size="lg"
                onClick={() => handleSwipe('like')}
                disabled={swiping}
                className="w-20 h-20 rounded-full btn-primary"
                data-testid="like-btn"
              >
                <Heart className="w-10 h-10" />
              </Button>
            </div>

            {/* Progress Indicator */}
            <div className="text-center mt-6 text-muted-foreground">
              {currentIndex + 1} / {suggestions.length}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}