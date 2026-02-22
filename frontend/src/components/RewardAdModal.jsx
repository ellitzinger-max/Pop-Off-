import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, Play, Coins, CheckCircle, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const RewardAdModal = ({ onClose, onReward }) => {
  const [stage, setStage] = useState('ready'); // ready, watching, complete
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);

  useEffect(() => {
    let timer;
    if (stage === 'watching' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (stage === 'watching' && countdown === 0) {
      handleAdComplete();
    }
    return () => clearTimeout(timer);
  }, [stage, countdown]);

  const handleWatchAd = () => {
    setStage('watching');
    setCountdown(5);
  };

  const handleAdComplete = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/ads/reward`,
        { ad_type: 'video_ad' },
        { withCredentials: true }
      );
      
      setCoinsEarned(response.data.coins_earned);
      setStage('complete');
      toast.success(`You earned ${response.data.coins_earned} coins!`);
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Please wait before watching another ad');
      } else {
        toast.error('Failed to process reward');
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = () => {
    onReward();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="reward-ad-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Coins className="w-5 h-5 mr-2 text-yellow-500" />
            Earn Free Coins
          </DialogTitle>
          <DialogDescription>
            Watch a short video to earn coins you can use to boost your topics!
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {stage === 'ready' && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Play className="w-12 h-12 text-white" />
              </div>
              
              <div>
                <p className="text-2xl font-bold text-primary mb-1">50 Coins</p>
                <p className="text-sm text-muted-foreground">Watch a 5-second ad to earn</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <strong>Tip:</strong> Use coins to boost your topics and get more visibility!
              </div>
              
              <Button
                onClick={handleWatchAd}
                className="w-full btn-primary"
                size="lg"
                data-testid="watch-ad-start-btn"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Ad
              </Button>
            </div>
          )}

          {stage === 'watching' && (
            <div className="text-center space-y-6">
              <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex flex-col items-center justify-center text-white">
                <div className="text-sm text-gray-400 mb-2">[MOCK VIDEO AD]</div>
                <div className="text-6xl font-bold">{countdown}</div>
                <div className="text-sm text-gray-400 mt-2">seconds remaining</div>
              </div>
              
              <div className="flex items-center justify-center text-muted-foreground">
                <Clock className="w-4 h-4 mr-2 animate-pulse" />
                <span>Please wait for the ad to complete...</span>
              </div>
            </div>
          )}

          {stage === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg animate-bounce">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              
              <div>
                <p className="text-3xl font-bold text-green-600 mb-1">+{coinsEarned} Coins!</p>
                <p className="text-sm text-muted-foreground">Successfully added to your balance</p>
              </div>
              
              <Button
                onClick={handleClaim}
                className="w-full btn-primary"
                size="lg"
                data-testid="claim-reward-btn"
              >
                Awesome!
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-400 border-t pt-4">
          [MOCK AD - Real ad network integration pending]
        </div>
      </DialogContent>
    </Dialog>
  );
};
