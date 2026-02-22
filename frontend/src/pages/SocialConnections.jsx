import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, Link as LinkIcon, Unlink, Check, Twitter, Facebook, Linkedin, Instagram } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function SocialConnections() {
  const [loading, setLoading] = useState(true);
  const [platforms, setPlatforms] = useState([]);
  const [connectedSocials, setConnectedSocials] = useState({});
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [platformsRes, connectedRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/social/platforms`),
        axios.get(`${BACKEND_URL}/api/social/connected`, { withCredentials: true })
      ]);
      
      setPlatforms(platformsRes.data.platforms);
      setConnectedSocials(connectedRes.data.connected_socials);
    } catch (error) {
      toast.error('Failed to load social connections');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform) => {
    if (!username.trim()) {
      toast.error('Please enter your username');
      return;
    }

    try {
      await axios.post(
        `${BACKEND_URL}/api/social/connect`,
        {
          platform: platform.id,
          username: username,
          profile_url: `https://${platform.id}.com/${username}`
        },
        { withCredentials: true }
      );
      
      toast.success(`${platform.name} connected successfully!`);
      setConnectingPlatform(null);
      setUsername('');
      fetchData();
    } catch (error) {
      toast.error(`Failed to connect ${platform.name}`);
    }
  };

  const handleDisconnect = async (platform) => {
    try {
      await axios.delete(
        `${BACKEND_URL}/api/social/disconnect/${platform.id}`,
        { withCredentials: true }
      );
      
      toast.success(`${platform.name} disconnected`);
      fetchData();
    } catch (error) {
      toast.error(`Failed to disconnect ${platform.name}`);
    }
  };

  const getPlatformIcon = (platformId) => {
    const icons = {
      twitter: <Twitter className="h-5 w-5" />,
      facebook: <Facebook className="h-5 w-5" />,
      instagram: <Instagram className="h-5 w-5" />,
      linkedin: <Linkedin className="h-5 w-5" />,
    };
    return icons[platformId] || <LinkIcon className="h-5 w-5" />;
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
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2" data-testid="social-connections-title">
            Social Media Connections
          </h1>
          <p className="text-muted-foreground text-lg">
            Link your social accounts to easily share your Pop Off! content
          </p>
        </div>

        <Card className="glass-effect mb-6">
          <CardHeader>
            <CardTitle>Benefits of Connecting</CardTitle>
            <CardDescription>
              Share topics, achievements, and your profile with one click
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Quick Sharing</p>
                  <p className="text-sm text-muted-foreground">Share content instantly</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Grow Your Network</p>
                  <p className="text-sm text-muted-foreground">Invite friends from other platforms</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Cross-Platform Presence</p>
                  <p className="text-sm text-muted-foreground">Build your brand across socials</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Profile Links</p>
                  <p className="text-sm text-muted-foreground">Show your social handles on profile</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {platforms.map((platform) => {
            const isConnected = connectedSocials[platform.id];
            const isConnecting = connectingPlatform === platform.id;

            return (
              <Card key={platform.id} className="glass-effect" data-testid={`platform-${platform.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: `${platform.color}15` }}
                      >
                        <div style={{ color: platform.color }}>
                          {getPlatformIcon(platform.id)}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{platform.name}</h3>
                        {isConnected ? (
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <Check className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              @{isConnected.username}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not connected</p>
                        )}
                      </div>
                    </div>

                    <div>
                      {isConnected ? (
                        <Button
                          variant="outline"
                          onClick={() => handleDisconnect(platform)}
                          data-testid={`disconnect-${platform.id}`}
                        >
                          <Unlink className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                      ) : isConnecting ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-40"
                            data-testid={`username-input-${platform.id}`}
                          />
                          <Button
                            onClick={() => handleConnect(platform)}
                            className="btn-primary"
                            data-testid={`confirm-connect-${platform.id}`}
                          >
                            Connect
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setConnectingPlatform(null);
                              setUsername('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setConnectingPlatform(platform.id)}
                          className="btn-primary"
                          data-testid={`connect-${platform.id}`}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>🔒 Privacy Note:</strong> We only store your username for display purposes. 
            We don't access your account data or post without your permission. You control when to share!
          </p>
        </div>
      </main>
    </div>
  );
}
