import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function BoostSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      checkPaymentStatus(sessionId);
    } else {
      setStatus('error');
      setMessage('No session ID found');
    }
  }, [searchParams]);

  const checkPaymentStatus = async (sessionId) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/boost/status/${sessionId}`,
        { withCredentials: true }
      );
      
      if (response.data.status === 'completed') {
        setStatus('success');
        setMessage(response.data.message);
        toast.success('Topic boosted successfully!');
      } else {
        setStatus('pending');
        setMessage('Payment is being processed...');
        // Retry after a few seconds
        setTimeout(() => checkPaymentStatus(sessionId), 3000);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Failed to verify payment');
      toast.error('Payment verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-6 max-w-lg py-16">
        <Card className="glass-effect text-center" data-testid="boost-success-card">
          <CardHeader className="pb-2">
            {status === 'loading' || status === 'pending' ? (
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : status === 'success' ? (
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4 animate-bounce">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            ) : (
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
            )}
            
            <CardTitle className="text-2xl">
              {status === 'loading' || status === 'pending' ? 'Processing...' : 
               status === 'success' ? 'Boost Activated!' : 'Something Went Wrong'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {message || (status === 'loading' ? 'Verifying your payment...' : '')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            {status === 'success' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-4 flex items-center justify-center space-x-3">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                  <span className="font-semibold text-orange-700">Your topic is now boosted!</span>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Your topic will appear at the top of listings and display a "Boosted" badge.
                </p>
              </div>
            )}
            
            <div className="mt-6 space-y-3">
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full btn-primary"
                data-testid="back-to-dashboard-btn"
              >
                Back to Dashboard
              </Button>
              
              {status === 'error' && (
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
