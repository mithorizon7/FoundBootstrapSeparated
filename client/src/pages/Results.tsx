import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, ExternalLink, PartyPopper } from "lucide-react";
import type { Cohort, Team } from "@shared/schema";

interface VotingResult {
  teamId: number;
  teamName: string;
  totalPoints: number;
  votes: Array<{rank: number, count: number}>;
}

export default function Results() {
  const { cohortTag } = useParams();
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealStep, setRevealStep] = useState(0);
  const [animatedScores, setAnimatedScores] = useState<Record<number, number>>({});

  const { data: cohort } = useQuery<Cohort>({
    queryKey: ['/api/cohorts', cohortTag, 'status'],
    queryFn: async () => {
      const response = await fetch(`/api/cohorts/${cohortTag}/status`);
      if (!response.ok) throw new Error('Failed to fetch cohort');
      return response.json();
    },
    enabled: !!cohortTag,
  });

  const { data: results = [], isLoading, error } = useQuery<VotingResult[]>({
    queryKey: ['/api/showcase', cohortTag, 'results'],
    queryFn: async () => {
      const response = await fetch(`/api/showcase/${cohortTag}/results`);
      if (!response.ok) throw new Error('Failed to fetch results');
      return response.json();
    },
    enabled: !!cohortTag && (cohort as any)?.resultsVisible === true,
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

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const animateScore = (teamId: number, finalScore: number) => {
    const duration = 1500; // 1.5 seconds
    const steps = 30;
    const increment = finalScore / steps;
    let currentScore = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      currentScore = Math.min(Math.round(increment * step), finalScore);
      setAnimatedScores(prev => ({ ...prev, [teamId]: currentScore }));
      
      if (step >= steps) {
        clearInterval(timer);
      }
    }, duration / steps);
  };

  const handleReveal = async () => {
    setIsRevealed(true);
    triggerConfetti();
    
    // Animate in the podium positions with delays
    setTimeout(() => setRevealStep(1), 500);  // 3rd place
    setTimeout(() => setRevealStep(2), 1000); // 2nd place
    setTimeout(() => {
      setRevealStep(3); // 1st place
      triggerConfetti(); // Second confetti burst for winner
      
      // Start score animations for top 3
      if (results.length > 0) {
        results.slice(0, 3).forEach((result, index) => {
          setTimeout(() => animateScore(result.teamId, result.totalPoints), index * 200);
        });
        
        // Animate scores for remaining teams
        if (results.length > 3) {
          results.slice(3).forEach((result, index) => {
            setTimeout(() => animateScore(result.teamId, result.totalPoints), 4000 + index * 100);
          });
        }
      }
    }, 1500);
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

  if (isLoading || !cohort) {
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

  // Check if results are visible
  if (!(cohort as any)?.resultsVisible) {
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
          <Card>
            <CardContent className="text-center py-12">
              <div className="mb-4">
                <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-9a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Results Not Yet Available</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                The final votes are being tallied. Please check back later!
              </p>
            </CardContent>
          </Card>
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
        ) : !isRevealed ? (
          <div className="text-center py-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="max-w-md mx-auto"
            >
              <div className="mb-8">
                <PartyPopper className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">The Moment You've Been Waiting For</h2>
                <p className="text-gray-600">All votes have been counted. Are you ready to see who won?</p>
              </div>
              <Button
                onClick={handleReveal}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                🏆 And the winners are...
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Visual Podium for top 3 */}
            {results.length >= 3 && (
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-center text-3xl font-bold text-gray-800">🏆 Championship Podium</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative flex items-end justify-center space-x-4 mb-8" style={{ height: '400px' }}>
                    {/* 2nd Place - Left */}
                    <AnimatePresence>
                      {revealStep >= 2 && (
                        <motion.div
                          initial={{ x: -200, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="relative flex flex-col items-center"
                        >
                          <div className="w-32 h-40 bg-gradient-to-t from-gray-400 to-gray-300 border-2 border-gray-500 rounded-t-lg flex items-center justify-center mb-2">
                            <span className="text-white font-bold text-xl">2nd</span>
                          </div>
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-300 text-center min-w-40"
                          >
                            <Medal className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                            <h3 className="font-bold text-lg mb-2">{results[1]?.teamName}</h3>
                            <Badge variant="secondary" className="mb-2 text-lg font-bold">
                              {animatedScores[results[1]?.teamId] !== undefined 
                                ? animatedScores[results[1]?.teamId] 
                                : results[1]?.totalPoints} pts
                            </Badge>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* 1st Place - Center */}
                    <AnimatePresence>
                      {revealStep >= 3 && (
                        <motion.div
                          initial={{ y: -200, opacity: 0, scale: 0.8 }}
                          animate={{ y: 0, opacity: 1, scale: 1 }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="relative flex flex-col items-center"
                        >
                          <div className="w-36 h-52 bg-gradient-to-t from-yellow-500 to-yellow-300 border-2 border-yellow-600 rounded-t-lg flex items-center justify-center mb-2 shadow-lg">
                            <span className="text-yellow-900 font-bold text-2xl">1st</span>
                          </div>
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="bg-white p-6 rounded-lg shadow-2xl border-2 border-yellow-400 text-center min-w-44 relative animate-pulse"
                            style={{ 
                              boxShadow: '0 0 30px rgba(251, 191, 36, 0.6)'
                            }}
                          >
                            <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                            <h3 className="font-bold text-xl mb-3 text-yellow-900">{results[0]?.teamName}</h3>
                            <Badge className="mb-3 text-xl font-bold bg-yellow-500 text-yellow-900">
                              {animatedScores[results[0]?.teamId] !== undefined 
                                ? animatedScores[results[0]?.teamId] 
                                : results[0]?.totalPoints} pts
                            </Badge>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* 3rd Place - Right */}
                    <AnimatePresence>
                      {revealStep >= 1 && (
                        <motion.div
                          initial={{ x: 200, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="relative flex flex-col items-center"
                        >
                          <div className="w-28 h-28 bg-gradient-to-t from-amber-600 to-amber-400 border-2 border-amber-700 rounded-t-lg flex items-center justify-center mb-2">
                            <span className="text-amber-900 font-bold text-lg">3rd</span>
                          </div>
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="bg-white p-4 rounded-lg shadow-lg border-2 border-amber-300 text-center min-w-36"
                          >
                            <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                            <h3 className="font-bold text-lg mb-2">{results[2]?.teamName}</h3>
                            <Badge variant="outline" className="mb-2 text-lg font-bold border-amber-600 text-amber-700">
                              {animatedScores[results[2]?.teamId] !== undefined 
                                ? animatedScores[results[2]?.teamId] 
                                : results[2]?.totalPoints} pts
                            </Badge>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Website links for top 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {results.slice(0, 3).map((result, index) => {
                      const website = getTeamWebsite(result.teamId);
                      return website ? (
                        <motion.div
                          key={result.teamId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 2 + index * 0.2 }}
                          className="text-center"
                        >
                          <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Visit {result.teamName}</span>
                          </a>
                        </motion.div>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Full results table with animations */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3, duration: 0.8 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Complete Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.map((result, index) => {
                      const position = index + 1;
                      const website = getTeamWebsite(result.teamId);
                      const progressPercentage = maxPoints > 0 ? (result.totalPoints / maxPoints) * 100 : 0;
                      
                      return (
                        <motion.div
                          key={result.teamId}
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 3.5 + index * 0.1, duration: 0.5 }}
                          className={`border rounded-lg p-4 transition-all hover:shadow-lg ${
                            position <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {getRankIcon(position)}
                              <div>
                                <h3 className="font-semibold text-lg">{result.teamName}</h3>
                                <p className="text-sm text-gray-600">#{position}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <motion.div
                                key={`score-${result.teamId}`}
                                className="text-2xl font-bold text-primary"
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ delay: 4 + index * 0.1, duration: 0.5 }}
                              >
                                {animatedScores[result.teamId] !== undefined && position > 3
                                  ? animatedScores[result.teamId]
                                  : result.totalPoints}
                              </motion.div>
                              <div className="text-sm text-gray-600">points</div>
                            </div>
                          </div>
                          
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: 4.2 + index * 0.1, duration: 0.8 }}
                          >
                            <Progress value={progressPercentage} className="mb-3" />
                          </motion.div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-4 text-sm">
                              {result.votes.map(vote => (
                                <span key={vote.rank} className="text-gray-600">
                                  {vote.rank === 1 ? '🥇' : vote.rank === 2 ? '🥈' : '🥉'} {vote.count}
                                </span>
                              ))}
                            </div>
                            {website && (
                              <motion.a
                                href={website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-primary hover:text-primary-dark text-sm transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Visit Website</span>
                              </motion.a>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

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