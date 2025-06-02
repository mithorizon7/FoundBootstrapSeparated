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
        title: "Team name required",
        description: "Please enter a name for your team.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const code = generateTeamCode();
      await createTeam(teamName.trim(), code);
      
      toast({
        title: "Team created!",
        description: `Your team code is: ${code}`,
      });
      
      onTeamSelected(code);
      onClose();
      setLocation(`/phase/1?team_id=${code}`);
    } catch (error) {
      toast({
        title: "Error creating team",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Team code required",
        description: "Please enter a team code to join.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const team = await getTeamByCode(joinCode.trim().toUpperCase());
      if (!team) {
        toast({
          title: "Team not found",
          description: "No team found with that code. Please check and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Joined team!",
        description: `Welcome to ${team.name}`,
      });
      
      onTeamSelected(team.code);
      onClose();
      setLocation(`/phase/${team.currentPhase}?team_id=${team.code}`);
    } catch (error) {
      toast({
        title: "Error joining team",
        description: "Failed to join team. Please try again.",
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
              className="w-12 h-12 object-contain"
            />
          </div>
          <DialogTitle className="text-2xl font-bold page-title">Welcome to Found-in-Two</DialogTitle>
          <DialogDescription>
            Create or join a team to get started with your startup journey
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create Team Section */}
          <div className="space-y-3">
            <Label htmlFor="teamName">Create New Team</Label>
            <Input
              id="teamName"
              placeholder="Enter team name"
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
              <span>Create New Team</span>
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

          {/* Join Team Section */}
          <div className="space-y-3">
            <Label htmlFor="joinCode">Join Existing Team</Label>
            <Input
              id="joinCode"
              placeholder="Enter team code (e.g., ZX1Q)"
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
              Join Existing Team
            </Button>
          </div>

          {/* Anonymous Option */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handleContinueAnonymously}
              variant="ghost"
              className="w-full text-gray-500 hover:text-gray-700"
            >
              Continue without a team (data won't be shared)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
