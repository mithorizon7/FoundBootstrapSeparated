import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationHeader } from "@/components/NavigationHeader";
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
import { Download, Users, Shield, Plus, Settings, Eye, BarChart3, Globe, Vote, Loader2, HelpCircle, Info, BookOpen } from "lucide-react";
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
  const [assignTeamsOpen, setAssignTeamsOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<string>("");
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [newCohort, setNewCohort] = useState({
    tag: "",
    name: "",
    description: "",
  });
  
  const { data: teams = [], isLoading: teamsLoading } = useQuery<TeamWithProgress[]>({
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
    onSuccess: (data, variables) => {
      toast({
        title: "Cohort updated successfully",
        description: "The cohort settings have been updated.",
      });
      // Invalidate both the general cohorts list and specific cohort data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cohorts'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/cohorts/${variables.tag}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update cohort",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignTeamsMutation = useMutation({
    mutationFn: async ({ cohortTag, teamIds }: { cohortTag: string; teamIds: number[] }) => {
      const response = await fetch(`/api/admin/cohorts/${cohortTag}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ team_ids: teamIds }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Teams assigned successfully",
        description: "Selected teams have been assigned to the cohort.",
      });
      setAssignTeamsOpen(false);
      setSelectedTeams([]);
      setSelectedCohort("");
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign teams",
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

  const getProgressPercentage = (currentPhase: number): number => {
    return Math.max(0, Math.min(100, ((currentPhase - 1) / 8) * 100));
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

  if (teamsLoading || cohortsLoading) {
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
                <p className="text-gray-600 mt-1">Monitor team progress, manage cohorts, and export data</p>
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
                              <li>• See last activity timestamps</li>
                              <li>• Identify teams needing support</li>
                            </ul>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-2">📥 Export Data</h4>
                            <ul className="text-sm text-green-800 space-y-1">
                              <li>• Click "Export CSV" to download all team data</li>
                              <li>• Includes team names, codes, progress, and timestamps</li>
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
                                    <p className="text-sm text-blue-800">Create cohorts when teams reach Phase 4-5 to group them for final showcase and voting activities.</p>
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
                                    <h6 className="font-medium text-green-900">Enable Submissions</h6>
                                    <p className="text-sm text-green-800">Toggle "Submissions Open" to allow teams to submit final websites in Phase 8.</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">5</span>
                                  <div>
                                    <h6 className="font-medium text-green-900">Open Voting</h6>
                                    <p className="text-sm text-green-800">Once all teams have submitted, toggle "Voting Open" to enable secure team voting for top 3 favorites.</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <span className="bg-green-200 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">6</span>
                                  <div>
                                    <h6 className="font-medium text-green-900">Monitor Voting</h6>
                                    <p className="text-sm text-green-800">Teams vote using secure sessions. Each team votes for 3 others (3 pts, 2 pts, 1 pt). Anti-manipulation protections active.</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border-t pt-4">
                              <h5 className="font-semibold text-purple-900 mb-2">Results Phase: Celebration Control</h5>
                              <div className="space-y-2">
                                <div className="flex items-start space-x-3">
                                  <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">7</span>
                                  <div>
                                    <h6 className="font-medium text-purple-900">Close Voting</h6>
                                    <p className="text-sm text-purple-800">Turn off "Voting Open" when voting period ends. Results remain hidden until you reveal them.</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">8</span>
                                  <div>
                                    <h6 className="font-medium text-purple-900">Reveal Results</h6>
                                    <p className="text-sm text-purple-800">Toggle "Results Visible" to simultaneously reveal the celebratory results experience to all teams with confetti, podium, and animations.</p>
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
                    <p>Download all team data including progress, phase completion, and timestamps as a CSV file</p>
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
                  <span>Teams</span>
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
                {teamsLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading teams...</h3>
                    <p className="text-gray-600">Please wait while we fetch team data.</p>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
                    <p className="text-gray-600">Teams will appear here once they start the program.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Team
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Phase
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teams.map((team) => (
                          <tr key={team.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                                  <span className="text-primary font-medium text-sm">{team.code}</span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{team.name}</div>
                                  <div className="text-sm text-gray-500">
                                    Code: {team.code}
                                    {(team as any).cohortTag && (
                                      <span className="ml-2 text-xs bg-teal-100 text-black hover:bg-teal-600 hover:text-white transition-colors px-2 py-1 rounded cursor-default">
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
                                  className="bg-teal-100 text-black hover:bg-teal-600 hover:text-white transition-colors cursor-default"
                                >
                                  Phase {team.currentPhase}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {getPhaseTitle(team.currentPhase)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="w-24">
                                  <Progress value={getProgressPercentage(team.currentPhase)} />
                                </div>
                                <span className="text-sm text-gray-600">
                                  {team.currentPhase - 1}/8
                                </span>
                              </div>
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
                      <p className="text-sm text-gray-600">Create and manage cohorts for team collaboration and voting</p>
                    </div>
                    <div className="flex space-x-3">
                      <Dialog open={assignTeamsOpen} onOpenChange={setAssignTeamsOpen}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="flex items-center space-x-2">
                                <Users className="w-4 h-4" />
                                <span>Assign Teams</span>
                              </Button>
                            </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Add teams to existing cohorts for collaboration and voting activities</p>
                          </TooltipContent>
                        </Tooltip>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Assign Teams to Cohort</DialogTitle>
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
                              <Label>Select Teams</Label>
                              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                {teams.map((team) => (
                                  <div key={team.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`team-${team.id}`}
                                      checked={selectedTeams.includes(team.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedTeams([...selectedTeams, team.id]);
                                        } else {
                                          setSelectedTeams(selectedTeams.filter(id => id !== team.id));
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
                              <Button variant="outline" onClick={() => setAssignTeamsOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => assignTeamsMutation.mutate({ cohortTag: selectedCohort, teamIds: selectedTeams })}
                                disabled={!selectedCohort || selectedTeams.length === 0 || assignTeamsMutation.isPending}
                              >
                                {assignTeamsMutation.isPending ? "Assigning..." : "Assign Teams"}
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
                                    <p>Unique identifier for this cohort. Cannot be changed after creation.<br/>Use lowercase letters, numbers, and hyphens only.</p>
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
                                    <p>Descriptive name displayed to users and in the interface</p>
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
                                    <p>Optional description to help identify the purpose or scope of this cohort</p>
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

                  {cohortsLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Loading cohorts...</h3>
                      <p className="text-gray-600">Please wait while we fetch cohort data.</p>
                    </div>
                  ) : cohorts.length === 0 ? (
                    <div className="text-center py-12">
                      <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No cohorts yet</h3>
                      <p className="text-gray-600">Create your first cohort to organize teams and enable voting.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {cohorts.map((cohort) => (
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
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">Submissions</span>
                                  <div className="flex items-center space-x-3">
                                    <span className={`text-xs font-medium ${cohort.submissionsOpen ? 'text-green-700' : 'text-gray-500'}`}>
                                      {cohort.submissionsOpen ? "Open" : "Closed"}
                                    </span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Switch
                                          key={`submissions-${cohort.tag}`}
                                          checked={cohort.submissionsOpen}
                                          onCheckedChange={(checked) => updateCohortMutation.mutate({
                                            tag: cohort.tag,
                                            updates: { submissionsOpen: checked }
                                          })}
                                          disabled={updateCohortMutation.isPending}
                                          className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400 border-2 border-gray-300 data-[state=checked]:border-green-600"
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Controls whether teams can submit final websites in Phase 8. Enable this when teams are ready to showcase their completed projects.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">Voting</span>
                                  <div className="flex items-center space-x-3">
                                    <span className={`text-xs font-medium ${cohort.votingOpen ? 'text-green-700' : 'text-gray-500'}`}>
                                      {cohort.votingOpen ? "Open" : "Closed"}
                                    </span>
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
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">Results</span>
                                  <div className="flex items-center space-x-3">
                                    <span className={`text-xs font-medium ${(cohort as any).resultsVisible ? 'text-green-700' : 'text-gray-500'}`}>
                                      {(cohort as any).resultsVisible ? "Visible" : "Hidden"}
                                    </span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Switch
                                          key={`results-${cohort.tag}`}
                                          checked={(cohort as any).resultsVisible || false}
                                          onCheckedChange={(checked) => updateCohortMutation.mutate({
                                            tag: cohort.tag,
                                            updates: { resultsVisible: checked }
                                          })}
                                          disabled={updateCohortMutation.isPending}
                                          className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400 border-2 border-gray-300 data-[state=checked]:border-green-600"
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Controls when teams can see the celebratory results experience with animated podium, confetti, and rankings. Keep hidden until ready for synchronized reveal.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Teams:</span> {teams.filter(team => (team as any).cohortTag === cohort.tag).length}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Created:</span> {getTimeAgo(cohort.createdAt)}
                                </p>
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