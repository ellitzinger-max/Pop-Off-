import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { id: 'relationships', label: 'Relationships' },
  { id: 'mental-health', label: 'Mental Health' },
  { id: 'news', label: 'News & Politics' },
  { id: 'entertainment', label: 'Movies & TV' },
  { id: 'hobbies', label: 'Hobbies & Skills' },
  { id: 'general', label: 'General Chat' },
  { id: 'trending-news', label: '🔥 Trending News/Current Events' },
  { id: 'pop-culture', label: '⭐ Pop Culture' },
  { id: 'media', label: '📚 Books/Film/Music/Media' },
  { id: 'creative', label: '🎨 Art/Cooking/DIY' },
];

export default function CreateTopic() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    max_participants: 10
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/topics`,
        formData,
        { withCredentials: true }
      );
      
      toast.success('Topic created successfully!');
      navigate(`/room/${response.data.topic_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-6 max-w-3xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
          data-testid="back-to-dashboard-btn"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <Card className="glass-effect shadow-xl" data-testid="create-topic-card">
          <CardHeader>
            <CardTitle className="text-3xl font-extrabold">Create a New Topic</CardTitle>
            <CardDescription className="text-base">
              Start a conversation about what matters to you
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Topic Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Dealing with work stress"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  data-testid="topic-title-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger id="category" data-testid="category-select">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id} data-testid={`category-option-${cat.id}`}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="What would you like to discuss? Be specific to help others understand..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  required
                  data-testid="topic-description-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_participants">Max Participants</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="2"
                  max="20"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
                  data-testid="max-participants-input"
                />
                <p className="text-sm text-muted-foreground">Keep groups small for better conversations (2-20 people)</p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Remember:</strong> Pop Off! is a peer support platform. Any advice should not 
                  substitute professional help. Keep conversations respectful and supportive.
                </p>
              </div>
              
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 btn-primary rounded-full"
                  disabled={loading}
                  data-testid="create-topic-submit-btn"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                  ) : (
                    'Create & Join Room'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="rounded-full"
                  data-testid="cancel-create-btn"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}