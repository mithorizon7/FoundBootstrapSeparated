import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Users, ChartLine, UserCircle, ChevronDown } from "lucide-react";
import logoSrc from "@/assets/logo.png";

interface Team {
  id: number;
  code: string;
  name: string;
  currentPhase: number;
}

interface NavigationHeaderProps {
  team?: Team;
  isAdmin?: boolean;
}

const phases = [
  { number: 1, title: "Market Research", path: "/phase/1" },
  { number: 2, title: "Competitors", path: "/phase/2" },
  { number: 3, title: "Positioning", path: "/phase/3" },
  { number: 4, title: "Product Design", path: "/phase/4" },
  { number: 5, title: "Media Kit", path: "/phase/5" },
  { number: 6, title: "Website", path: "/phase/6" },
  { number: 7, title: "Launch", path: "/phase/7" },
];

export function NavigationHeader({ team, isAdmin }: NavigationHeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);

  const currentPhaseNumber = parseInt(location.split('/')[2]) || 0;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src={logoSrc} 
                alt="Found-in-Two Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-neutral-800 page-title">Found-in-Two</span>
            </Link>
            
            {/* Team Info */}
            {team && (
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                <Users className="w-3 h-3" />
                <span>{team.name}</span>
                <span className="text-xs">•</span>
                <span>{team.code}</span>
              </div>
            )}
          </div>

          {/* Phase Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {phases.slice(0, 3).map((phase) => {
              const isActive = currentPhaseNumber === phase.number;
              const isCompleted = team ? phase.number < team.currentPhase : false;
              const isAvailable = team ? phase.number <= team.currentPhase : phase.number === 1;
              
              return (
                <Link
                  key={phase.number}
                  href={phase.path + (team ? `?team_id=${team.code}` : '')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : isAvailable
                      ? 'text-gray-600 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    isActive
                      ? 'bg-white bg-opacity-20'
                      : isCompleted
                      ? 'bg-accent-100 text-accent-600'
                      : isAvailable
                      ? 'bg-neutral-200'
                      : 'bg-neutral-100'
                  }`}>
                    {phase.number}
                  </span>
                  <span>{phase.title}</span>
                </Link>
              );
            })}
            <div className="text-gray-300 px-2">...</div>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-4 h-4" />
            </Button>
            
            {/* Admin Dashboard Link */}
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="hidden md:flex items-center space-x-2">
                  <ChartLine className="w-4 h-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
            )}
            
            {/* Team Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => setTeamMenuOpen(!teamMenuOpen)}
              >
                <UserCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Team</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 px-4 py-3">
          <div className="space-y-2">
            {phases.map((phase) => {
              const isActive = currentPhaseNumber === phase.number;
              const isAvailable = team ? phase.number <= team.currentPhase : phase.number === 1;
              
              return (
                <Link
                  key={phase.number}
                  href={phase.path + (team ? `?team_id=${team.code}` : '')}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    isActive
                      ? 'bg-primary text-white'
                      : isAvailable
                      ? 'hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive
                      ? 'bg-white bg-opacity-20'
                      : 'bg-gray-200'
                  }`}>
                    {phase.number}
                  </span>
                  <div>
                    <div className="font-medium">{phase.title}</div>
                    {isActive && <div className="text-sm opacity-90">Current Phase</div>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
