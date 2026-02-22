import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [interests, setInterests] = useState([]);
  const [allInterests, setAllInterests] = useState([]);
  const [formData, setFormData] = useState({
    bio: '',
    city: '',
    state: '',
    age: ''
  });

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/users/interests`);
      setAllInterests(response.data.interests);
    } catch (error) {
      console.error('Failed to fetch interests');
    }
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      if (interests.length < 10) {
        setInterests([...interests, interest]);
      } else {
        toast.error('You can select up to 10 interests');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (interests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.put(
        `${BACKEND_URL}/api/users/profile`,
        {
          ...formData,
          age: formData.age ? parseInt(formData.age) : null,
          interests
        },
        { withCredentials: true }
      );
      
      toast.success('Profile updated successfully!');
      navigate('/swipe');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-6 max-w-3xl py-8">
        <Card className="glass-effect shadow-xl" data-testid="profile-setup-card">
          <CardHeader>
            <CardTitle className="text-3xl font-extrabold">Complete Your Profile</CardTitle>
            <CardDescription className="text-base">
              Help us find the best matches for you
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={3}
                  data-testid="bio-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g., San Francisco"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    data-testid="city-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="e.g., CA"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    data-testid="state-input"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">Age (Optional)</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  placeholder="25"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  data-testid="age-input"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Select Your Interests (up to 10) *</Label>
                <div className="flex flex-wrap gap-2">
                  {allInterests.map((interest) => (
                    <Badge
                      key={interest}
                      variant={interests.includes(interest) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        interests.includes(interest)
                          ? 'bg-primary text-white hover:bg-primary/90'
                          : 'hover:bg-primary/10'
                      }`}
                      onClick={() => toggleInterest(interest)}
                      data-testid={`interest-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {interests.length}/10 selected
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full btn-primary rounded-full text-lg py-6"
                disabled={loading || interests.length === 0}
                data-testid="save-profile-btn"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving...</>
                ) : (
                  <>Continue <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}