import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageCircle, Flag, Maximize2, Minimize2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { ReportModal } from '@/components/ReportModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const AGORA_APP_ID = process.env.REACT_APP_AGORA_APP_ID || '';

export default function MatchVideoChat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const clientRef = useRef(null);
  const localTracksRef = useRef([]);
  const callTimerRef = useRef(null);

  useEffect(() => {
    fetchData();
    return () => {
      leaveChannel();
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [matchId]);

  const fetchData = async () => {
    try {
      const [userRes, matchesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/matches`, { withCredentials: true })
      ]);
      
      setUser(userRes.data);
      const currentMatch = matchesRes.data.find(m => m.match_id === matchId);
      
      if (!currentMatch) {
        toast.error('Match not found');
        navigate('/matches');
        return;
      }
      
      setMatch(currentMatch);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load match data');
      navigate('/matches');
    }
  };

  const joinChannel = async () => {
    if (!AGORA_APP_ID) {
      toast.error('Video chat not configured. Please contact support.');
      return;
    }

    try {
      // Use match_id directly as the channel name for 1-on-1 calls
      const channelName = matchId;
      
      const tokenRes = await axios.post(
        `${BACKEND_URL}/api/agora/token`,
        { channel_name: channelName },
        { withCredentials: true }
      );
      
      const { token } = tokenRes.data;
      
      clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      
      // Handle remote user joining
      clientRef.current.on('user-published', async (remoteUser, mediaType) => {
        await clientRef.current.subscribe(remoteUser, mediaType);
        setRemoteUserJoined(true);
        
        if (mediaType === 'video') {
          const remoteVideoTrack = remoteUser.videoTrack;
          const playerContainer = document.getElementById('remote-video');
          if (playerContainer) {
            playerContainer.innerHTML = '';
            remoteVideoTrack?.play(playerContainer);
          }
        }
        
        if (mediaType === 'audio') {
          remoteUser.audioTrack?.play();
        }
      });
      
      // Handle remote user leaving
      clientRef.current.on('user-unpublished', (remoteUser, mediaType) => {
        if (mediaType === 'video') {
          const playerContainer = document.getElementById('remote-video');
          if (playerContainer) {
            playerContainer.innerHTML = `
              <div class="flex flex-col items-center justify-center h-full">
                <div class="w-32 h-32 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
                  <span class="text-6xl text-violet-300">${match?.other_user?.name?.[0]?.toUpperCase() || '?'}</span>
                </div>
                <p class="text-gray-400">Camera off</p>
              </div>
            `;
          }
        }
      });
      
      clientRef.current.on('user-left', () => {
        setRemoteUserJoined(false);
        toast.info(`${match?.other_user?.name} left the call`);
      });
      
      // Join the channel
      await clientRef.current.join(AGORA_APP_ID, channelName, token, null);
      
      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = [audioTrack, videoTrack];
      
      // Play local video
      const localPlayerContainer = document.getElementById('local-video');
      if (localPlayerContainer) {
        videoTrack.play(localPlayerContainer);
      }
      
      await clientRef.current.publish([audioTrack, videoTrack]);
      
      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      setJoined(true);
      toast.success('Joined video call!');
    } catch (error) {
      console.error('Join channel error:', error);
      toast.error('Failed to join video call');
    }
  };

  const toggleAudio = async () => {
    if (localTracksRef.current[0]) {
      await localTracksRef.current[0].setEnabled(!audioEnabled);
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleVideo = async () => {
    if (localTracksRef.current[1]) {
      await localTracksRef.current[1].setEnabled(!videoEnabled);
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('video-chat-container');
    if (!isFullscreen) {
      container?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const leaveChannel = async () => {
    localTracksRef.current.forEach(track => {
      track.stop();
      track.close();
    });
    
    if (clientRef.current) {
      await clientRef.current.leave();
    }
    
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
  };

  const handleEndCall = async () => {
    await leaveChannel();
    navigate('/matches');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const otherUser = match?.other_user;

  return (
    <div id="video-chat-container" className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10 border-2 border-primary">
                <AvatarImage src={otherUser?.picture} />
                <AvatarFallback className="bg-primary text-white">
                  {otherUser?.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-bold" data-testid="match-video-user-name">{otherUser?.name}</h1>
                {joined && (
                  <p className="text-sm text-gray-400">
                    {remoteUserJoined ? (
                      <span className="text-green-400">Connected • {formatDuration(callDuration)}</span>
                    ) : (
                      <span className="text-yellow-400">Waiting for {otherUser?.name} to join...</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/chat/${matchId}`)}
                className="text-white hover:bg-white/10"
                data-testid="go-to-chat-btn"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReport(true)}
                className="text-white hover:bg-white/10"
                data-testid="report-btn"
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative p-4">
        {!joined ? (
          <Card className="max-w-md mx-auto mt-20 bg-gray-800 border-gray-700" data-testid="pre-call-card">
            <CardContent className="pt-6 text-center space-y-6">
              <Avatar className="w-32 h-32 mx-auto border-4 border-primary">
                <AvatarImage src={otherUser?.picture} />
                <AvatarFallback className="bg-primary/20 text-primary text-4xl">
                  {otherUser?.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-2xl font-bold text-white">Video Call with {otherUser?.name}</h2>
                <p className="text-gray-400 mt-2">
                  Start a face-to-face conversation with your match
                </p>
              </div>
              
              {otherUser?.interests && otherUser.interests.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {otherUser.interests.slice(0, 4).map((interest, idx) => (
                    <span key={idx} className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="bg-violet-900/30 border border-violet-500/30 rounded-lg p-4 text-sm text-violet-200">
                <p>📹 Make sure your camera and microphone are ready</p>
              </div>
              
              <Button
                onClick={joinChannel}
                className="w-full btn-primary rounded-full py-6 text-lg"
                data-testid="start-video-call-btn"
              >
                <Video className="w-5 h-5 mr-2" />
                Start Video Call
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col">
            {/* Video Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Remote Video (Main) */}
              <div className="relative bg-gray-800 rounded-2xl overflow-hidden min-h-[300px] lg:min-h-[500px]">
                <div
                  id="remote-video"
                  className="w-full h-full flex items-center justify-center"
                  data-testid="remote-video-container"
                >
                  {!remoteUserJoined && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 animate-pulse">
                        <span className="text-6xl text-violet-300">{otherUser?.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <p className="text-gray-400">Waiting for {otherUser?.name}...</p>
                    </div>
                  )}
                </div>
                {remoteUserJoined && (
                  <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-sm">
                    {otherUser?.name}
                  </div>
                )}
              </div>
              
              {/* Local Video (PiP style on mobile, side by side on desktop) */}
              <div className="relative bg-gray-800 rounded-2xl overflow-hidden min-h-[200px] lg:min-h-[500px]">
                <div
                  id="local-video"
                  className="w-full h-full"
                  data-testid="local-video-container"
                />
                <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-sm">
                  You
                </div>
                
                {/* Fullscreen toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex justify-center items-center space-x-4 py-6" data-testid="video-controls">
              <Button
                size="lg"
                variant={audioEnabled ? 'default' : 'destructive'}
                onClick={toggleAudio}
                className="rounded-full w-16 h-16 bg-gray-700 hover:bg-gray-600"
                data-testid="toggle-audio-btn"
              >
                {audioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>
              
              <Button
                size="lg"
                variant={videoEnabled ? 'default' : 'destructive'}
                onClick={toggleVideo}
                className="rounded-full w-16 h-16 bg-gray-700 hover:bg-gray-600"
                data-testid="toggle-video-btn"
              >
                {videoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
              
              <Button
                size="lg"
                variant="destructive"
                onClick={handleEndCall}
                className="rounded-full w-20 h-16 bg-red-600 hover:bg-red-700"
                data-testid="end-call-btn"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {showReport && (
        <ReportModal
          reportedUserId={otherUser?.user_id}
          reportedUserName={otherUser?.name}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
