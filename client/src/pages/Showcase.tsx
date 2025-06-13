import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Star, Trophy, Vote } from "lucide-react";
import type { Team, Cohort } from "@shared/schema";

interface VoteSelection {
  voted_for_team_id: number;
  rank: number;
}

export default function Showcase() {
  const { cohortTag } = useParams();
  const [, setLocation] = useLocation();
  const [selectedVotes, setSelectedVotes] = useState<VoteSelection[]>([]);
  const [votingTeamId, setVotingTeamId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current team status from session
  const { data: votingTeam } = useQuery<Team>({
    queryKey: ['/api/auth/team/status'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/team/status', { credentials: 'include' });
        if (!response.ok) {
          if (response.status === 401) return null; // Not logged in
          throw new Error('Failed to fetch team status');
        }
        return response.json();
      } catch (error) {
        return null; // Treat errors as not logged in
      }
    },
    retry: false, // Don't retry on 401 errors
  });

  // Set voting team ID when team data is available
  useEffect(() => {
    if (votingTeam) {
      setVotingTeamId(votingTeam.id);
    }
  }, [votingTeam]);

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ['/api/showcase', cohortTag],
    queryFn: async () => {
      const response = await fetch(`/api/showcase/${cohortTag}`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
    enabled: !!cohortTag,
  });

  const { data: cohort } = useQuery<Cohort>({
    queryKey: ['/api/admin/cohorts', cohortTag],
    queryFn: async () => {
      const response = await fetch(`/api/admin/cohorts/${cohortTag}`);
      if (!response.ok) throw new Error('Failed to fetch cohort');
      return response.json();
    },
    enabled: !!cohortTag,
  });

  const { data: existingVotes = [] } = useQuery({
    queryKey: ['/api/showcase', cohortTag, 'votes', votingTeamId],
    queryFn: async () => {
      if (!votingTeamId) return [];
      const response = await fetch(`/api/showcase/${cohortTag}/vote?team_id=${votingTeamId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!cohortTag && !!votingTeamId,
  });

  const submitVotesMutation = useMutation({
    mutationFn: async (votes: VoteSelection[]) => {
      const response = await fetch(`/api/showcase/${cohortTag}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include session cookies for authentication
        body: JSON.stringify({
          votes
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Votes submitted successfully",
        description: "Thank you for participating in the showcase voting!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/showcase'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit votes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVoteSelection = (teamId: number, rank: number) => {
    if (teamId === votingTeamId) {
      toast({
        title: "Cannot vote for your own team",
        description: "Please select a different team.",
        variant: "destructive",
      });
      return;
    }

    setSelectedVotes(prev => {
      // Remove any existing vote for this rank or team
      const filtered = prev.filter(v => v.rank !== rank && v.voted_for_team_id !== teamId);
      // Add new vote
      return [...filtered, { voted_for_team_id: teamId, rank }];
    });
  };

  const getSelectedRank = (teamId: number): number | null => {
    const vote = selectedVotes.find(v => v.voted_for_team_id === teamId);
    return vote ? vote.rank : null;
  };

  const canSubmitVotes = selectedVotes.length === 3 && 
    selectedVotes.some(v => v.rank === 1) &&
    selectedVotes.some(v => v.rank === 2) &&
    selectedVotes.some(v => v.rank === 3);

  const hasAlreadyVoted = existingVotes.length > 0;

  const eligibleTeams = teams.filter(team => team.id !== votingTeamId);

  // Helper function to ensure URLs have proper protocol
  const ensureUrlProtocol = (url: string | null): string => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
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

  if (teamsLoading) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {cohort?.name || 'Cohort Showcase'}
          </h1>
          <p className="text-gray-600">
            {cohort?.description || 'View and vote for the best website submissions from this cohort.'}
          </p>
          
          {cohort?.votingOpen && !hasAlreadyVoted && votingTeamId && (
            votingTeam?.submittedWebsiteUrl ? (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Vote className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Voting Instructions</span>
                </div>
                <p className="text-blue-700 mt-2">
                  Select your top 3 favorite websites by clicking the rank buttons (1st, 2nd, 3rd place).
                  You cannot vote for your own team's submission.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-900">Submit Required to Vote</span>
                </div>
                <p className="text-orange-700 mt-2">
                  You must submit your team's website before you can vote for other teams. Complete your Phase 8 submission first.
                </p>
              </div>
            )
          )}
          
          {hasAlreadyVoted && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Thank you for voting!</span>
              </div>
              <p className="text-green-700 mt-2">
                You have already submitted your votes for this cohort.
              </p>
            </div>
          )}
        </div>

        {teams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">
                Website submissions will appear here once teams submit their final projects.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {eligibleTeams.map((team) => {
                const selectedRank = getSelectedRank(team.id);
                return (
                  <Card key={team.id} className="relative overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {selectedRank && (
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>{selectedRank === 1 ? '1st' : selectedRank === 2 ? '2nd' : '3rd'}</span>
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <a
                          href={ensureUrlProtocol(team.submittedWebsiteUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-primary hover:text-primary-dark"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Visit Website</span>
                        </a>
                        
                        {cohort?.votingOpen && !hasAlreadyVoted && votingTeamId && votingTeam?.submittedWebsiteUrl && (
                          <div className="flex space-x-2">
                            {[1, 2, 3].map((rank) => (
                              <Button
                                key={rank}
                                variant={selectedRank === rank ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleVoteSelection(team.id, rank)}
                                disabled={selectedVotes.some(v => v.rank === rank && v.voted_for_team_id !== team.id)}
                              >
                                {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {cohort?.votingOpen && !hasAlreadyVoted && votingTeamId && (
              <div className="flex justify-center">
                <Button
                  onClick={() => submitVotesMutation.mutate(selectedVotes)}
                  disabled={!canSubmitVotes || submitVotesMutation.isPending}
                  size="lg"
                  className="min-w-48"
                >
                  {submitVotesMutation.isPending ? "Submitting..." : "Submit Votes"}
                </Button>
              </div>
            )}
            
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={() => setLocation(`/results/${cohortTag}`)}
              >
                View Results
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}