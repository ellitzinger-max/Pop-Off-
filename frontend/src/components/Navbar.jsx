import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User as UserIcon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="glass-effect border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl font-extrabold text-gradient">Pop Off!</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/trending">
              <Button variant="ghost" data-testid="nav-trending-btn">🔥 Trending</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" data-testid="nav-dashboard-btn">Topics</Button>
            </Link>
            <Link to="/swipe">
              <Button variant="ghost" data-testid="nav-swipe-btn">Find Matches</Button>
            </Link>
            <Link to="/matches">
              <Button variant="ghost" data-testid="nav-matches-btn">My Matches</Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger data-testid="user-menu-trigger">
                <Avatar className="cursor-pointer hover:ring-2 ring-primary transition-all">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback className="bg-primary text-white">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="profile-menu-item">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile-setup')} data-testid="edit-profile-menu-item">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/preferences')} data-testid="preferences-menu-item">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/social-connections')} data-testid="social-menu-item">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Social Media
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} data-testid="logout-menu-item">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};