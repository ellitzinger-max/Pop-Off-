import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, AlertTriangle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const REPORT_CATEGORIES = [
  { value: 'hate_speech', label: 'Hate Speech' },
  { value: 'illegal_activity', label: 'Illegal Activity' },
  { value: 'nudity', label: 'Nudity or Sexual Content' },
  { value: 'transactions', label: 'Selling or Transactions' },
  { value: 'harassment', label: 'Harassment or Bullying' },
  { value: 'spam', label: 'Spam' },
];

export const ReportModal = ({ reportedUserId, reportedUserName, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(
        `${BACKEND_URL}/api/reports`,
        {
          reported_user_id: reportedUserId,
          category,
          description
        },
        { withCredentials: true }
      );
      
      toast.success('Report submitted. Our AI will review this shortly.');
      onClose();
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="report-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Report {reportedUserName}
          </DialogTitle>
          <DialogDescription>
            Help us keep Pop Off safe. Reports are reviewed by AI and our team.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Reason for Report *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" data-testid="report-category-select">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value} data-testid={`report-option-${cat.value}`}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="report-description-input"
            />
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            Our AI will analyze the user's message and video chat history. If a violation is confirmed, 
            the user will be suspended. Multiple violations may result in permanent removal.
          </div>
          
          <DialogFooter className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="cancel-report-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !category}
              data-testid="submit-report-btn"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};