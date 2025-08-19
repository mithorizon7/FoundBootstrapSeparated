import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamModal } from "@/components/TeamModal";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Footer } from "@/components/Footer";
import { ArrowRight, Users, Clock, Target } from "lucide-react";
import logoSrc from "@/assets/logo.png";

export default function Home() {
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Removed automatic modal popup - now only opens when user clicks "Get Started"

  const handleGetStarted = () => {
    setTeamModalOpen(true);
  };

  const handleContinue = () => {
    // Scroll to activities section
    const activitiesSection = document.querySelector('[data-activities-section]');
    if (activitiesSection) {
      activitiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTeamSelected = (teamCode: string) => {
    // Scroll to activities section after team selection
    setTimeout(() => {
      const activitiesSection = document.querySelector('[data-activities-section]');
      if (activitiesSection) {
        activitiesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const features = [
    {
      icon: Target,
      title: "Modular Activities",
      description: "Eight independent business development activities. Pick what you need, skip what you don't. Complete them in any order."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your team in real-time. All progress is automatically saved and synced across activities."
    },
    {
      icon: Clock,
      title: "AI-Powered Prompts",
      description: "Generate professional-grade prompts for AI tools like ChatGPT and Gemini to accelerate your research and development."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex flex-col">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <img 
                src={logoSrc} 
                alt="Business Development Toolkit Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-800 mb-8 leading-tight tracking-tight">
            Business Development <span className="text-primary">Toolkit</span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-600 mb-10 max-w-4xl mx-auto leading-relaxed font-medium">
            Eight independent strategic activities for entrepreneurs. Choose what you need, when you need it. Market research, competitive analysis, product design, branding, and more—each activity provides standalone value and can be completed in any order.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => {
                const activitiesSection = document.querySelector('[data-activities-section]');
                if (activitiesSection) {
                  activitiesSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                  handleGetStarted();
                }
              }}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg"
            >
              Browse Activities
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <Button
              onClick={handleGetStarted}
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 text-lg"
            >
              Start Session
            </Button>
          </div>
          
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-2 text-center">Complete Freedom to Choose</h3>
            <p className="text-blue-800 text-center max-w-2xl mx-auto">
              Need just market research? Start with Activity 1. Want to focus on branding? Jump to Activity 6. 
              Each activity is self-contained and provides immediate value—no prerequisites required.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-10 mb-20">
          {features.map((feature, index) => (
            <Card key={index} className="text-center p-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold text-neutral-800 mb-3">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-base text-neutral-600 leading-relaxed font-medium">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Process Overview */}
        <Card className="bg-white shadow-lg border-0" data-activities-section>
          <CardHeader className="pb-8">
            <CardTitle className="text-2xl md:text-3xl font-bold text-center text-neutral-800 mb-4">Strategic Business Activities</CardTitle>
            <p className="text-lg text-neutral-600 text-center max-w-3xl mx-auto leading-relaxed">
              Choose from eight independent activities designed to strengthen different aspects of your business development
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[
                { phase: 1, title: "Market Research", description: "Gain strategic insights into market size, competitors, and customer pain points using AI-powered analysis" },
                { phase: 2, title: "Competitor Matrix", description: "Build a quantitative competitor matrix with threat scoring to identify strategic opportunities" },
                { phase: 3, title: "Evidence Research", description: "Compile peer-reviewed evidence and credible research to validate your business concept" },
                { phase: 4, title: "Hero Offer Ideation", description: "Generate and evaluate product concepts to identify your strongest market opportunity" },
                { phase: 5, title: "Concept Brief Generation", description: "Transform your best concept into a detailed strategic brief with clear positioning" },
                { phase: 6, title: "Creative Asset Generation", description: "Develop brand messaging, visual identity, and marketing materials for your concept" },
                { phase: 7, title: "AI Voice Agent Setup", description: "Create an intelligent voice interface to represent and communicate your brand expertise" },
                { phase: 8, title: "Website Builder Guide", description: "Build a professional website using AI tools with comprehensive deployment guidance" }
              ].map((phase) => (
                <div key={phase.phase} className="text-center space-y-4 hover:bg-gray-50 p-4 rounded-lg transition-colors cursor-pointer" onClick={() => setLocation(`/phase/${phase.phase}`)}>
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto shadow-md">
                    <span className="text-white font-bold text-lg">{phase.phase}</span>
                  </div>
                  <h3 className="font-bold text-lg text-neutral-800 leading-tight">{phase.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed font-medium">{phase.description}</p>
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
      
      <Footer showLinks={true} />
    </div>
  );
}
