import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Award, ExternalLink } from "lucide-react";
import type { Cohort, Team } from "@shared/schema";

interface VotingResult {
  teamId: number;
  teamName: string;
  totalPoints: number;
  votes: Array<{rank: number, count: number}>;
}

export default function Results() {
  const { cohortTag } = useParams();

  const { data: cohort } = useQuery<Cohort>({
    queryKey: ['/api/admin/cohorts', cohortTag],
    queryFn: async () => {
      const response = await fetch(`/api/admin/cohorts/${cohortTag}`);
      if (!response.ok) throw new Error('Failed to fetch cohort');
      return response.json();
    },
    enabled: !!cohortTag,
  });

  const { data: results = [], isLoading } = useQuery<VotingResult[]>({
    queryKey: ['/api/showcase', cohortTag, 'results'],
    queryFn: async () => {
      const response = await fetch(`/api/showcase/${cohortTag}/results`);
      if (!response.ok) throw new Error('Failed to fetch results');
      return response.json();
    },
    enabled: !!cohortTag,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/api/showcase', cohortTag],
    queryFn: async () => {
      const response = await fetch(`/api/showcase/${cohortTag}`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
    enabled: !!cohortTag,
  });

  const getTeamWebsite = (teamId: number): string | null => {
    const team = teams.find(t => t.id === teamId);
    return team?.submittedWebsiteUrl || null;
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-sm font-medium">{position}</div>;
    }
  };

  const getRankBadgeVariant = (position: number) => {
    switch (position) {
      case 1:
        return "default";
      case 2:
        return "secondary";
      case 3:
        return "outline";
      default:
        return "outline";
    }
  };

  if (!cohortTag) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Cohort Not Found</h1>
              <p className="text-gray-600">Please check the URL and try again.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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

  const maxPoints = results.length > 0 ? Math.max(...results.map(r => r.totalPoints)) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Voting Results: {cohort?.name}
          </h1>
          <p className="text-gray-600">
            Final voting results for the cohort showcase competition.
          </p>
        </div>

        {results.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No votes yet</h3>
              <p className="text-gray-600">
                Results will appear here once voting begins and teams submit their votes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Podium for top 3 */}
            {results.length >= 3 && (
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-center text-2xl">🏆 Top 3 Winners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {results.slice(0, 3).map((result, index) => {
                      const position = index + 1;
                      const website = getTeamWebsite(result.teamId);
                      return (
                        <div key={result.teamId} className="text-center">
                          <div className="flex justify-center mb-3">
                            {getRankIcon(position)}
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{result.teamName}</h3>
                          <Badge variant={getRankBadgeVariant(position)} className="mb-3">
                            {result.totalPoints} points
                          </Badge>
                          {website && (
                            <div>
                              <a
                                href={website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-primary hover:text-primary-dark text-sm"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>View Website</span>
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Full results table */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => {
                    const position = index + 1;
                    const website = getTeamWebsite(result.teamId);
                    const progressPercentage = maxPoints > 0 ? (result.totalPoints / maxPoints) * 100 : 0;
                    
                    return (
                      <div key={result.teamId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getRankIcon(position)}
                            <div>
                              <h3 className="font-semibold text-lg">{result.teamName}</h3>
                              <p className="text-sm text-gray-600">#{position}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{result.totalPoints}</div>
                            <div className="text-sm text-gray-600">points</div>
                          </div>
                        </div>
                        
                        <Progress value={progressPercentage} className="mb-3" />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-4 text-sm">
                            {result.votes.map(vote => (
                              <span key={vote.rank} className="text-gray-600">
                                {vote.rank === 1 ? '🥇' : vote.rank === 2 ? '🥈' : '🥉'} {vote.count}
                              </span>
                            ))}
                          </div>
                          {website && (
                            <a
                              href={website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-primary hover:text-primary-dark text-sm"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Visit Website</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Voting breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Scoring System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Points awarded:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>1st place vote: 3 points</li>
                    <li>2nd place vote: 2 points</li>
                    <li>3rd place vote: 1 point</li>
                  </ul>
                  <p className="mt-4">
                    Teams vote for their top 3 favorite websites from other teams in their cohort.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}