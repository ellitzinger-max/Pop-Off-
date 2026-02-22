import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, Plus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { id: 'relationships', label: 'Relationships', color: 'bg-rose-500' },
  { id: 'mental-health', label: 'Mental Health', color: 'bg-emerald-500' },
  { id: 'news', label: 'News & Politics', color: 'bg-blue-500' },
  { id: 'entertainment', label: 'Movies & TV', color: 'bg-purple-500' },
  { id: 'hobbies', label: 'Hobbies & Skills', color: 'bg-amber-500' },
  { id: 'general', label: 'General Chat', color: 'bg-gray-500' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchUser();
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredTopics(topics);
    } else {
      setFilteredTopics(topics.filter(t => t.category === selectedCategory));
    }
  }, [selectedCategory, topics]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/topics`);
      setTopics(response.data);
      setFilteredTopics(response.data);
    } catch (error) {
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    return CATEGORIES.find(c => c.id === category)?.color || 'bg-gray-500';
  };

  const getCategoryLabel = (category) => {
    return CATEGORIES.find(c => c.id === category)?.label || category;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 md:px-6 max-w-7xl py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2" data-testid="dashboard-title">
              Discover Topics
            </h1>
            <p className="text-muted-foreground text-lg">Join conversations that matter to you</p>
          </div>
          <Button
            onClick={() => navigate('/create-topic')}
            className="btn-primary rounded-full px-6"
            data-testid="create-topic-cta-btn"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Topic
          </Button>
        </div>

        {/* Category Filters */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="w-full justify-start flex-wrap h-auto bg-muted/50 p-2 rounded-2xl">
            <TabsTrigger value="all" className="rounded-full" data-testid="filter-all">All Topics</TabsTrigger>
            {CATEGORIES.map(cat => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="rounded-full"
                data-testid={`filter-${cat.id}`}
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Topics Grid - Bento Layout */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading topics...</p>
          </div>
        ) : filteredTopics.length === 0 ? (
          <Card className="text-center py-12 glass-effect" data-testid="no-topics-card">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-lg mb-4">No topics found in this category</p>
              <Button
                onClick={() => navigate('/create-topic')}
                className="btn-primary rounded-full"
                data-testid="create-first-topic-btn"
              >
                Create the First One
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="topics-grid">
            {filteredTopics.map((topic, index) => (
              <Card
                key={topic.topic_id}
                className="hover-lift cursor-pointer glass-effect border-2 hover:border-primary/50 transition-all"
                onClick={() => navigate(`/room/${topic.topic_id}`)}
                data-testid={`topic-card-${index}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${getCategoryColor(topic.category)} text-white rounded-full px-3`}>
                      {getCategoryLabel(topic.category)}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{topic.current_participants}/{topic.max_participants}</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold line-clamp-2">{topic.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{topic.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}