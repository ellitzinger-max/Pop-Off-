import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, Zap, MessageCircle, Users, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const QUICK_PROMPTS = [
  { emoji: '😤', text: "I need to vent about something" },
  { emoji: '💭', text: "Looking for advice on a situation" },
  { emoji: '🤔', text: "Want someone's perspective" },
  { emoji: '😊', text: "Just want to chat and meet people" },
  { emoji: '💔', text: "Going through a tough time" },
  { emoji: '🎉', text: "Want to share some good news" },
  { emoji: '🌙', text: "Can't sleep, need company" },
  { emoji: '🔥', text: "Want to debate/discuss hot topics" }
];

export default function PopOffPrompt() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [popOffText, setPopOffText] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(null);

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

  const handleQuickPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setPopOffText(prompt.text);
  };

  const handlePopOff = async () => {
    if (!popOffText.trim()) {
      toast.error('Tell us what you want to Pop Off! about');
      return;
    }

    setLoading(true);

    try {
      // Save the user's current topic/mood
      await axios.post(
        `${BACKEND_URL}/api/users/pop-off-topic`,
        { topic: popOffText },
        { withCredentials: true }
      );

      toast.success("Let's find you someone to Pop Off! with");
      navigate('/home');
    } catch (error) {
      // If endpoint doesn't exist yet, just navigate to home
      console.log('Pop off topic save skipped');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-pink-300/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border-0" data-testid="pop-off-prompt-card">
          <CardHeader className="text-center pb-2">
            <motion.div 
              className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg"
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <Zap className="w-10 h-10 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-extrabold">
              <span className="text-gradient">What Do You Want to Pop Off! About?</span>
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Tell us what's on your mind and we'll match you with someone who gets it
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Quick Prompts */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Quick picks:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt, index) => (
                  <Badge
                    key={index}
                    variant={selectedPrompt === prompt ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all text-sm py-2 px-3 ${
                      selectedPrompt === prompt
                        ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white border-0'
                        : 'hover:bg-pink-50 hover:border-pink-300'
                    }`}
                    onClick={() => handleQuickPrompt(prompt)}
                    data-testid={`quick-prompt-${index}`}
                  >
                    <span className="mr-1">{prompt.emoji}</span>
                    {prompt.text}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Custom Text Input */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Or tell us in your words:</p>
              <Textarea
                placeholder="What's going on? What do you want to talk about? What's bugging you?"
                value={popOffText}
                onChange={(e) => {
                  setPopOffText(e.target.value);
                  setSelectedPrompt(null);
                }}
                rows={4}
                className="resize-none text-base"
                data-testid="pop-off-text-input"
              />
              <p className="text-xs text-muted-foreground text-right">
                {popOffText.length}/500 characters
              </p>
            </div>

            {/* Pop Off Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handlePopOff}
                className="w-full btn-primary rounded-full py-7 text-xl font-bold shadow-lg"
                disabled={loading || !popOffText.trim()}
                data-testid="pop-off-btn"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-6 w-6 animate-spin" />Finding matches...</>
                ) : (
                  <>
                    <Zap className="mr-2 h-6 w-6" />
                    Pop Off!
                  </>
                )}
              </Button>
            </motion.div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-violet-50 rounded-xl p-3 text-center">
                <Users className="w-6 h-6 text-violet-500 mx-auto mb-1" />
                <p className="text-xs text-violet-700 font-medium">Matched with similar vibes</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-3 text-center">
                <MessageCircle className="w-6 h-6 text-pink-500 mx-auto mb-1" />
                <p className="text-xs text-pink-700 font-medium">Video chat when ready</p>
              </div>
            </div>

            {/* Skip Option */}
            <button
              onClick={() => navigate('/home')}
              className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
              data-testid="skip-to-browse-btn"
            >
              Skip and browse all users
            </button>
          </CardContent>
        </Card>

        {/* User greeting */}
        {user && (
          <motion.p 
            className="text-center text-white/80 mt-4 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Ready when you are, {user.name?.split(' ')[0]}! ✨
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
