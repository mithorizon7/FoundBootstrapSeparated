import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, ArrowRight } from "lucide-react";
import { generateTeamCode } from "@/lib/utils";
import { createTeam, getTeamByCode } from "@/lib/db";
import { useLocation } from "wouter";
import logoSrc from "@/assets/logo.png";
import { WORKSPACE } from "@/lib/copy";

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
        description: "Please enter your name or an identifier for your workspace.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const code = generateTeamCode();
      await createTeam(teamName.trim(), code);
      
      toast({
        title: WORKSPACE.toastCreated,
        description: (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-lg font-bold">{code}</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(code);
                toast({ title: "Copied!", description: "Workspace Code copied to clipboard." });
              }}
              className="ml-2"
            >
              <Copy className="w-3 h-3 mr-1" />
              {WORKSPACE.copyCodeCta}
            </Button>
          </div>
        ),
      });
      
      onTeamSelected(code);
      onClose();
      setLocation(`/phase/1?team_id=${code}`);
    } catch (error) {
      toast({
        title: "Error creating workspace",
        description: "Failed to create workspace. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Workspace Code required",
        description: WORKSPACE.missingCodeError,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const team = await getTeamByCode(joinCode.trim().toUpperCase());
      if (!team) {
        toast({
          title: "Workspace not found",
          description: WORKSPACE.toastJoinError,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: WORKSPACE.toastJoined,
        description: `Welcome back, ${team.name}`,
      });
      
      onTeamSelected(team.code);
      onClose();
      setLocation(`/phase/${team.currentPhase}?team_id=${team.code}`);
    } catch (error) {
      toast({
        title: "Error opening workspace",
        description: "Failed to open workspace. Please try again.",
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
          <DialogTitle className="text-xl sm:text-2xl font-bold text-neutral-800">Welcome to Applied GenAI Lab</DialogTitle>
          <DialogDescription>
            Start your workspace to begin working on GenAI-assisted development activities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create Workspace Section */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-primary-500 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <Label htmlFor="teamName" className="text-lg font-semibold text-primary-800">{WORKSPACE.startLabel}</Label>
            </div>
            <Input
              id="teamName"
              placeholder="How would you like to be known?"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateTeam()}
              className="border-primary-300 focus:border-primary-500 focus:ring-primary-500"
            />
            <Button
              onClick={handleCreateTeam}
              disabled={loading}
              className="w-full bg-primary-600 text-white hover:bg-primary-700 font-semibold py-3 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span>{WORKSPACE.startLabel}</span>
            </Button>
            <p className="text-sm text-primary-700 font-medium">{WORKSPACE.explainer}</p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 py-1 bg-white text-gray-500 rounded-full border border-gray-200">or</span>
            </div>
          </div>

          {/* Resume Workspace Section */}
          <div className="bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
              <Label htmlFor="joinCode" className="text-lg font-semibold text-slate-800">{WORKSPACE.resumeLabel}</Label>
            </div>
            <Input
              id="joinCode"
              placeholder={WORKSPACE.codePlaceholder}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinTeam()}
              className="text-center font-mono text-lg tracking-wider border-slate-300 focus:border-slate-500 focus:ring-slate-500"
              maxLength={4}
            />
            <Button
              onClick={handleJoinTeam}
              disabled={loading}
              className="w-full bg-slate-600 text-white hover:bg-slate-700 font-semibold py-3 shadow-md hover:shadow-lg transition-all duration-200"
            >
              {WORKSPACE.resumeLabel}
            </Button>
            <p className="text-sm text-slate-700 font-medium">{WORKSPACE.explainer}</p>
          </div>
          
          {/* Security Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-primary-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
              <p className="text-sm text-blue-800 font-medium">No account needed – just remember your code to come back later on any device!</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
              </div>
              <p className="text-sm text-red-700 font-semibold">Keep your Workspace Code private – it's your personal access key.</p>
            </div>
          </div>

          {/* Anonymous Option - Now at bottom */}
          <div className="pt-4 border-t border-gray-200 text-center">
            <Button
              onClick={handleContinueAnonymously}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 font-normal"
            >
              Try without saving
            </Button>
            <p className="text-xs text-muted-foreground mt-1">{WORKSPACE.practiceNote}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
