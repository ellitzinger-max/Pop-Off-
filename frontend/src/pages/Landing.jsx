import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Video, MessageCircle, Shield, Users } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10"></div>
        
        <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
          <div className="text-center space-y-8 animate-slide-up">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-lg px-6 py-3 rounded-full border border-primary/20 shadow-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Connect. Vent. Thrive.</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              You Buggin'? <span className="text-gradient">Pop Off!</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A safe space to video chat with real people about what matters to you.
              Share your thoughts on relationships, mental health, news, movies, hobbies, and more.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => navigate('/login')}
                className="btn-primary text-lg px-8 py-6 rounded-full font-semibold"
                data-testid="get-started-btn"
              >
                Pop Off!
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="text-lg px-8 py-6 rounded-full font-semibold border-2"
                data-testid="browse-topics-btn"
              >
                Browse Topics
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-red-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Choose Pop Off?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass-effect rounded-2xl p-6 hover-lift text-center space-y-4" data-testid="feature-video-chat">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">HD Video Chat</h3>
              <p className="text-muted-foreground">Connect face-to-face with crystal clear video quality powered by Agora</p>
            </div>
            
            <div className="glass-effect rounded-2xl p-6 hover-lift text-center space-y-4" data-testid="feature-topics">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Diverse Topics</h3>
              <p className="text-muted-foreground">From relationships to hobbies, find conversations that matter to you</p>
            </div>
            
            <div className="glass-effect rounded-2xl p-6 hover-lift text-center space-y-4" data-testid="feature-safe">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Safe Space</h3>
              <p className="text-muted-foreground">A judgment-free zone to express yourself authentically</p>
            </div>
            
            <div className="glass-effect rounded-2xl p-6 hover-lift text-center space-y-4" data-testid="feature-community">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Real Community</h3>
              <p className="text-muted-foreground">Connect with millions of people seeking genuine conversations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="py-16 bg-amber-50 border-y border-amber-200">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="flex items-start space-x-4" data-testid="disclaimer-section">
            <Shield className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">Important Disclaimer</h3>
              <p className="text-amber-800 leading-relaxed">
                Pop Off is a social platform for peer support and connection. Any advice from members who are not 
                professional counselors or specialists should not substitute seeing a real professional. We are not 
                liable for any advice-giving on this platform. If you're experiencing mental health crises, please 
                contact qualified professionals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Ready to Pop Off?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of people finding connection and support through authentic conversations.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/login')}
            className="btn-primary text-lg px-10 py-6 rounded-full font-semibold"
            data-testid="join-now-btn"
          >
            Join Now - It's Free
          </Button>
        </div>
      </section>
    </div>
  );
}