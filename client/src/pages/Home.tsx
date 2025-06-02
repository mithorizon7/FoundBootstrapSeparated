import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamModal } from "@/components/TeamModal";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Rocket, ArrowRight, Users, Clock, Target } from "lucide-react";

export default function Home() {
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user has any saved progress
    const hasLocalData = localStorage.getItem('phase1_data');
    if (!hasLocalData) {
      // Show team modal for new users
      setTeamModalOpen(true);
    }
  }, []);

  const handleGetStarted = () => {
    setTeamModalOpen(true);
  };

  const handleContinue = () => {
    setLocation('/phase/1');
  };

  const handleTeamSelected = (teamCode: string) => {
    setLocation(`/phase/1?team_id=${teamCode}`);
  };

  const features = [
    {
      icon: Target,
      title: "7 Strategic Phases",
      description: "From market research to product launch, follow a proven framework used by successful startups."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your team in real-time. All progress is automatically saved and synced."
    },
    {
      icon: Clock,
      title: "AI-Powered Prompts",
      description: "Generate professional-grade prompts for AI tools like ChatGPT and Gemini to accelerate your research."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
              <Rocket className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Found a Company in <span className="text-primary">Two Hours</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A sprint that shows how a small team armed with today's generative-AI tools can do—in a single workshop—what once took weeks: scout a market, design a differentiated offer, create a full media kit, and launch a live, interactive, AI-powered website.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-primary hover:bg-blue-700 text-white px-8 py-4 text-lg"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <Button
              onClick={handleContinue}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg"
            >
              Continue Alone
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Process Overview */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-2xl text-center">The 7-Phase Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { phase: 1, title: "Market & Competitor Research", description: "Panoramic, data-backed view of market size, competitors, and customer pain points using AI analysis" },
                { phase: 2, title: "Competitor Matrix Construction", description: "Transform research into quantitative competitor matrix with threat scoring and strategic gaps" },
                { phase: 3, title: "Market Positioning & Value Proposition", description: "Craft differentiated market position and compelling value proposition for target customers" },
                { phase: 4, title: "Product Design & Feature Definition", description: "Define MVP features, user experience, and technical architecture for your core offering" },
                { phase: 5, title: "Media Kit & Brand Assets", description: "Create comprehensive brand messaging, visual guidelines, and marketing materials" },
                { phase: 6, title: "Website & Digital Presence", description: "Build conversion-optimized website with clear value proposition and lead generation" },
                { phase: 7, title: "Launch Strategy & Go-to-Market", description: "Comprehensive launch plan with customer acquisition, marketing channels, and success metrics" }
              ].map((phase) => (
                <div key={phase.phase} className="text-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-semibold">{phase.phase}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{phase.title}</h3>
                  <p className="text-sm text-gray-600">{phase.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <TeamModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        onTeamSelected={handleTeamSelected}
      />
    </div>
  );
}
