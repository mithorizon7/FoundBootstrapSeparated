import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, Users, ChartLine, UserCircle, ChevronDown, LogIn, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AvatarSelector } from "@/components/AvatarSelector";
import logoSrc from "@assets/ActivityLogo2.png";
import { WORKSPACE } from "@/lib/copy";


interface Participant {
  id: number;
  code: string;
  name: string;
  currentPhase: number;
  avatarIcon?: string;
}

interface NavigationHeaderProps {
  participant?: Participant;
}

const phases = [
  { number: 1, title: "Market Research", path: "/phase/1" },
  { number: 2, title: "Competitors", path: "/phase/2" },
  { number: 3, title: "Background Research", path: "/phase/3" },
  { number: 4, title: "Hero Offer Design", path: "/phase/4" },
  { number: 5, title: "Brief Generation", path: "/phase/5" },
  { number: 6, title: "Implementation", path: "/phase/6" },
  { number: 7, title: "AI Agent Setup", path: "/phase/7" },
  { number: 8, title: "Final Review", path: "/phase/8" },
];

export function NavigationHeader({ participant }: NavigationHeaderProps) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { toast } = useToast();

  const currentPhaseNumber = parseInt(location.split('/')[2]) || 0;

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Unable to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEndSession = async () => {
    try {
      const response = await fetch('/api/auth/team/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        toast({
          title: "Workspace ended",
          description: "You can now create a new workspace or open an existing one.",
        });
        setLocation("/");
      } else {
        throw new Error('Failed to logout session');
      }
    } catch (error) {
      toast({
        title: "Switch workspace failed",
        description: "Failed to end current workspace. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Brand */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src={logoSrc} 
                alt="Found-in-Two Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
              <span className="text-lg sm:text-xl font-bold text-neutral-800 hidden xs:block">GenAI Lab</span>
            </Link>
            
            {/* Workspace Info - Responsive */}
            {participant && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                <AvatarSelector 
                  teamId={participant.id}
                  teamCode={participant.code}
                  currentAvatar={participant.avatarIcon}
                  teamName={participant.name}
                  size="md"
                />
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="hidden md:inline font-medium">Workspace: {participant.name}</span>
                  <span className="text-xs hidden md:inline">•</span>
                  <span className="font-mono">Code: {participant.code}</span>
                  <span className="text-xs text-gray-400 hidden lg:inline">• {WORKSPACE.bannerActive}</span>
                </div>
              </div>
            )}
          </div>

          {/* Phase Navigation - Center */}
          <nav className="hidden lg:flex items-center space-x-2 flex-1 justify-center mx-8">
            {phases.slice(0, 4).map((phase) => {
              const isActive = currentPhaseNumber === phase.number;
              const isCompleted = participant ? phase.number < participant.currentPhase : false;
              const isAvailable = true; // All activities are independent and accessible
              
              return (
                <Link
                  key={phase.number}
                  href={phase.path + (participant ? `?team_id=${participant.code}` : '')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : isAvailable
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed pointer-events-none'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isActive
                      ? 'bg-white bg-opacity-20 text-white'
                      : isCompleted
                      ? 'bg-accent-100 text-accent-600'
                      : isAvailable
                      ? 'bg-neutral-200 text-neutral-700'
                      : 'bg-neutral-100'
                  }`}>
                    {phase.number}
                  </span>
                  <span className="hidden lg:inline whitespace-nowrap">{phase.title}</span>
                </Link>
              );
            })}
            
            {/* More Phases Dropdown */}
            {phases.length > 4 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    <span>More</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  {phases.slice(4).map((phase) => {
                    const isActive = currentPhaseNumber === phase.number;
                    const isCompleted = participant ? phase.number < participant.currentPhase : false;
                    const isAvailable = true; // Allow navigation to all phases
                    
                    return (
                      <DropdownMenuItem
                        key={phase.number}
                        onClick={() => {
                          if (isAvailable) {
                            setLocation(phase.path + (participant ? `?team_id=${participant.code}` : ''));
                          }
                        }}
                        className={`flex items-center space-x-3 cursor-pointer ${
                          isActive ? 'bg-primary text-white' : ''
                        } ${!isAvailable ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isActive
                            ? 'bg-white bg-opacity-20 text-white'
                            : isCompleted
                            ? 'bg-accent-100 text-accent-600'
                            : isAvailable
                            ? 'bg-neutral-200 text-neutral-700'
                            : 'bg-neutral-100'
                        }`}>
                          {phase.number}
                        </span>
                        <span>{phase.title}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Admin Dashboard Button - Always Visible When Admin */}
            {isAuthenticated && user?.role === 'admin' && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <ChartLine className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
            )}
            
            {/* Mobile Menu Button - Only for phase navigation */}
            <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-2">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Navigate to Activity</div>
                  {phases.map((phase) => {
                    const isActive = currentPhaseNumber === phase.number;
                    const isAvailable = true;
                    
                    return (
                      <DropdownMenuItem
                        key={phase.number}
                        onClick={() => {
                          if (isAvailable) {
                            setLocation(phase.path + (participant ? `?team_id=${participant.code}` : ''));
                            setMobileMenuOpen(false);
                          }
                        }}
                        className={`flex items-center space-x-3 mb-1 cursor-pointer ${
                          isActive ? 'bg-primary text-white' : ''
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isActive
                            ? 'bg-white bg-opacity-20 text-white'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}>
                          {phase.number}
                        </span>
                        <span>{phase.title}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User Menu - Always Accessible */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2 text-sm"
                >
                  <UserCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden sm:inline truncate max-w-20">
                    {isAuthenticated ? user?.username : "Account"}
                  </span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {!isAuthenticated ? (
                  <DropdownMenuItem onClick={() => setLocation("/admin-login")}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Admin Login
                  </DropdownMenuItem>
                ) : (
                  <>
                    {user?.role === 'admin' && (
                      <DropdownMenuItem onClick={() => setLocation("/admin")}>
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    {participant && (
                      <DropdownMenuItem onClick={handleEndSession}>
                        <Users className="w-4 h-4 mr-2" />
                        Open Another Workspace
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>


    </header>
  );
}
