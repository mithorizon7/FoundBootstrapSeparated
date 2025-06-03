import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Download, Users, Shield } from "lucide-react";
import { getTimeAgo } from "@/lib/utils";

interface TeamWithProgress {
  id: number;
  code: string;
  name: string;
  currentPhase: number;
  createdAt: string;
  updatedAt: string;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  // Redirect to login if not authenticated as admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <p className="text-gray-600">You need admin privileges to access this page.</p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation("/admin-login")}
              className="w-full"
            >
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

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/export', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'teams-export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: "Teams data has been downloaded as CSV.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPhaseTitle = (phaseNumber: number): string => {
    const phases = [
      "Market Research",
      "Competitor Analysis", 
      "Market Positioning",
      "Product Design",
      "Media Kit",
      "Website Builder",
      "Launch Strategy"
    ];
    return phases[phaseNumber - 1] || "Unknown";
  };

  const getProgressPercentage = (currentPhase: number): number => {
    return ((currentPhase - 1) / 7) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
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
                <p className="text-gray-600 mt-1">Monitor team progress and export data</p>
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
                              <div className="text-sm text-gray-500">Code: {team.code}</div>
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
