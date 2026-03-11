import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, ArrowLeft, Flag } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { ReportModal } from '@/components/ReportModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const AGORA_APP_ID = process.env.REACT_APP_AGORA_APP_ID || '';

export default function VideoRoom() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);
  
  const clientRef = useRef(null);
  const localTracksRef = useRef([]);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchData();
    return () => {
      leaveChannel();
    };
  }, [topicId]);

  const fetchData = async () => {
    try {
      const [userRes, topicRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/topics/${topicId}`)
      ]);
      
      setUser(userRes.data);
      setTopic(topicRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load room data');
      navigate('/dashboard');
    }
  };

  const joinChannel = async () => {
    if (!AGORA_APP_ID) {
      toast.error('Agora App ID not configured. Please add REACT_APP_AGORA_APP_ID to your .env file.');
      return;
    }

    try {
      clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      
      clientRef.current.on('user-published', async (remoteUser, mediaType) => {
        await clientRef.current.subscribe(remoteUser, mediaType);
        
        if (mediaType === 'video') {
          const remoteVideoTrack = remoteUser.videoTrack;
          const playerContainer = document.createElement('div');
          playerContainer.id = `player-${remoteUser.uid}`;
          playerContainer.className = 'video-player rounded-lg overflow-hidden';
          document.getElementById('agora-video-container')?.appendChild(playerContainer);
          remoteVideoTrack?.play(playerContainer);
        }
        
        if (mediaType === 'audio') {
          remoteUser.audioTrack?.play();
        }
      });
      
      clientRef.current.on('user-unpublished', (remoteUser) => {
        const playerContainer = document.getElementById(`player-${remoteUser.uid}`);
        playerContainer?.remove();
      });
      
      // App ID only mode - no token needed
      const uid = await clientRef.current.join(
        AGORA_APP_ID,
        topicId,
        null,
        null
      );
      
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = [audioTrack, videoTrack];
      
      const localPlayerContainer = document.createElement('div');
      localPlayerContainer.id = 'local-player';
      localPlayerContainer.className = 'video-player rounded-lg overflow-hidden relative';
      localPlayerContainer.innerHTML = '<div class="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">You</div>';
      document.getElementById('agora-video-container')?.appendChild(localPlayerContainer);
      videoTrack.play('local-player');
      
      await clientRef.current.publish([audioTrack, videoTrack]);
      
      connectWebSocket();
      setJoined(true);
      toast.success('Joined the room!');
    } catch (error) {
      console.error('Join channel error:', error);
      toast.error('Failed to join video room');
    }
  };

  const connectWebSocket = () => {
    const wsUrl = `${BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')}/api/ws/${topicId}`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      wsRef.current?.send(JSON.stringify({
        user: { user_id: user.user_id, name: user.name }
      }));
    };
    
    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'user_joined') {
        toast.info(`${message.user.name} joined`);
        setParticipants(prev => [...prev.filter(p => p.user_id !== message.user.user_id), message.user]);
      } else if (message.type === 'user_left') {
        toast.info(`${message.user.name} left`);
        setParticipants(prev => prev.filter(p => p.user_id !== message.user.user_id));
      }
    };
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

  const leaveChannel = async () => {
    localTracksRef.current.forEach(track => {
      track.stop();
      track.close();
    });
    
    if (clientRef.current) {
      await clientRef.current.leave();
    }
    
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    document.getElementById('agora-video-container')?.replaceChildren();
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-white/10"
                data-testid="back-btn"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold" data-testid="room-title">{topic?.title}</h1>
                <p className="text-sm text-gray-400">{topic?.category}</p>
              </div>
            </div>
            <Badge className="bg-primary text-white" data-testid="participant-count">
              <Users className="w-4 h-4 mr-1" />
              {participants.length + (joined ? 1 : 0)} / {topic?.max_participants}
            </Badge>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {!joined ? (
          <Card className="glass-effect max-w-md mx-auto mt-20" data-testid="join-room-card">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                <Video className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Ready to Join?</h2>
              <p className="text-muted-foreground">{topic?.description}</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                Remember: This is a peer support space. Professional advice should come from qualified professionals.
              </div>
              <Button
                onClick={joinChannel}
                className="btn-primary w-full rounded-full"
                data-testid="join-video-btn"
              >
                Join Video Chat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div
              id="agora-video-container"
              className="min-h-[70vh] bg-gray-900 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
              data-testid="video-container"
            >
              {/* Video streams will be injected here */}
            </div>
            
            {/* Controls */}
            <div className="flex justify-center items-center space-x-4" data-testid="video-controls">
              <Button
                size="lg"
                variant={audioEnabled ? 'default' : 'destructive'}
                onClick={toggleAudio}
                className="rounded-full w-14 h-14"
                data-testid="toggle-audio-btn"
              >
                {audioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>
              
              <Button
                size="lg"
                variant={videoEnabled ? 'default' : 'destructive'}
                onClick={toggleVideo}
                className="rounded-full w-14 h-14"
                data-testid="toggle-video-btn"
              >
                {videoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
              
              <Button
                size="lg"
                variant="destructive"
                onClick={leaveChannel}
                className="rounded-full w-14 h-14"
                data-testid="leave-call-btn"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}