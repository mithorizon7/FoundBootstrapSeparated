import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationHeader } from "@/components/NavigationHeader";
import { TeamAvatar } from "@/components/TeamAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Download, Users, Shield, Plus, Settings, Eye, BarChart3, Globe, Vote, Loader2, HelpCircle, Info, BookOpen, Archive } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getTimeAgo } from "@/lib/utils";
import type { Team, Cohort } from "@shared/schema";

interface TeamWithProgress {
  id: number;
  code: string;
  name: string;
  currentPhase: number;
  createdAt: string;
  updatedAt: string;
  cohortTag?: string;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for cohort management
  const [newCohortOpen, setNewCohortOpen] = useState(false);
  const [assignParticipantsOpen, setAssignParticipantsOpen] = useState(false);
  const [unassignParticipantsOpen, setUnassignParticipantsOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<string>("");
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [selectedUnassignCohort, setSelectedUnassignCohort] = useState<string>("");
  const [selectedUnassignParticipants, setSelectedUnassignParticipants] = useState<number[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [newCohort, setNewCohort] = useState({
    tag: "",
    name: "",
    description: "",
  });
  
  const { data: participants = [], isLoading: participantsLoading } = useQuery<TeamWithProgress[]>({
    queryKey: ['/api/teams'],
  });

  const { data: cohorts = [], isLoading: cohortsLoading } = useQuery<Cohort[]>({
    queryKey: ['/api/admin/cohorts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/cohorts', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch cohorts');
      return response.json();
    },
  });

  const { data: archivedCohorts = [], isLoading: archivedLoading } = useQuery<Cohort[]>({
    queryKey: ['/api/admin/cohorts/archived'],
    queryFn: async () => {
      const response = await fetch('/api/admin/cohorts/archived', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch archived cohorts');
      return response.json();
    },
    enabled: showArchived,
  });

  // Mutations for cohort management
  const createCohortMutation = useMutation({
    mutationFn: async (cohortData: typeof newCohort) => {
      const response = await fetch('/api/admin/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(cohortData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cohort created successfully",
        description: "The new cohort has been created.",
      });
      setNewCohortOpen(false);
      setNewCohort({ tag: "", name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cohorts'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create cohort",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCohortMutation = useMutation({
    mutationFn: async ({ tag, updates }: { tag: string; updates: Partial<Cohort> }) => {
      const response = await fetch(`/api/admin/cohorts/${tag}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onMutate: async ({ tag, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/admin/cohorts'] });
      
      // Snapshot the previous value
      const previousCohorts = queryClient.getQueryData(['/api/admin/cohorts']);
      
      // Optimistically update the cache
      queryClient.setQueryData(['/api/admin/cohorts'], (old: any) => {
        if (!old) return old;
        return old.map((cohort: any) => 
          cohort.tag === tag ? { ...cohort, ...updates } : cohort
        );
      });
      
      return { previousCohorts };
    },
    onError: (error: Error, variables, context) => {
      // Revert the optimistic update
      if (context?.previousCohorts) {
        queryClient.setQueryData(['/api/admin/cohorts'], context.previousCohorts);
      }
      toast({
        title: "Failed to update cohort",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Cohort updated successfully",
        description: "The cohort settings have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cohorts', variables.tag] });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cohorts'] });
    },
  });

  const assignTeamsMutation = useMutation({
    mutationFn: async ({ cohortTag, teamIds }: { cohortTag: string; teamIds: number[] }) => {
      const response = await fetch(`/api/admin/cohorts/${cohortTag}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teamIds }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Participants assigned successfully",
        description: "Selected participants have been assigned to the cohort.",
      });
      setAssignParticipantsOpen(false);
      setSelectedParticipants([]);
      setSelectedCohort("");
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign participants",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unassignTeamsMutation = useMutation({
    mutationFn: async ({ teamIds }: { teamIds: number[] }) => {
      const response = await fetch(`/api/admin/cohorts/unassign-teams`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teamIds }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Participants unassigned successfully",
        description: "Selected participants have been removed from the cohort.",
      });
      setUnassignParticipantsOpen(false);
      setSelectedUnassignParticipants([]);
      setSelectedUnassignCohort("");
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to unassign participants",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const archiveCohortMutation = useMutation({
    mutationFn: async (cohortTag: string) => {
      const response = await fetch(`/api/admin/cohorts/${cohortTag}/archive`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cohort archived successfully",
        description: "The cohort has been moved to the archive.",
      });
      // Invalidate all cohort-related queries to ensure dropdowns update
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cohorts/archived'] });
      // Force refetch to ensure immediate UI updates
      queryClient.refetchQueries({ queryKey: ['/api/admin/cohorts'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to archive cohort",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unarchiveCohortMutation = useMutation({
    mutationFn: async (cohortTag: string) => {
      const response = await fetch(`/api/admin/cohorts/${cohortTag}/unarchive`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cohort restored successfully",
        description: "The cohort has been restored from the archive.",
      });
      // Invalidate all cohort-related queries to ensure dropdowns update
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cohorts/archived'] });
      // Force refetch to ensure immediate UI updates
      queryClient.refetchQueries({ queryKey: ['/api/admin/cohorts'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to restore cohort",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const exportCSVMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/export', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to export data');
      }
      
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `team-progress-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Team progress data has been exported to CSV.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export team progress data.",
        variant: "destructive",
      });
    },
  });

  const getPhaseTitle = (phase: number): string => {
    const titles = {
      1: "Market Research",
      2: "Competition Analysis", 
      3: "Background Research",
      4: "Hero Offer Design",
      5: "Brief Generation",
      6: "Implementation",
      7: "AI Agent Setup",
      8: "Final Review"
    };
    return titles[phase as keyof typeof titles] || "Unknown Phase";
  };

  const getProgressPercentage = (currentPhase: number, hasSubmittedWebsite: boolean = false): number => {
    // If they've submitted their website, they've completed all 8 phases
    if (hasSubmittedWebsite) {
      return 100;
    }
    return Math.max(0, Math.min(100, ((currentPhase - 1) / 8) * 100));
  };

  const getProgressText = (currentPhase: number, hasSubmittedWebsite: boolean = false): string => {
    // If they've submitted their website, they've completed all 8 phases
    if (hasSubmittedWebsite) {
      return "8/8";
    }
    return `${currentPhase - 1}/8`;
  };

  // Authentication check after all hooks are declared
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-xl text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Admin access required. Please log in with admin credentials.
            </p>
            <Button onClick={() => setLocation("/admin-login")} className="w-full">
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (participantsLoading || cohortsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Instructor Dashboard</CardTitle>
                <p className="text-gray-600 mt-1">Monitor participant progress, manage cohorts, and export data</p>
              </div>
              <div className="flex items-center space-x-3">
                <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Instructions</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span>Admin Dashboard Instructions</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
                        <p className="text-gray-600">
                          This dashboard allows you to monitor student team progress and manage cohorts for collaborative activities. 
                          Teams automatically appear here when they begin the program.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Team Management</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">📊 Monitor Progress</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• View each team's current phase (1-8)</li>
                              <li>• Track completion percentage</li>
                              <li>• Monitor website submission status</li>
                              <li>• See last activity timestamps</li>
                              <li>• Identify teams needing support</li>
                            </ul>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-2">📥 Export Data</h4>
                            <ul className="text-sm text-green-800 space-y-1">
                              <li>• Click "Export CSV" to download all team data</li>
                              <li>• Includes team names, codes, progress, submission status, and timestamps</li>
                              <li>• Use for attendance tracking and assessment</li>
                              <li>• Data updates in real-time</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Cohort Management</h3>
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-4">📋 Complete Administration Guide</h4>
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-semibold text-blue-900 mb-2">Phase 1-7: Team Progress Monitoring</h5>
                              <div className="space-y-2">
                                <div className="flex items-start space-x-3">
                                  <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                  <div>
                                    <h6 className="font-medium text-blue-900">Monitor Team Progress</h6>
                                    <p className="text-sm text-blue-800">Track teams through phases 1-8. Teams use secure access tokens for authentication and phase data persistence.</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                  <div>
                                    <h6 className="font-medium text-blue-900">Create Cohorts</h6>
                                    <p className="text-sm text-blue-800">Create cohorts to group teams together to be able share and see each others websites for the final showcase and voting.</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                  <div>
                                    <h6 className="font-medium text-blue-900">Assign Teams to Cohorts</h6>
                                    <p className="text-sm text-blue-800">Use "Assign Teams" to select cohort, choose teams, and group them together for voting phase.</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border-t pt-4">
                              <h5 className="font-semibold text-green-900 mb-2">Phase 8: Showcase & Voting Phase</h5>
                              <div className="space-y-2">
                                <div className="flex items-start space-x-3">
                                  <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                                  <div>
                                    <h6 className="font-medium text-green-900">Open Voting</h6>
                                    <p className="text-sm text-green-800">Once all teams have submitted, toggle "Voting Open" to enable secure team voting for top 3 favorites. Make sure results are closed until all voting is complete.</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">5</span>
                                  <div>
                                    <h6 className="font-medium text-green-900">Reveal Results</h6>
                                    <p className="text-sm text-green-800">Toggle "Results Visible" to simultaneously allow all teams to see the results of the voting at the same time.</p>
                                  </div>
                                </div>
                              </div>
                            </div>


                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Security & Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-2">🔒 Secure Team Authentication</h4>
                            <p className="text-sm text-green-800">Teams use unique access tokens for secure sessions. Voting uses server-side authentication to prevent manipulation. Teams can switch sessions safely on shared computers.</p>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">🎉 Celebration Experience</h4>
                            <p className="text-sm text-blue-800">Results page features animated podium, confetti effects, and score counters. Control when teams see results for synchronized celebration moments.</p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <h4 className="font-medium text-purple-900 mb-2">📊 Voting System</h4>
                            <p className="text-sm text-purple-800">Teams vote for top 3 favorites (3-2-1 points). Anti-self-voting protection. Results remain hidden until administrator reveals them.</p>
                          </div>
                          <div className="bg-amber-50 p-4 rounded-lg">
                            <h4 className="font-medium text-amber-900 mb-2">⚙️ System Notes</h4>
                            <p className="text-sm text-amber-800">Cohort tags cannot be changed after creation. Teams can only belong to one cohort. Real-time progress tracking across all phases.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-100 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">🎯 Best Practices</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Create cohorts when teams reach Phase 4-5 for optimal timing</li>
                          <li>• Use descriptive cohort names and tags for easy identification</li>
                          <li>• Enable submissions before opening voting to ensure all teams participate</li>
                          <li>• Keep results hidden until you're ready for the celebration reveal</li>
                          <li>• Export data regularly for backup and progress analysis</li>
                          <li>• Use "Switch Team" feature for shared computer scenarios</li>
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => exportCSVMutation.mutate()}
                      disabled={exportCSVMutation.isPending}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4" />
                      <span>{exportCSVMutation.isPending ? "Exporting..." : "Export CSV"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export comprehensive team data including phase progress, cohort assignments, website submission status and timestamps for backup and analysis</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs defaultValue="teams" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-gray-100">
                <TabsTrigger 
                  value="teams" 
                  className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span>Participants</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="cohorts" 
                  className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium transition-all"
                >
                  <Globe className="w-4 h-4" />
                  <span>Cohorts</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="teams" className="p-0">
                {participantsLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading participants...</h3>
                    <p className="text-gray-600">Please wait while we fetch participant data.</p>
                  </div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No participants yet</h3>
                    <p className="text-gray-600">Participants will appear here once they start sessions.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Participant
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Activity
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Website Submission
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participants.map((team) => (
                          <tr key={team.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <TeamAvatar 
                                  avatarIcon={(team as any).avatarIcon}
                                  teamName={team.name}
                                  size="md"
                                />
                                <div className="flex-grow">
                                  <div className="font-medium text-gray-900">{team.name}</div>
                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <span>Code: {team.code}</span>
                                    {(team as any).cohortTag && (
                                      <span className="text-xs bg-teal-600 text-white px-2 py-1 rounded">
                                        {(team as any).cohortTag}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant="secondary" 
                                  className="bg-blue-100 text-blue-800"
                                >
                                  Activity {team.currentPhase}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {getPhaseTitle(team.currentPhase)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="w-24">
                                  <Progress value={getProgressPercentage(team.currentPhase, !!(team as any).submittedWebsiteUrl)} />
                                </div>
                                <span className="text-sm text-gray-600">
                                  {getProgressText(team.currentPhase, !!(team as any).submittedWebsiteUrl)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(team as any).submittedWebsiteUrl ? (
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Submitted
                                  </Badge>
                                  <div className="text-xs text-gray-500">
                                    {getTimeAgo(team.updatedAt)}
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                  Not Submitted
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {getTimeAgo(team.updatedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cohorts" className="p-6">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Cohort Management</h3>
                      <p className="text-sm text-gray-600">Create and manage cohorts for participant showcase. Competition features (voting/results) are optional and disabled by default.</p>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        variant={showArchived ? "default" : "outline"}
                        onClick={() => setShowArchived(!showArchived)}
                        className="flex items-center space-x-2"
                      >
                        <Archive className="w-4 h-4" />
                        <span>{showArchived ? "Show Active" : "Show Archived"}</span>
                      </Button>
                      <Dialog open={assignParticipantsOpen} onOpenChange={(open) => {
                        setAssignParticipantsOpen(open);
                        if (!open) {
                          setSelectedParticipants([]);
                          setSelectedCohort("");
                        }
                      }}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="flex items-center space-x-2">
                                <Users className="w-4 h-4" />
                                <span>Assign Participants</span>
                              </Button>
                            </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Assign participants to cohorts for showcase and voting phases. Participants can only belong to one cohort at a time.</p>
                          </TooltipContent>
                        </Tooltip>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Assign Participants to Cohort</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="cohort-select">Select Cohort</Label>
                              <Select value={selectedCohort} onValueChange={setSelectedCohort}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a cohort" />
                                </SelectTrigger>
                                <SelectContent>
                                  {cohorts.map((cohort) => (
                                    <SelectItem key={cohort.tag} value={cohort.tag}>
                                      {cohort.name} ({cohort.tag})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Select Participants</Label>
                              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                {participants.map((team) => (
                                  <div key={team.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`team-${team.id}`}
                                      checked={selectedParticipants.includes(team.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedParticipants([...selectedParticipants, team.id]);
                                        } else {
                                          setSelectedParticipants(selectedParticipants.filter(id => id !== team.id));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`team-${team.id}`} className="flex-1">
                                      {team.name} ({team.code})
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                              <Button variant="outline" onClick={() => {
                                setAssignParticipantsOpen(false);
                                setSelectedParticipants([]);
                                setSelectedCohort("");
                              }}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => assignTeamsMutation.mutate({ cohortTag: selectedCohort, teamIds: selectedParticipants })}
                                disabled={!selectedCohort || selectedParticipants.length === 0 || assignTeamsMutation.isPending}
                              >
                                {assignTeamsMutation.isPending ? "Assigning..." : "Assign Participants"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={unassignParticipantsOpen} onOpenChange={(open) => {
                        setUnassignParticipantsOpen(open);
                        if (!open) {
                          setSelectedUnassignParticipants([]);
                          setSelectedUnassignCohort("");
                        }
                      }}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="flex items-center space-x-2">
                                <Users className="w-4 h-4" />
                                <span>Unassign Participants</span>
                              </Button>
                            </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove participants from their current cohort assignments. Participants will no longer be part of any cohort.</p>
                          </TooltipContent>
                        </Tooltip>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Unassign Participants from Cohort</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="unassign-cohort-select">Select Cohort</Label>
                              <Select value={selectedUnassignCohort} onValueChange={setSelectedUnassignCohort}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a cohort to view its participants" />
                                </SelectTrigger>
                                <SelectContent>
                                  {cohorts.map((cohort) => (
                                    <SelectItem key={cohort.tag} value={cohort.tag}>
                                      {cohort.name} ({cohort.tag})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {selectedUnassignCohort && (
                              <div>
                                <Label>Select Participants to Unassign</Label>
                                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                  {participants
                                    .filter(team => team.cohortTag === selectedUnassignCohort)
                                    .map((team) => (
                                      <div key={team.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`unassign-team-${team.id}`}
                                          checked={selectedUnassignParticipants.includes(team.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedUnassignParticipants([...selectedUnassignParticipants, team.id]);
                                            } else {
                                              setSelectedUnassignParticipants(selectedUnassignParticipants.filter(id => id !== team.id));
                                            }
                                          }}
                                        />
                                        <Label htmlFor={`unassign-team-${team.id}`} className="flex-1">
                                          {team.name} ({team.code})
                                        </Label>
                                      </div>
                                    ))}
                                  {participants.filter(team => team.cohortTag === selectedUnassignCohort).length === 0 && (
                                    <p className="text-sm text-gray-500 py-4">No participants are currently assigned to this cohort.</p>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="flex justify-end space-x-3 pt-4">
                              <Button variant="outline" onClick={() => {
                                setUnassignParticipantsOpen(false);
                                setSelectedUnassignParticipants([]);
                                setSelectedUnassignCohort("");
                              }}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => unassignTeamsMutation.mutate({ teamIds: selectedUnassignParticipants })}
                                disabled={selectedUnassignParticipants.length === 0 || unassignTeamsMutation.isPending}
                              >
                                {unassignTeamsMutation.isPending ? "Unassigning..." : "Unassign Participants"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={newCohortOpen} onOpenChange={setNewCohortOpen}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                              <Button className="flex items-center space-x-2">
                                <Plus className="w-4 h-4" />
                                <span>New Cohort</span>
                              </Button>
                            </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Create a new cohort to group teams for Phase 8 showcase and voting. Best created when teams reach Phase 4-5 for optimal timing.</p>
                          </TooltipContent>
                        </Tooltip>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Cohort</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Label htmlFor="cohort-tag">Cohort Tag</Label>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Permanent unique identifier for this cohort. Cannot be changed after creation.<br/>Use lowercase letters, numbers, and hyphens only (e.g., "fall-2024", "cohort-a").</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <Input
                                id="cohort-tag"
                                value={newCohort.tag}
                                onChange={(e) => setNewCohort({ ...newCohort, tag: e.target.value })}
                                placeholder="e.g., spring-2024"
                              />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <Label htmlFor="cohort-name">Cohort Name</Label>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Display name shown to teams and administrators throughout the interface (e.g., "Fall 2024 Cohort", "Advanced Track").</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <Input
                                id="cohort-name"
                                value={newCohort.name}
                                onChange={(e) => setNewCohort({ ...newCohort, name: e.target.value })}
                                placeholder="e.g., Spring 2024 Cohort"
                              />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <Label htmlFor="cohort-description">Description</Label>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Optional description to help identify the purpose, timing, or special characteristics of this cohort group.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <Textarea
                                id="cohort-description"
                                value={newCohort.description}
                                onChange={(e) => setNewCohort({ ...newCohort, description: e.target.value })}
                                placeholder="Brief description of this cohort"
                              />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                              <Button variant="outline" onClick={() => setNewCohortOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => createCohortMutation.mutate(newCohort)}
                                disabled={!newCohort.tag || !newCohort.name || createCohortMutation.isPending}
                              >
                                {createCohortMutation.isPending ? "Creating..." : "Create Cohort"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {(showArchived ? archivedLoading : cohortsLoading) ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Loading {showArchived ? 'archived ' : ''}cohorts...</h3>
                      <p className="text-gray-600">Please wait while we fetch cohort data.</p>
                    </div>
                  ) : (showArchived ? archivedCohorts : cohorts).length === 0 ? (
                    <div className="text-center py-12">
                      <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No {showArchived ? 'archived ' : ''}cohorts yet</h3>
                      <p className="text-gray-600">{showArchived ? 'No cohorts have been archived yet.' : 'Create your first cohort to organize teams and enable voting.'}</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {(showArchived ? archivedCohorts : cohorts).map((cohort) => (
                        <Card key={cohort.tag} className="border border-gray-200">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{cohort.name}</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">Tag: {cohort.tag}</p>
                                {cohort.description && (
                                  <p className="text-sm text-gray-700 mt-2">{cohort.description}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setLocation(`/showcase/${cohort.tag}`)}
                                  className="flex items-center space-x-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>View</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setLocation(`/results/${cohort.tag}`)}
                                  className="flex items-center space-x-1"
                                >
                                  <BarChart3 className="w-4 h-4" />
                                  <span>Results</span>
                                </Button>
                                {showArchived ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => unarchiveCohortMutation.mutate(cohort.tag)}
                                    disabled={unarchiveCohortMutation.isPending}
                                    className="flex items-center space-x-1"
                                  >
                                    <Archive className="w-4 h-4" />
                                    <span>Restore</span>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => archiveCohortMutation.mutate(cohort.tag)}
                                    disabled={archiveCohortMutation.isPending}
                                    className="flex items-center space-x-1 text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                                  >
                                    <Archive className="w-4 h-4" />
                                    <span>Archive</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">Submissions</span>
                                  <div className="flex items-center space-x-3">
                                    <span className="text-xs font-medium text-green-700">
                                      Always Open
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Primary Competition Toggle */}
                                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900">Competition Mode</span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-3 h-3 text-gray-400 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Master toggle for all competition features. When OFF, teams see a simple showcase without voting or competitive elements. When ON, enables voting and results features.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className={`text-xs font-medium ${(cohort as any).competitionEnabled ? 'text-blue-700' : 'text-gray-500'}`}>
                                      {(cohort as any).competitionEnabled ? "Enabled" : "Disabled"}
                                    </span>
                                    {!showArchived && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Switch
                                            key={`competition-${cohort.tag}`}
                                            checked={(cohort as any).competitionEnabled || false}
                                            onCheckedChange={(checked) => updateCohortMutation.mutate({
                                              tag: cohort.tag,
                                              updates: { competitionEnabled: checked }
                                            })}
                                            disabled={updateCohortMutation.isPending}
                                            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-400 border-2 border-gray-300 data-[state=checked]:border-blue-600"
                                          />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Enable or disable competition features for this cohort. Default is OFF - most cohorts run without competition.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>

                                {/* Competition Sub-features (only shown when competition enabled) */}
                                {(cohort as any).competitionEnabled && (
                                  <>
                                    <div className="flex items-center justify-between pl-4 border-l-2 border-blue-200">
                                      <span className="text-sm font-medium text-gray-700">Voting</span>
                                      <div className="flex items-center space-x-3">
                                        <span className={`text-xs font-medium ${cohort.votingOpen ? 'text-green-700' : 'text-gray-500'}`}>
                                          {cohort.votingOpen ? "Open" : "Closed"}
                                        </span>
                                        {!showArchived && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Switch
                                                key={`voting-${cohort.tag}`}
                                                checked={cohort.votingOpen}
                                                onCheckedChange={(checked) => updateCohortMutation.mutate({
                                                  tag: cohort.tag,
                                                  updates: { votingOpen: checked }
                                                })}
                                                disabled={updateCohortMutation.isPending}
                                                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400 border-2 border-gray-300 data-[state=checked]:border-green-600"
                                              />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Opens secure voting for teams to rank their top 3 favorite projects (3-2-1 points). Enable only after all submissions are complete.</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between pl-4 border-l-2 border-blue-200">
                                      <span className="text-sm font-medium text-gray-700">Results</span>
                                      <div className="flex items-center space-x-3">
                                        <span className={`text-xs font-medium ${cohort.resultsVisible ? 'text-green-700' : 'text-gray-500'}`}>
                                          {cohort.resultsVisible ? "Visible" : "Hidden"}
                                        </span>
                                        {!showArchived && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Switch
                                                key={`results-${cohort.tag}`}
                                                checked={cohort.resultsVisible}
                                                onCheckedChange={(checked) => updateCohortMutation.mutate({
                                                  tag: cohort.tag,
                                                  updates: { resultsVisible: checked }
                                                })}
                                                disabled={updateCohortMutation.isPending}
                                                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400 border-2 border-gray-300 data-[state=checked]:border-green-600"
                                              />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Controls when participants can see the celebratory results experience with animated podium, confetti, and rankings. Keep hidden until ready for synchronized reveal.</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* Message when competition is disabled */}
                                {!(cohort as any).competitionEnabled && (
                                  <div className="pl-4 py-2 text-xs text-gray-500 bg-gray-50 rounded border-l-2 border-gray-300">
                                    Competition features disabled - participants will see a simple showcase without voting
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                {(() => {
                                  const cohortParticipants = participants.filter(team => team.cohortTag === cohort.tag);
                                  const submittedParticipants = cohortParticipants.filter(team => (team as any).submittedWebsiteUrl);
                                  return (
                                    <>
                                      <p className="text-sm text-gray-600">
                                        <span className="font-medium">Participants:</span> {cohortParticipants.length}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        <span className="font-medium">Submissions:</span> 
                                        <span className={`ml-1 ${submittedParticipants.length === cohortParticipants.length && cohortParticipants.length > 0 ? 'text-green-600 font-medium' : ''}`}>
                                          {submittedParticipants.length}/{cohortParticipants.length}
                                        </span>
                                        {submittedParticipants.length === cohortParticipants.length && cohortParticipants.length > 0 && (
                                          <span className="ml-1 text-xs text-green-600">✓ Complete</span>
                                        )}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        <span className="font-medium">Created:</span> {getTimeAgo(cohort.createdAt)}
                                      </p>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      </div>
    </TooltipProvider>
  );
}