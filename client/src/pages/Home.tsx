import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamModal } from "@/components/TeamModal";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Footer } from "@/components/Footer";
import { ArrowRight, Users, Clock, Target } from "lucide-react";
import logoSrc from "@/assets/logo.png";
import { WORKSPACE } from "@/lib/copy";

export default function Home() {
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Removed automatic modal popup - now only opens when user clicks "Get Started"

  const handleGetStarted = () => {
    setWorkspaceModalOpen(true);
  };

  const handleContinue = () => {
    // Scroll to activities section
    const activitiesSection = document.querySelector('[data-activities-section]');
    if (activitiesSection) {
      activitiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleWorkspaceSelected = (teamCode: string) => {
    // Scroll to activities section after workspace selection
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
      title: "Cross-Device Access",
      description: "Resume your work from any device using your Workspace Code. All progress is automatically saved and synced across activities."
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
                alt="Applied GenAI Lab Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-800 mb-8 leading-tight tracking-tight">
            Applied <span className="text-primary">GenAI Lab</span>
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
              {WORKSPACE.startLabel}
            </Button>
          </div>
          
          <div className="mt-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl" />
            <div className="relative p-8 backdrop-blur-sm bg-white/40 rounded-3xl border border-white/50 shadow-lg">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold tracking-wider uppercase rounded-full shadow-md">
                  Your Path, Your Pace
                </div>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4 text-center mt-3">
                Complete Freedom to Choose
              </h3>
              <p className="text-gray-700 text-center max-w-2xl mx-auto leading-relaxed">
                Need just market research? Start with <span className="font-semibold text-blue-700">Activity 1</span>. 
                Want to focus on branding? Jump to <span className="font-semibold text-indigo-700">Activity 6</span>. 
                Each activity is independent and provides immediate value—complete them in any order that works for you.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-10 mb-20">
          {features.map((feature, index) => (
            <Card key={index} className="group relative text-center p-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50/50">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="pb-4 relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <feature.icon className="w-8 h-8 text-transparent bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text" style={{ fill: 'url(#gradient)' }} />
                  <svg width="0" height="0">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#4F46E5" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <p className="text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Process Overview */}
        <Card className="bg-gradient-to-br from-white via-gray-50/30 to-white shadow-xl border-0 relative overflow-hidden" data-activities-section>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/10 to-purple-100/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-100/10 to-blue-100/10 rounded-full blur-3xl" />
          <CardHeader className="pb-8 relative">
            <CardTitle className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
              GenAI Lab Activities
            </CardTitle>
            <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto leading-relaxed">
              Choose from eight independent activities designed to strengthen different aspects of your GenAI-assisted development
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
                <div key={phase.phase} className="group text-center space-y-4 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50/30 p-6 rounded-2xl transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 border border-transparent hover:border-gray-100" onClick={() => setLocation(`/phase/${phase.phase}`)}>
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-xl">{phase.phase}</span>
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300" />
                  </div>
                  <h3 className="font-bold text-lg bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">{phase.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{phase.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <TeamModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        onTeamSelected={handleWorkspaceSelected}
      />
      
      <Footer showLinks={true} />
    </div>
  );
}
