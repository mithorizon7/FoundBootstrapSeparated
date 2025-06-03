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
import { useToast } from "@/hooks/use-toast";
import { Download, Users, Shield, Plus, Settings, Eye, BarChart3, Globe, Vote } from "lucide-react";
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
  const [newCohort, setNewCohort] = useState({
    tag: "",
    name: "",
    description: "",
  });
  
  // Redirect to login if not authenticated as admin
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
            <Button onClick={() => setLocation("/admin/login")} className="w-full">
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { data: teams = [], isLoading } = useQuery<TeamWithProgress[]>({
    queryKey: ['/api/teams'],
  });

  const { data: cohorts = [] } = useQuery<Cohort[]>({
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
    onSuccess: () => {
      toast({
        title: "Cohort updated successfully",
        description: "The cohort settings have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cohorts'] });
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

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/export', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
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
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export team progress data.",
        variant: "destructive",
      });
    }
  };

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
    return Math.max(0, Math.min(100, ((currentPhase - 1) / 7) * 100));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
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
              <Button
                onClick={handleExportCSV}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs defaultValue="teams" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="teams" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Teams</span>
                </TabsTrigger>
                <TabsTrigger value="cohorts" className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Cohorts</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="teams" className="p-0">
                {teams.length === 0 ? (
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
                                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {(team as any).cohortTag}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="bg-primary bg-opacity-10 text-primary">
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
                                  {team.currentPhase - 1}/7
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
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Assign Teams</span>
                          </Button>
                        </DialogTrigger>
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
                        <DialogTrigger asChild>
                          <Button className="flex items-center space-x-2">
                            <Plus className="w-4 h-4" />
                            <span>New Cohort</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Cohort</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="cohort-tag">Cohort Tag</Label>
                              <Input
                                id="cohort-tag"
                                value={newCohort.tag}
                                onChange={(e) => setNewCohort({ ...newCohort, tag: e.target.value })}
                                placeholder="e.g., spring-2024"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cohort-name">Cohort Name</Label>
                              <Input
                                id="cohort-name"
                                value={newCohort.name}
                                onChange={(e) => setNewCohort({ ...newCohort, name: e.target.value })}
                                placeholder="e.g., Spring 2024 Cohort"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cohort-description">Description</Label>
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

                  {cohorts.length === 0 ? (
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
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={cohort.submissionsOpen ? "default" : "secondary"}>
                                      {cohort.submissionsOpen ? "Open" : "Closed"}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => updateCohortMutation.mutate({
                                        tag: cohort.tag,
                                        updates: { submissionsOpen: !cohort.submissionsOpen }
                                      })}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Settings className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">Voting</span>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={cohort.votingOpen ? "default" : "secondary"}>
                                      {cohort.votingOpen ? "Open" : "Closed"}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => updateCohortMutation.mutate({
                                        tag: cohort.tag,
                                        updates: { votingOpen: !cohort.votingOpen }
                                      })}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Settings className="w-3 h-3" />
                                    </Button>
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
  );
}