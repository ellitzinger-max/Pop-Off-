import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Heart, MapPin, Sparkles, TrendingUp, Plus, Users, Clock, Flame, Zap, Search, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { SocialShare } from '@/components/SocialShare';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { id: 'relationships', label: 'Relationships', icon: '❤️' },
  { id: 'mental-health', label: 'Mental Health', icon: '🧠' },
  { id: 'news', label: 'News & Politics', icon: '📰' },
  { id: 'entertainment', label: 'Movies & TV', icon: '🎬' },
  { id: 'hobbies', label: 'Hobbies', icon: '🎮' },
  { id: 'general', label: 'General Chat', icon: '💬' },
];

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'matching');
  const [user, setUser] = useState(null);
  
  // Matching state
  const [suggestions, setSuggestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchLoading, setMatchLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  
  // Trending state - for hot/featured topics only
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  
  // Post/Discover state - all topics with search/filter
  const [allTopics, setAllTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Post state
  const [postData, setPostData] = useState({
    title: '',
    description: '',
    category: '',
    max_participants: 5
  });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (activeTab === 'matching') {
      fetchSuggestions();
    } else if (activeTab === 'trending') {
      fetchTrendingTopics();
    } else if (activeTab === 'post') {
      fetchAllTopics();
    }
  }, [activeTab]);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      navigate('/login');
    }
  };

  const fetchSuggestions = async () => {
    setMatchLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/matches/suggestions`, { withCredentials: true });
      setSuggestions(response.data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to load suggestions');
    } finally {
      setMatchLoading(false);
    }
  };

  const fetchTrendingTopics = async () => {
    setTrendingLoading(true);
    try {
      // Fetch only boosted/trending topics
      const response = await axios.get(`${BACKEND_URL}/api/topics/trending`, { withCredentials: true });
      setTrendingTopics(response.data);
    } catch (error) {
      // Fallback to regular topics if trending endpoint doesn't exist
      try {
        const response = await axios.get(`${BACKEND_URL}/api/topics`, { withCredentials: true });
        // Sort by participants/boosted to simulate trending
        const sorted = response.data.sort((a, b) => {
          if (a.is_boosted && !b.is_boosted) return -1;
          if (!a.is_boosted && b.is_boosted) return 1;
          return (b.current_participants || 0) - (a.current_participants || 0);
        });
        setTrendingTopics(sorted.slice(0, 10)); // Top 10 trending
      } catch (e) {
        console.error('Failed to load trending topics');
      }
    } finally {
      setTrendingLoading(false);
    }
  };

  const fetchAllTopics = async () => {
    setTopicsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/topics`, { withCredentials: true });
      setAllTopics(response.data);
    } catch (error) {
      console.error('Failed to load topics');
    } finally {
      setTopicsLoading(false);
    }
  };

  const handleSwipe = async (action) => {
    if (swiping || currentIndex >= suggestions.length) return;
    
    setSwiping(true);
    const currentUser = suggestions[currentIndex];

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/matches/swipe`,
        { target_user_id: currentUser.user_id, action },
        { withCredentials: true }
      );

      if (response.data.match) {
        toast.success(`It's a match with ${currentUser.name}! 🎉`, {
          action: {
            label: 'Chat Now',
            onClick: () => navigate('/matches')
          }
        });
      }

      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      toast.error('Swipe failed');
    } finally {
      setSwiping(false);
    }
  };

  const handleTopicSearch = () => {
    if (!topicSearch.trim()) return;
    
    // Navigate to topics tab with search query
    setSearchQuery(topicSearch);
    setActiveTab('post');
    toast.success(`Searching for "${topicSearch}"...`);
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    
    if (!postData.title.trim() || !postData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setPosting(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/topics`,
        postData,
        { withCredentials: true }
      );
      
      toast.success('Topic created! Redirecting to room...');
      navigate(`/room/${response.data.topic_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create topic');
    } finally {
      setPosting(false);
    }
  };

  const filteredTopics = allTopics.filter(topic => {
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currentMatch = suggestions[currentIndex];

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 md:px-6 max-w-4xl py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-14 p-1 bg-muted/50 rounded-2xl" data-testid="main-tabs">
            <TabsTrigger 
              value="matching" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-violet-500 data-[state=active]:text-white text-base font-semibold"
              data-testid="matching-tab"
            >
              <Zap className="w-4 h-4 mr-2" />
              Matching
            </TabsTrigger>
            <TabsTrigger 
              value="trending" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-violet-500 data-[state=active]:text-white text-base font-semibold"
              data-testid="trending-tab"
            >
              <Flame className="w-4 h-4 mr-2" />
              Hot
            </TabsTrigger>
            <TabsTrigger 
              value="post" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-violet-500 data-[state=active]:text-white text-base font-semibold"
              data-testid="post-tab"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Topics
            </TabsTrigger>
          </TabsList>

          {/* MATCHING TAB */}
          <TabsContent value="matching" className="mt-0">
            {/* Quick Search & Pop Off Section */}
            <Card className="glass-effect mb-6 border-2 border-pink-200 bg-gradient-to-r from-pink-50/50 to-violet-50/50" data-testid="quick-search-card">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-3 items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search for a topic to Pop Off! about..."
                      value={topicSearch}
                      onChange={(e) => setTopicSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && topicSearch.trim()) {
                          handleTopicSearch();
                        }
                      }}
                      className="pl-10 pr-4 py-6 text-lg rounded-full border-2 border-pink-200 focus:border-pink-400"
                      data-testid="topic-search-input"
                    />
                  </div>
                  <Button
                    onClick={handleTopicSearch}
                    className="btn-primary rounded-full px-8 py-6 text-lg font-bold whitespace-nowrap"
                    disabled={!topicSearch.trim()}
                    data-testid="pop-off-search-btn"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Pop Off!
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Search for topics or <button onClick={() => setActiveTab('post')} className="text-pink-500 font-medium hover:underline">browse all topics</button>
                </p>
              </CardContent>
            </Card>

            <div className="text-center mb-6">
              <h1 className="text-3xl font-extrabold tracking-tight mb-1">
                <span className="text-gradient">Find Your Match</span>
              </h1>
              <p className="text-muted-foreground">Swipe to connect with people who get it</p>
            </div>

            {matchLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : !currentMatch ? (
              <Card className="glass-effect text-center py-16" data-testid="no-more-users">
                <CardContent>
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
                  <h2 className="text-2xl font-bold mb-2">No More Suggestions</h2>
                  <p className="text-muted-foreground mb-6">Check back later for new people!</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => navigate('/matches')} className="btn-primary rounded-full">
                      View My Matches
                    </Button>
                    <Button onClick={fetchSuggestions} variant="outline" className="rounded-full">
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="max-w-md mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMatch.user_id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ x: -300, opacity: 0, rotate: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="glass-effect overflow-hidden shadow-2xl border-2" data-testid="swipe-card">
                      {/* User Image */}
                      <div className="relative h-80 bg-gradient-to-br from-pink-400/20 to-violet-400/20 flex items-center justify-center">
                        {currentMatch.picture ? (
                          <img src={currentMatch.picture} alt={currentMatch.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-8xl font-bold text-primary/30">
                            {currentMatch.name[0].toUpperCase()}
                          </div>
                        )}
                        
                        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-violet-500 text-white text-lg px-4 py-2">
                          {currentMatch.match_score}% Match
                        </Badge>
                      </div>

                      <CardContent className="p-5 space-y-3">
                        <div>
                          <h2 className="text-2xl font-bold" data-testid="match-user-name">
                            {currentMatch.name}
                            {currentMatch.age && <span className="text-xl text-muted-foreground">, {currentMatch.age}</span>}
                          </h2>
                          
                          {(currentMatch.city || currentMatch.state) && (
                            <div className="flex items-center text-muted-foreground mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{currentMatch.city && `${currentMatch.city}, `}{currentMatch.state}</span>
                            </div>
                          )}
                        </div>

                        {currentMatch.current_pop_off_topic && (
                          <div className="bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-200 rounded-xl p-3">
                            <p className="text-sm font-medium text-pink-700">
                              <Flame className="w-4 h-4 inline mr-1" />
                              Wants to Pop Off! about:
                            </p>
                            <p className="text-sm text-violet-700 mt-1">{currentMatch.current_pop_off_topic}</p>
                          </div>
                        )}

                        {currentMatch.bio && (
                          <p className="text-muted-foreground line-clamp-2">{currentMatch.bio}</p>
                        )}

                        {currentMatch.common_interests?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {currentMatch.common_interests.slice(0, 4).map((interest, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-pink-100 text-pink-700">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>

                {/* Swipe Buttons */}
                <div className="flex justify-center gap-6 mt-6" data-testid="swipe-buttons">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSwipe('pass')}
                    disabled={swiping}
                    className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-gray-200 flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-colors"
                    data-testid="pass-btn"
                  >
                    <X className="w-8 h-8 text-gray-400" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSwipe('like')}
                    disabled={swiping}
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 shadow-lg flex items-center justify-center hover:shadow-pink-300/50 hover:shadow-xl transition-all"
                    data-testid="like-btn"
                  >
                    <Heart className="w-10 h-10 text-white" />
                  </motion.button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  {suggestions.length - currentIndex - 1} more people to discover
                </p>
              </div>
            )}
          </TabsContent>

          {/* TRENDING TAB - Hot/Featured Topics Only */}
          <TabsContent value="trending" className="mt-0">
            <div className="mb-6">
              <h1 className="text-3xl font-extrabold tracking-tight mb-1">
                <span className="text-gradient">🔥 What's Hot</span>
              </h1>
              <p className="text-muted-foreground">The most active conversations right now</p>
            </div>

            {trendingLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : trendingTopics.length === 0 ? (
              <Card className="glass-effect text-center py-16">
                <CardContent>
                  <Flame className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl font-bold mb-2">No Hot Topics Yet</h2>
                  <p className="text-muted-foreground mb-4">Be the first to start a trending conversation!</p>
                  <Button onClick={() => setActiveTab('post')} className="btn-primary rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Topic
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4" data-testid="trending-list">
                {trendingTopics.map((topic, index) => (
                  <Card 
                    key={topic.topic_id} 
                    className={`glass-effect hover-lift cursor-pointer border-2 ${
                      topic.is_boosted ? 'border-pink-300 bg-gradient-to-r from-pink-50/50 to-violet-50/50' : ''
                    }`}
                    onClick={() => navigate(`/room/${topic.topic_id}`)}
                    data-testid={`trending-topic-${index}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl font-bold text-pink-500">#{index + 1}</span>
                            {topic.is_boosted && (
                              <Badge className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">
                                <Flame className="w-3 h-3 mr-1" /> Hot
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {CATEGORIES.find(c => c.id === topic.category)?.icon} {topic.category}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-xl mb-1">{topic.title}</h3>
                          {topic.description && (
                            <p className="text-muted-foreground line-clamp-2">{topic.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {topic.current_participants || 0} in room
                            </span>
                            <span className="flex items-center">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              {topic.creator_name}
                            </span>
                          </div>
                        </div>
                        <Button size="lg" className="btn-primary rounded-full ml-4">
                          Join Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* POST TAB - Discover Topics + Create */}
          <TabsContent value="post" className="mt-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-1">
                  <span className="text-gradient">Discover Topics</span>
                </h1>
                <p className="text-muted-foreground">Find conversations or start your own</p>
              </div>
              <Button 
                onClick={() => setShowCreateForm(!showCreateForm)} 
                className="btn-primary rounded-full"
                data-testid="toggle-create-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                {showCreateForm ? 'Browse Topics' : 'Create Topic'}
              </Button>
            </div>

            {showCreateForm ? (
              /* CREATE TOPIC FORM */
              <Card className="glass-effect max-w-lg mx-auto" data-testid="create-topic-card">
                <CardHeader>
                  <CardTitle>Start a Conversation</CardTitle>
                  <CardDescription>Create a topic and invite others to Pop Off!</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTopic} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="title">What do you want to talk about? *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Need advice on dealing with anxiety"
                        value={postData.title}
                        onChange={(e) => setPostData({...postData, title: e.target.value})}
                        className="text-lg"
                        data-testid="topic-title-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">More details (optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Add more context about what you want to discuss..."
                        value={postData.description}
                        onChange={(e) => setPostData({...postData, description: e.target.value})}
                        rows={3}
                        data-testid="topic-description-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setPostData({...postData, category: cat.id})}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              postData.category === cat.id
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 hover:border-pink-300'
                            }`}
                            data-testid={`category-${cat.id}`}
                          >
                            <span className="text-xl mr-2">{cat.icon}</span>
                            <span className="font-medium">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_participants">Max participants</Label>
                      <Select 
                        value={String(postData.max_participants)} 
                        onValueChange={(v) => setPostData({...postData, max_participants: parseInt(v)})}
                      >
                        <SelectTrigger data-testid="max-participants-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 people (1-on-1)</SelectItem>
                          <SelectItem value="5">5 people</SelectItem>
                          <SelectItem value="10">10 people</SelectItem>
                          <SelectItem value="20">20 people</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      className="w-full btn-primary rounded-full py-6 text-lg"
                      disabled={posting || !postData.title.trim() || !postData.category}
                      data-testid="create-topic-btn"
                    >
                      {posting ? (
                        <>Creating...</>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Start Pop Off! Room
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              /* DISCOVER/BROWSE TOPICS */
              <>
                {/* Search and Filter */}
                <div className="flex gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-full"
                      data-testid="search-topics"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40 rounded-full" data-testid="category-filter">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {topicsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : filteredTopics.length === 0 ? (
                  <Card className="glass-effect text-center py-16">
                    <CardContent>
                      <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h2 className="text-xl font-bold mb-2">No Topics Found</h2>
                      <p className="text-muted-foreground mb-4">Be the first to start a conversation!</p>
                      <Button onClick={() => setShowCreateForm(true)} className="btn-primary rounded-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Topic
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="topics-grid">
                    {filteredTopics.map((topic, index) => (
                      <Card 
                        key={topic.topic_id} 
                        className={`glass-effect hover-lift cursor-pointer border-2 transition-all ${
                          topic.is_boosted ? 'border-pink-300' : 'hover:border-primary/50'
                        }`}
                        onClick={() => navigate(`/room/${topic.topic_id}`)}
                        data-testid={`topic-card-${index}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {CATEGORIES.find(c => c.id === topic.category)?.icon} {topic.category}
                            </Badge>
                            {topic.is_boosted && (
                              <Badge className="bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xs">
                                <Flame className="w-3 h-3 mr-1" /> Boosted
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg line-clamp-2">{topic.title}</CardTitle>
                          {topic.description && (
                            <CardDescription className="line-clamp-2">{topic.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {topic.current_participants || 0}/{topic.max_participants}
                              </span>
                              <span>{topic.creator_name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                            <SocialShare 
                              contentType="topic" 
                              contentId={topic.topic_id} 
                              title={topic.title}
                            />
                            <Button size="sm" className="btn-primary rounded-full ml-auto">
                              Join
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
