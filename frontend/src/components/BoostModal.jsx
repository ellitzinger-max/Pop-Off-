import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, TrendingUp, Star, Zap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const BoostModal = ({ topicId, topicTitle, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState({});
  const [selectedPackage, setSelectedPackage] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/boost/packages`);
      setPackages(response.data.packages);
    } catch (error) {
      toast.error('Failed to load boost packages');
    }
  };

  const handleBoost = async () => {
    if (!selectedPackage) {
      toast.error('Please select a boost package');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/boost/checkout`,
        {
          package_id: selectedPackage,
          topic_id: topicId,
          origin_url: window.location.origin
        },
        { withCredentials: true }
      );

      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start checkout');
      setLoading(false);
    }
  };

  const getPackageIcon = (packageId) => {
    if (packageId === 'featured') return <Star className="w-5 h-5" />;
    if (packageId === '7day') return <TrendingUp className="w-5 h-5" />;
    return <Zap className="w-5 h-5" />;
  };

  const getPackageColor = (packageId) => {
    if (packageId === 'featured') return 'from-amber-400 to-orange-500';
    if (packageId === '7day') return 'from-red-500 to-orange-500';
    return 'from-orange-400 to-red-400';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" data-testid="boost-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <TrendingUp className="w-6 h-6 mr-2 text-primary" />
            Boost Your Topic
          </DialogTitle>
          <DialogDescription>
            Increase visibility for "{topicTitle}" and reach more people
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {Object.entries(packages).map(([packageId, pkg]) => (
            <div
              key={packageId}
              onClick={() => setSelectedPackage(packageId)}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                selectedPackage === packageId
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
              data-testid={`boost-package-${packageId}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${getPackageColor(packageId)} text-white`}>
                    {getPackageIcon(packageId)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {pkg.duration_hours < 48 
                        ? `${pkg.duration_hours} hours` 
                        : `${Math.floor(pkg.duration_hours / 24)} days`} of increased visibility
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {packageId === 'featured' && (
                        <>
                          <Badge variant="secondary" className="text-xs">⭐ Featured Badge</Badge>
                          <Badge variant="secondary" className="text-xs">📌 Top Placement</Badge>
                        </>
                      )}
                      {packageId === '7day' && (
                        <Badge variant="secondary" className="text-xs">📈 Extended Visibility</Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">🔥 Boosted Label</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">${pkg.price}</div>
                  <div className="text-xs text-muted-foreground">USD</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>🚀 Why boost?</strong> Boosted topics appear at the top of listings and get
            special badges, increasing views by 3-5x on average.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            data-testid="cancel-boost-btn"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBoost}
            disabled={loading || !selectedPackage}
            className="flex-1 btn-primary"
            data-testid="proceed-boost-btn"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
            ) : (
              <>Proceed to Payment</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
