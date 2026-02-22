import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, Flame, Clock, Video } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function TrendingTopics() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchTrendingTopics(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/trending/categories`);
      setCategories(response.data.categories);
      if (response.data.categories.length > 0) {
        setSelectedCategory(response.data.categories[0].id);
      }
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingTopics = async (category) => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/trending/${category}`);
      setTopics(response.data);
    } catch (error) {
      toast.error('Failed to load trending topics');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (topicId) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/topics/${topicId}/join`,
        {},
        { withCredentials: true }
      );
      navigate(`/room/${topicId}`);
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Room is full! Try another topic.');
      } else if (error.response?.status === 401) {
        toast.error('Please login to join rooms');
        navigate('/login');
      } else {
        toast.error('Failed to join room');
      }
    }
  };

  const getTrendingIcon = (score) => {
    if (score > 200) return <Flame className="w-4 h-4 text-orange-500" />;
    if (score > 100) return <TrendingUp className="w-4 h-4 text-primary" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-6 max-w-7xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3" data-testid="trending-title">
            <TrendingUp className="inline-block w-10 h-10 mr-3 text-primary" />
            Trending Conversations
          </h1>
          <p className="text-muted-foreground text-lg">
            Join popular video chats happening right now (max 10 people per room)
          </p>
        </div>

        {loading && categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading trending topics...</p>
          </div>
        ) : (
          <>
            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
              <TabsList className="w-full justify-start flex-wrap h-auto bg-muted/50 p-2 rounded-2xl">
                {categories.map(cat => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="rounded-full px-6"
                    data-testid={`category-${cat.id}`}
                  >
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Trending Topics Grid */}
            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto"></div>
              </div>
            ) : topics.length === 0 ? (
              <Card className="text-center py-16 glass-effect" data-testid="no-topics">
                <CardContent>
                  <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-2xl font-bold mb-2">No Active Conversations</h2>
                  <p className="text-muted-foreground mb-6">
                    Be the first to start a trending conversation in this category!
                  </p>
                  <Button
                    onClick={() => navigate('/create-topic')}
                    className="btn-primary rounded-full"
                    data-testid="create-first-trending-btn"
                  >
                    Start a Conversation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="trending-grid">
                {topics.map((topic, index) => {
                  const isFull = topic.current_participants >= topic.max_participants;
                  const isHot = topic.trending_score > 200;
                  const isPopular = topic.trending_score > 100;

                  return (
                    <Card
                      key={topic.topic_id}
                      className={`hover-lift glass-effect border-2 transition-all ${
                        isHot ? 'border-orange-500 shadow-orange-200' : 
                        isPopular ? 'border-primary shadow-primary/20' : 
                        'hover:border-primary/50'
                      }`}
                      data-testid={`trending-topic-${index}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTrendingIcon(topic.trending_score)}
                            {isHot && (
                              <Badge className="bg-orange-500 text-white">
                                🔥 Hot
                              </Badge>
                            )}
                            {isPopular && !isHot && (
                              <Badge className="bg-primary text-white">
                                ⭐ Popular
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className={`w-4 h-4 ${isFull ? 'text-red-500' : 'text-primary'}`} />
                            <span className={isFull ? 'text-red-500 font-bold' : 'text-muted-foreground'}>
                              {topic.current_participants}/{topic.max_participants}
                            </span>
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold line-clamp-2">
                          {topic.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {topic.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold mr-2">
                              {topic.creator_name?.[0]?.toUpperCase()}
                            </div>
                            <span>{topic.creator_name}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleJoinRoom(topic.topic_id)}
                          disabled={isFull}
                          className={`w-full rounded-full font-semibold ${
                            isFull 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'btn-primary'
                          }`}
                          data-testid={`join-room-${index}`}
                        >
                          {isFull ? (
                            <>🚫 Room Full</>
                          ) : (
                            <>
                              <Video className="w-4 h-4 mr-2" />
                              Join Video Chat
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
