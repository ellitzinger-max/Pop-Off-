import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, ArrowRight, Camera, Upload, User, MapPin, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const INTEREST_CATEGORIES = {
  'Mental Health': ['Anxiety', 'Depression', 'Stress', 'Self-Care', 'Therapy', 'Mindfulness'],
  'Relationships': ['Dating', 'Friendship', 'Family', 'Breakups', 'Marriage', 'LGBTQ+'],
  'Life & Career': ['Career Advice', 'School', 'Finances', 'Life Changes', 'Goals', 'Motivation'],
  'Hobbies': ['Gaming', 'Music', 'Movies', 'Sports', 'Art', 'Travel', 'Food', 'Fitness'],
  'Current Events': ['Politics', 'News', 'Social Issues', 'Technology', 'Environment'],
  'Just Vibing': ['Random Chat', 'Making Friends', 'Night Owls', 'Vent Session', 'Good Vibes Only']
};

export default function ProfileSetup() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [interests, setInterests] = useState([]);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    bio: '',
    city: '',
    state: '',
    age: ''
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      navigate('/login');
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB');
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
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

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (interests.length === 0) {
        toast.error('Please select at least one interest');
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Upload photo if selected
      let photoUrl = null;
      if (profilePhoto) {
        const photoFormData = new FormData();
        photoFormData.append('file', profilePhoto);
        
        try {
          const uploadRes = await axios.post(
            `${BACKEND_URL}/api/users/upload-photo`,
            photoFormData,
            { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
          );
          photoUrl = uploadRes.data.url;
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError);
          // Continue without photo
        }
      }
      
      // Update profile
      await axios.put(
        `${BACKEND_URL}/api/users/profile`,
        {
          ...formData,
          age: formData.age ? parseInt(formData.age) : null,
          interests,
          picture: photoUrl
        },
        { withCredentials: true }
      );
      
      toast.success('Profile setup complete!');
      navigate('/pop-off');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const progress = step === 1 ? 50 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-yellow-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Step {step} of 2</span>
            <span className="text-sm font-medium text-primary">{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
      
      <main className="container mx-auto px-4 md:px-6 max-w-2xl pt-24 pb-8">
        <Card className="glass-effect shadow-2xl border-0" data-testid="profile-setup-card">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center mb-4">
              {step === 1 ? <User className="w-8 h-8 text-white" /> : <Sparkles className="w-8 h-8 text-white" />}
            </div>
            <CardTitle className="text-3xl font-extrabold">
              {step === 1 ? "Let's Set Up Your Profile" : 'What Are You Into?'}
            </CardTitle>
            <CardDescription className="text-base">
              {step === 1 
                ? 'Add a photo and tell us about yourself' 
                : 'Select topics you want to Pop Off! about'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            {step === 1 && (
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex flex-col items-center">
                  <div 
                    className="relative cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                      <AvatarImage src={photoPreview} />
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-violet-400 text-white text-4xl">
                        {user?.name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                    data-testid="photo-input"
                  />
                  <p className="text-sm text-muted-foreground mt-3">Click to upload a photo</p>
                </div>
                
                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">About You</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell others what you're about... What brings you here? What do you love to talk about?"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={3}
                    className="resize-none"
                    data-testid="bio-input"
                  />
                </div>
                
                {/* Location */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Location (Optional)
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      data-testid="city-input"
                    />
                    <Input
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      data-testid="state-input"
                    />
                  </div>
                </div>
                
                {/* Age */}
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
                    className="w-32"
                    data-testid="age-input"
                  />
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                {Object.entries(INTEREST_CATEGORIES).map(([category, categoryInterests]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      {category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categoryInterests.map((interest) => (
                        <Badge
                          key={interest}
                          variant={interests.includes(interest) ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all text-sm py-1.5 px-3 ${
                            interests.includes(interest)
                              ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white border-0 shadow-md'
                              : 'hover:bg-pink-50 hover:border-pink-300'
                          }`}
                          onClick={() => toggleInterest(interest)}
                          data-testid={`interest-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-violet-700">
                    <strong>Selected:</strong> {interests.length}/10 interests
                    {interests.length > 0 && (
                      <span className="block mt-1 text-violet-600">
                        {interests.join(', ')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 rounded-full"
                  data-testid="back-btn"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="flex-1 btn-primary rounded-full py-6 text-lg"
                disabled={loading || (step === 2 && interests.length === 0)}
                data-testid="continue-btn"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving...</>
                ) : step === 2 ? (
                  <>Continue <ArrowRight className="ml-2 h-5 w-5" /></>
                ) : (
                  <>Next <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>
            </div>
            
            {/* Skip Option */}
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                className="w-full text-center text-sm text-muted-foreground hover:text-primary mt-4 transition-colors"
                data-testid="skip-btn"
              >
                Skip for now
              </button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
