import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { generateTeamCode } from "@/lib/utils";
import { createTeam, getTeamByCode } from "@/lib/db";
import { useLocation } from "wouter";
import logoSrc from "@/assets/logo.png";

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamSelected: (teamCode: string) => void;
}

export function TeamModal({ isOpen, onClose, onTeamSelected }: TeamModalProps) {
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name or an identifier for your session.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const code = generateTeamCode();
      await createTeam(teamName.trim(), code);
      
      toast({
        title: "Session started!",
        description: `Your session code is: ${code}. Save this to resume later on any device.`,
      });
      
      onTeamSelected(code);
      onClose();
      setLocation(`/phase/1?team_id=${code}`);
    } catch (error) {
      toast({
        title: "Error starting session",
        description: "Failed to start session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Session code required",
        description: "Please enter your session code to resume.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const team = await getTeamByCode(joinCode.trim().toUpperCase());
      if (!team) {
        toast({
          title: "Session not found",
          description: "No session found with that code. Please check and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Session resumed!",
        description: `Welcome back, ${team.name}`,
      });
      
      onTeamSelected(team.code);
      onClose();
      setLocation(`/phase/${team.currentPhase}?team_id=${team.code}`);
    } catch (error) {
      toast({
        title: "Error resuming session",
        description: "Failed to resume session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAnonymously = () => {
    onClose();
    setLocation('/phase/1');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-neutral-200">
            <img 
              src={logoSrc} 
              alt="Found-in-Two Logo" 
              className="w-10 h-10 object-contain"
            />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-neutral-800">Welcome to Business Development Toolkit</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>Start your session to begin working on business development activities</p>
            <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border space-y-1">
              <p>💡 No account needed – just remember your code to come back later on any device!</p>
              <p className="text-red-600 font-medium">🔒 Keep your session code private – it's your personal access key.</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create Session Section */}
          <div className="space-y-3">
            <Label htmlFor="teamName">Start New Session</Label>
            <Input
              id="teamName"
              placeholder="Enter your name or identifier"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateTeam()}
            />
            <Button
              onClick={handleCreateTeam}
              disabled={loading}
              className="w-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Session</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Resume Session Section */}
          <div className="space-y-3">
            <Label htmlFor="joinCode">Resume Existing Session</Label>
            <Input
              id="joinCode"
              placeholder="Enter session code (e.g., ZX1Q)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinTeam()}
              className="text-center font-mono text-lg tracking-wider"
              maxLength={4}
            />
            <Button
              onClick={handleJoinTeam}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Resume Session
            </Button>
          </div>

          {/* Anonymous Option */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handleContinueAnonymously}
              variant="ghost"
              className="w-full text-gray-500 hover:text-gray-700"
            >
              Browse activities (progress won't be saved)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
