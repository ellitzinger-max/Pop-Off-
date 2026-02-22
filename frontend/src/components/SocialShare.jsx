import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Twitter, Facebook, Linkedin, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const SocialShare = ({ contentType, contentId, title }) => {
  const [loading, setLoading] = useState(false);

  const getShareContent = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/social/share-content/${contentType}/${contentId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get share content:', error);
      return null;
    }
  };

  const logShare = async (platform) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/social/share`,
        {
          content_type: contentType,
          content_id: contentId,
          platform: platform
        },
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Failed to log share:', error);
    }
  };

  const shareToTwitter = async () => {
    setLoading(true);
    const content = await getShareContent();
    if (content) {
      const text = `${content.title}\n\n${content.description}`;
      const hashtags = content.hashtags.join(',');
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(content.url)}&hashtags=${hashtags}`;
      window.open(url, '_blank', 'width=550,height=420');
      await logShare('twitter');
      toast.success('Shared to Twitter!');
    }
    setLoading(false);
  };

  const shareToFacebook = async () => {
    setLoading(true);
    const content = await getShareContent();
    if (content) {
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}`;
      window.open(url, '_blank', 'width=550,height=420');
      await logShare('facebook');
      toast.success('Shared to Facebook!');
    }
    setLoading(false);
  };

  const shareToLinkedIn = async () => {
    setLoading(true);
    const content = await getShareContent();
    if (content) {
      const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(content.url)}`;
      window.open(url, '_blank', 'width=550,height=420');
      await logShare('linkedin');
      toast.success('Shared to LinkedIn!');
    }
    setLoading(false);
  };

  const shareToReddit = async () => {
    setLoading(true);
    const content = await getShareContent();
    if (content) {
      const url = `https://www.reddit.com/submit?url=${encodeURIComponent(content.url)}&title=${encodeURIComponent(content.title)}`;
      window.open(url, '_blank', 'width=550,height=420');
      await logShare('reddit');
      toast.success('Shared to Reddit!');
    }
    setLoading(false);
  };

  const copyLink = async () => {
    const content = await getShareContent();
    if (content) {
      try {
        await navigator.clipboard.writeText(content.url);
        toast.success('Link copied to clipboard!');
        await logShare('clipboard');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          data-testid="share-button"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={shareToTwitter} data-testid="share-twitter">
          <Twitter className="h-4 w-4 mr-2 text-[#1DA1F2]" />
          Share on Twitter/X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToFacebook} data-testid="share-facebook">
          <Facebook className="h-4 w-4 mr-2 text-[#1877F2]" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToLinkedIn} data-testid="share-linkedin">
          <Linkedin className="h-4 w-4 mr-2 text-[#0A66C2]" />
          Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToReddit} data-testid="share-reddit">
          <MessageCircle className="h-4 w-4 mr-2 text-[#FF4500]" />
          Share on Reddit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink} data-testid="copy-link">
          <Share2 className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
