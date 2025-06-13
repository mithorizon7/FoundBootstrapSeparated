import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Field } from "./Field";
import { PromptPreview } from "./PromptPreview";
import { SelectionCard } from "./SelectionCard";
import { ChevronLeft, ChevronRight, ChevronDown, Info, Vote, Save, Copy, CheckCircle, Clock, FileText, Target, ArrowRight, Globe, Upload } from "lucide-react";
import { savePhaseData, getPhaseData, saveToLocalStorage, getFromLocalStorage, getAllLocalStorageData, getAllPhaseDataForTeam, updateTeamPhase } from "@/lib/db";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { PHASE_CONFIG } from "../../../shared/constants";
import type { Team, Cohort } from "@shared/schema";

// Helper function to properly parse content with bullet points
function parseContentWithBullets(content: string): string {
  // Split content into lines
  const lines = content.split('\n');
  const processedLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('• ')) {
      // This is a bullet point line
      const bulletContent = trimmedLine.substring(2); // Remove '• '
      const processedBulletContent = bulletContent
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-neutral-800 font-bold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-primary font-semibold">$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-neutral-100 text-neutral-800 px-2 py-1 rounded text-sm font-mono border">$1</code>');
      
      processedLines.push(
        `<div class="flex items-start gap-3 my-2"><span class="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span><span>${processedBulletContent}</span></div>`
      );
    } else if (trimmedLine === '') {
      // Empty line - add spacing
      processedLines.push('<div class="my-4"></div>');
    } else {
      // Regular line
      const processedContent = trimmedLine
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-neutral-800 font-bold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-primary font-semibold">$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-neutral-100 text-neutral-800 px-2 py-1 rounded text-sm font-mono border">$1</code>');
      
      processedLines.push(`<p class="my-2">${processedContent}</p>`);
    }
  }
  
  return processedLines.join('');
}

interface FieldConfig {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "color";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  persist?: boolean;
  help?: string;
}

interface PhaseConfig {
  phase: number;
  title: string;
  intro: string;
  estimatedTime?: string;
  fields: FieldConfig[];
  promptTemplate: string;
  instructions?: string[];
  decisionBoxContent?: {
    title: string;
    subtitle: string;
    sections: Array<{
      number: string;
      title: string;
      items: Array<{
        label: string;
        content: string;
      }>;
    }>;
    action: {
      title: string;
      items: string[];
    };
  };
  stepByStepFlow?: Array<{
    step: number | string;
    action: string;
    time?: string;
    details?: {
      title: string;
      steps: Array<{
        number: string;
        action: string;
      }>;
    };
  }>;
  expectedOutput?: {
    fileCreated?: string;
    whyItMatters?: string;
    nextSteps?: string;
  };
}

interface PhasePageProps {
  config: PhaseConfig;
  teamId?: number;
  teamCode?: string;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function PhasePage({ config, teamId, teamCode, onNext, onPrevious }: PhasePageProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [allPhaseData, setAllPhaseData] = useState<Record<string, any>>({});
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [showcaseLoading, setShowcaseLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current phase is the final phase (Phase 8)
  const isFinalPhase = config.phase === PHASE_CONFIG.TOTAL_PHASES;

  // Fetch team data to check cohort membership
  const { data: teamData } = useQuery<Team>({
    queryKey: ['/api/teams', teamCode],
    queryFn: async () => {
      if (!teamCode) return null;
      const response = await fetch(`/api/teams/${teamCode}`);
      if (!response.ok) throw new Error('Failed to fetch team');
      return response.json();
    },
    enabled: !!teamCode,
  });

  // Fetch cohort data if team is in a cohort
  const { data: cohortData } = useQuery<Cohort>({
    queryKey: ['/api/cohorts', teamData?.cohortTag],
    queryFn: async () => {
      if (!teamData?.cohortTag) return null;
      const response = await fetch(`/api/cohorts/${teamData.cohortTag}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!teamData?.cohortTag,
  });

  // Website submission mutation
  const submitWebsiteMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!teamId) throw new Error('Team ID required');
      const response = await fetch(`/api/teams/${teamId}/website`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: url }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit website');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Website submitted successfully",
        description: "Your final website has been submitted to the cohort showcase.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId] });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      
      // Provide specific guidance for common errors
      if (error.message.includes("authentication") || error.message.includes("Cannot update")) {
        errorMessage = "Please log in to your team account first using your access code.";
      } else if (error.message.includes("Invalid request")) {
        errorMessage = "Please enter a valid website URL (e.g., https://yoursite.com).";
      }
      
      toast({
        title: "Failed to submit website",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Handle navigation to showcase with authentication
  const handleNavigateToShowcase = async () => {
    if (!teamData?.accessToken || !teamData?.cohortTag) {
      toast({
        title: "Authentication Error",
        description: "Team access token or cohort information not available.",
        variant: "destructive",
      });
      return;
    }

    setShowcaseLoading(true);
    
    try {
      const response = await fetch('/api/auth/team/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ access_token: teamData.accessToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate team session');
      }

      // Navigate to showcase after successful authentication
      setLocation(`/showcase/${teamData.cohortTag}`);
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Unable to authenticate your team session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowcaseLoading(false);
    }
  };

  // Load existing data on mount
  useEffect(() => {
    const loadData = async () => {
      if (teamId) {
        try {
          // Load current phase data
          const currentData = await getPhaseData(teamId, config.phase);
          if (currentData) {
            setFormData(currentData.data);
          }
          
          // Load all phase data for cross-phase templating
          const allData = await getAllPhaseDataForTeam(teamId);
          const processedData: Record<string, any> = {};
          allData.forEach(data => {
            processedData[`phase${data.phaseNumber}`] = data.data;
          });
          setAllPhaseData(processedData);
        } catch (error) {
          console.error('Error loading team data:', error);
        }
      } else {
        // Load from localStorage
        const currentData = getFromLocalStorage(config.phase);
        if (currentData) {
          setFormData(currentData);
        }
        
        const allData = getAllLocalStorageData();
        setAllPhaseData(allData);
      }
    };

    loadData();
  }, [config.phase, teamId]);

  // Set website URL from team data
  useEffect(() => {
    if (teamData?.submittedWebsiteUrl) {
      setWebsiteUrl(teamData.submittedWebsiteUrl);
    }
  }, [teamData]);

  // Auto-save data
  useEffect(() => {
    const saveData = async () => {
      if (Object.keys(formData).length === 0) return;

      try {
        if (teamId) {
          await savePhaseData(teamId, config.phase, formData);
        } else {
          saveToLocalStorage(config.phase, formData);
        }
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };

    const timeoutId = setTimeout(saveData, 1000); // Auto-save after 1 second of inactivity
    return () => clearTimeout(timeoutId);
  }, [formData, teamId, config.phase]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    config.fields.forEach(field => {
      if (field.required && !formData[field.id]?.trim()) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAndExit = async () => {
    setLoading(true);
    try {
      if (teamId) {
        await savePhaseData(teamId, config.phase, formData);
      } else {
        saveToLocalStorage(config.phase, formData);
      }
      
      toast({
        title: "Progress saved",
        description: "Your work has been saved successfully.",
      });
      
      setLocation('/');
    } catch (error) {
      toast({
        title: "Error saving",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToNext = async () => {
    if (!validateForm()) {
      toast({
        title: "Please complete all required fields",
        description: "Fill in all required information before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (teamId) {
        await savePhaseData(teamId, config.phase, formData);
        // Update team's current phase if proceeding to next
        if (config.phase < PHASE_CONFIG.TOTAL_PHASES) {
          await updateTeamPhase(teamId, config.phase + 1);
        }
      } else {
        saveToLocalStorage(config.phase, formData);
      }
      
      if (onNext) {
        onNext();
      } else if (config.phase < PHASE_CONFIG.TOTAL_PHASES) {
        const nextPhaseUrl = `/phase/${config.phase + 1}${teamCode ? `?team_id=${teamCode}` : ''}`;
        setLocation(nextPhaseUrl);
      }
    } catch (error) {
      toast({
        title: "Error saving progress",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPhase = () => {
    if (onPrevious) {
      onPrevious();
    } else if (config.phase > 1) {
      const prevPhaseUrl = `/phase/${config.phase - 1}${teamCode ? `?team_id=${teamCode}` : ''}`;
      setLocation(prevPhaseUrl);
    }
  };

  // Prepare data for template compilation
  const templateData = {
    ...formData,
  };

  // Organize phase data by phase number for template variables like {{phase1.field}}
  if (Array.isArray(allPhaseData)) {
    // Database format: array of phase data objects
    allPhaseData.forEach((phaseDataItem: any) => {
      const phaseKey = `phase${phaseDataItem.phaseNumber}`;
      templateData[phaseKey] = { 
        ...(typeof templateData[phaseKey] === 'object' ? templateData[phaseKey] : {}), 
        ...(typeof phaseDataItem.data === 'object' ? phaseDataItem.data : {}) 
      };
    });
  } else if (allPhaseData && typeof allPhaseData === 'object') {
    // localStorage format: already organized by phase keys (phase1, phase2, etc.)
    Object.keys(allPhaseData).forEach(phaseKey => {
      if (phaseKey.startsWith('phase') && (allPhaseData as any)[phaseKey]) {
        templateData[phaseKey] = { 
          ...(typeof templateData[phaseKey] === 'object' ? templateData[phaseKey] : {}), 
          ...(typeof (allPhaseData as any)[phaseKey] === 'object' ? (allPhaseData as any)[phaseKey] : {}) 
        };
      }
    });
  }

  const progressPercentage = (config.phase / PHASE_CONFIG.TOTAL_PHASES) * 100;
  
  // Check for actual missing required fields, not just validation errors
  const hasRequiredFieldsEmpty = config.fields.some(field => 
    field.required && !formData[field.id]?.trim()
  );
  const hasErrors = Object.keys(errors).length > 0 || hasRequiredFieldsEmpty;

  return (
    <div className="space-y-8">
      {/* Phase Header */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">{config.phase}</span>
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl md:text-3xl font-extrabold text-neutral-800 leading-tight tracking-tight mb-2">{config.title}</CardTitle>
              <p className="text-base text-neutral-600 font-semibold">
                Phase {config.phase} of {PHASE_CONFIG.TOTAL_PHASES}
                {config.estimatedTime && ` • ${config.estimatedTime}`}
              </p>
            </div>
          </div>
          
          <Progress value={progressPercentage} className="mb-4" />
          
          <div className="mt-6">
            <div className="text-lg md:text-xl text-neutral-700 leading-relaxed font-medium max-w-5xl">
              <div dangerouslySetInnerHTML={{ 
                __html: parseContentWithBullets(config.intro)
              }} />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Decision Box Content */}
      {config.decisionBoxContent && (
        <Card className="bg-gradient-to-r from-primary-100 to-neutral-100 border-primary-400/30 transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-px shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center space-x-3 text-neutral-800 font-bold tracking-tight text-xl md:text-2xl mb-3">
              <Vote className="w-6 h-6 text-primary" />
              <span>Phase {config.phase} Decision Box: {config.decisionBoxContent.title}</span>
            </CardTitle>
            <p className="text-lg text-neutral-600 font-medium leading-relaxed">
              {config.decisionBoxContent.subtitle}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {config.decisionBoxContent.sections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg p-8 border border-neutral-300 shadow-sm hover:shadow-md transition-all duration-200 ease-out hover:-translate-y-px">
                <h3 className="text-xl md:text-2xl font-bold text-neutral-800 mb-6 flex items-center space-x-4">
                  <div className="min-w-10 h-10 px-3 bg-primary rounded-full flex items-center justify-center text-white font-bold text-base whitespace-nowrap shadow-md">
                    {section.number}
                  </div>
                  <span>{section.title}</span>
                </h3>
                <div className="space-y-6">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="border-l-4 border-primary/30 pl-6 py-2">
                      <h4 className="font-bold text-lg text-neutral-800 mb-3">{item.label}:</h4>
                      <div 
                        className="text-base text-neutral-700 leading-relaxed font-medium"
                        dangerouslySetInnerHTML={{ 
                          __html: parseContentWithBullets(item.content)
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Action Section */}
            <div className="bg-primary/10 rounded-lg p-6 border border-primary/30">
              <h3 className="text-lg font-semibold text-primary mb-3 flex items-center space-x-2">
                <ArrowRight className="w-5 h-5" />
                <span>{config.decisionBoxContent.action.title}</span>
              </h3>
              <p className="text-neutral-800 mb-3 font-medium">Once decided, write down:</p>
              <div className="space-y-3">
                {config.decisionBoxContent.action.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div 
                      className="text-neutral-700 font-medium leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: item
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-neutral-800 font-semibold">$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em class="text-primary font-medium">$1</em>')
                          .replace(/\{\{(.*?)\}\}/g, '<strong class="text-neutral-800 font-semibold">$1</strong>') 
                      }} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step-by-Step Flow - Full Width */}
      {config.stepByStepFlow && (
        <Card className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-neutral-300 transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-px">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-neutral-800 font-bold tracking-tight text-xl md:text-2xl">
              <ArrowRight className="w-6 h-6 text-primary" />
              <span>Step-by-Step Workflow</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {config.stepByStepFlow.map((step) => {
                // Check if this is an expandable step (has details property)
                const hasDetails = step.details && step.details.steps;
                
                return (
                  <div key={step.step} className={`bg-white rounded-lg shadow-md group border border-neutral-200 transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-px`}>
                    {hasDetails ? (
                      // Expandable accordion format for complex steps
                      <Collapsible>
                        <CollapsibleTrigger className="w-full p-6 text-left hover:bg-neutral-50 transition-colors duration-200">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-md">
                                {step.step}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div 
                                className="text-base md:text-lg text-neutral-700 font-medium leading-relaxed group-hover:text-neutral-800 transition-colors duration-200"
                                dangerouslySetInnerHTML={{
                                  __html: step.action
                                    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-neutral-800">$1</strong>')
                                    .replace(/\*([^*]+)\*/g, '<em class="font-semibold text-primary">$1</em>')
                                }}
                              />
                            </div>
                            <div className="flex-shrink-0">
                              <ChevronDown className="w-5 h-5 text-neutral-400 group-hover:text-primary transition-colors duration-200" />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-6 pb-6 border-t border-neutral-100">
                            <div className="pt-4 space-y-4">
                              {step.details && (
                                <>
                                  <h4 className="font-bold text-neutral-800 text-xl mb-4">{step.details.title}</h4>
                                  {step.details.steps.map((detailStep, index) => (
                                    <div key={index} className="flex items-start space-x-4 bg-neutral-50 rounded-lg p-6">
                                      <div className="flex-shrink-0">
                                        <div className="min-w-8 h-8 px-2 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary whitespace-nowrap">
                                          {detailStep.number}
                                        </div>
                                      </div>
                                      <div className="flex-1">
                                        <div 
                                          className="text-base text-neutral-700 leading-relaxed font-medium"
                                          dangerouslySetInnerHTML={{
                                            __html: parseContentWithBullets(detailStep.action)
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      // Simple format for regular steps
                      <div className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-md">
                              {step.step}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div 
                              className="text-neutral-700 font-medium leading-relaxed group-hover:text-neutral-800 transition-colors duration-200"
                              dangerouslySetInnerHTML={{
                                __html: step.action
                                  .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-neutral-800">$1</strong>')
                                  .replace(/\*([^*]+)\*/g, '<em class="italic text-primary font-medium">$1</em>')
                                  .replace(/(https?:\/\/[^\s\)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary-600 underline font-medium">$1</a>')
                              }}
                            />
                          </div>
                          {step.time && (
                            <div className="flex-shrink-0 flex items-center space-x-1 text-sm text-neutral-500">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">{step.time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout: Decision Box and Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Decision Box Form */}
        <div className="space-y-6">
          <Card className="bg-white shadow-lg border border-neutral-200 transition-all duration-200 hover:shadow-xl hover:-translate-y-px">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-accent-200">
                  <Vote className="w-4 h-4 text-accent-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-neutral-800">Decision Box</CardTitle>
                <div className="flex-1"></div>
                <div className="flex items-center space-x-2 text-sm text-neutral-500">
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Auto-saving</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {config.fields.map((field) => {
                  // Use SelectionCard for visual_style and voice_persona in Phase 6
                  if (config.phase === 6 && (field.id === 'visual_style' || field.id === 'voice_persona')) {
                    return (
                      <div key={field.id} className="space-y-4">
                        <Label className="text-base font-semibold text-neutral-800">
                          {field.label}
                          {field.required && <span className="text-accent-600 ml-1">*</span>}
                        </Label>
                        {field.help && (
                          <p className="text-sm text-neutral-600 leading-relaxed">
                            {field.help}
                          </p>
                        )}
                        <div className="grid grid-cols-1 gap-4">
                          {field.options?.map((option) => {
                            // Parse title and description for voice_persona field
                            if (field.id === 'voice_persona') {
                              const match = option.label.match(/^(.+?)\s*\((.+)\)$/);
                              const title = match ? match[1].trim() : option.label;
                              const description = match ? match[2].trim() : '';
                              
                              return (
                                <SelectionCard
                                  key={option.value}
                                  title={title}
                                  description={description}
                                  isSelected={formData[field.id] === option.value}
                                  onClick={() => handleFieldChange(field.id, option.value)}
                                />
                              );
                            }
                            
                            // For visual_style, use label as title and create appropriate descriptions
                            const descriptions: Record<string, string> = {
                              "Clean & Minimalist": "Conveys sophistication, order, and expertise. Clean lines, plenty of white space, and refined aesthetics that communicate premium quality and professionalism.",
                              "Organic & Natural": "Emphasizes authenticity, wellness, and environmental consciousness. Soft textures, natural colors, and organic shapes that feel approachable and trustworthy.",
                              "Bold & Dynamic": "Projects confidence, innovation, and energy. Vibrant colors, strong contrasts, and dynamic compositions that capture attention and communicate disruption.",
                              "Elegant & Sensual": "Suggests luxury, desire, and premium experience. Rich textures, warm lighting, and sophisticated styling that appeals to aspirational desires.",
                              "Playful & Vibrant": "Communicates fun, creativity, and accessibility. Bright colors, engaging compositions, and approachable aesthetics that feel friendly and inviting."
                            };
                            
                            return (
                              <SelectionCard
                                key={option.value}
                                title={option.label}
                                description={descriptions[option.value] || ""}
                                isSelected={formData[field.id] === option.value}
                                onClick={() => handleFieldChange(field.id, option.value)}
                              />
                            );
                          })}
                        </div>
                        {errors[field.id] && (
                          <p className="text-sm text-accent-600 font-medium">{errors[field.id]}</p>
                        )}
                      </div>
                    );
                  }

                  // Use regular Field component for other fields
                  return (
                    <Field
                      key={field.id}
                      config={field}
                      value={formData[field.id] || ''}
                      onChange={(value) => handleFieldChange(field.id, value)}
                      error={errors[field.id]}
                    />
                  );
                })}
              </div>

              {hasErrors && (
                <Alert className="mt-4 border-accent-200 bg-accent-100">
                  <AlertDescription className="text-accent-700">
                    Please complete all required fields to continue.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Phase Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Phases completed</span>
                <span className="font-medium">{config.phase - 1} of {PHASE_CONFIG.TOTAL_PHASES}</span>
              </div>
              <Progress value={((config.phase - 1) / PHASE_CONFIG.TOTAL_PHASES) * 100} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Prompt Preview */}
        <div className="space-y-6">
          <PromptPreview template={config.promptTemplate} data={templateData} />
        </div>
      </div>

      {/* Expected Output - Full Width */}
      {config.expectedOutput && (
        <Alert className="bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <AlertDescription className="text-neutral-700">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-lg text-neutral-800">Expected Output & What Happens Next</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {config.expectedOutput.fileCreated && (
                <div className="bg-white rounded-lg p-4 border border-primary-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="font-medium text-neutral-800 mb-2 flex items-center space-x-1">
                    <FileText className="w-4 h-4 text-primary-600" />
                    <span>File Created:</span>
                  </div>
                  <div 
                    className="text-sm text-primary-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: config.expectedOutput.fileCreated
                        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-neutral-800">$1</strong>')
                        .replace(/\*([^*]+)\*/g, '<em class="text-primary font-medium">$1</em>')
                        .replace(/• /g, '<div class="flex items-start gap-2 my-1"><span class="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span><span>')
                        .replace(/\n(?=• )/g, '</span></div>')
                        .replace(/\n\n/g, '</span></div><div class="my-2"></div>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              )}
              {config.expectedOutput.whyItMatters && (
                <div className="bg-white rounded-lg p-4 border border-primary-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="font-medium text-neutral-800 mb-2 flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-accent-600" />
                    <span>Why it matters:</span>
                  </div>
                  <div 
                    className="text-sm text-neutral-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: config.expectedOutput.whyItMatters
                        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-neutral-800">$1</strong>')
                        .replace(/\*([^*]+)\*/g, '<em class="text-primary font-medium">$1</em>')
                        .replace(/• /g, '<div class="flex items-start gap-2 my-1"><span class="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0"></span><span>')
                        .replace(/\n(?=• )/g, '</span></div>')
                        .replace(/\n\n/g, '</span></div><div class="my-2"></div>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              )}
              {config.expectedOutput.nextSteps && (
                <div className="bg-white rounded-lg p-4 border border-primary-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="font-medium text-neutral-800 mb-2 flex items-center space-x-1">
                    <ArrowRight className="w-4 h-4 text-primary-600" />
                    <span>Next Steps:</span>
                  </div>
                  <div 
                    className="text-sm text-neutral-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: config.expectedOutput.nextSteps
                        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-neutral-800">$1</strong>')
                        .replace(/\*([^*]+)\*/g, '<em class="text-primary font-medium">$1</em>')
                        .replace(/• /g, '<div class="flex items-start gap-2 my-1"><span class="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span><span>')
                        .replace(/\n(?=• )/g, '</span></div>')
                        .replace(/\n\n/g, '</span></div><div class="my-2"></div>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Website Submission Section - Final Phase Only */}
      {isFinalPhase && teamData?.cohortTag && cohortData && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-neutral-800 font-semibold text-lg">
              <Globe className="w-5 h-5 text-green-600" />
              <span>Submit Your Deployed Website</span>
            </CardTitle>
            <p className="text-neutral-600 mt-2 text-sm font-medium">
              Your team is part of the <strong>{cohortData.name}</strong> cohort. Submit your final website to participate in the showcase and voting.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-6 border border-green-200">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="website-url" className="text-base font-medium text-neutral-800">
                    Website URL
                  </Label>
                  <p className="text-sm text-neutral-600 mb-3">
                    Enter the full URL of your deployed website (e.g., https://yourteam.replit.app)
                  </p>
                  <Input
                    id="website-url"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://your-website-url.com"
                    className="text-base"
                  />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-neutral-600">
                    {teamData.submittedWebsiteUrl ? (
                      <span className="flex items-center space-x-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span>Website submitted successfully</span>
                      </span>
                    ) : (
                      <span>Submit your website to join the cohort showcase</span>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => submitWebsiteMutation.mutate(websiteUrl)}
                    disabled={!websiteUrl.trim() || submitWebsiteMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {submitWebsiteMutation.isPending 
                        ? "Submitting..." 
                        : teamData.submittedWebsiteUrl 
                          ? "Update Submission" 
                          : "Submit Website"
                      }
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Persistent Secure Link Display */}
            {teamData?.accessToken && (
              <div className="mt-6 pt-4 border-t">
                <Label htmlFor="secure-link" className="text-base font-semibold text-neutral-800">
                  Your Team's Permanent Secure Link
                </Label>
                <p className="text-sm text-neutral-600 mt-1 mb-2">
                  Bookmark this link to easily resume your work on another computer or browser.
                </p>
                <Input
                  id="secure-link"
                  type="text"
                  readOnly
                  value={`${window.location.origin}/phase/1?team_id=${teamData.code}&token=${teamData.accessToken}`}
                  className="font-mono text-sm"
                />
              </div>
            )}
            
            {teamData.submittedWebsiteUrl && cohortData && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 text-blue-800 mb-2">
                  <Vote className="w-4 h-4" />
                  <span className="font-medium">Next Steps</span>
                </div>
                <p className="text-blue-700 text-sm mb-3">
                  {cohortData.votingOpen 
                    ? "Your website has been submitted! You can now view the cohort showcase and vote for your favorite submissions."
                    : "Your website has been submitted! You can now view other team submissions in the cohort showcase."
                  }
                </p>
                <div className="flex space-x-3">
                  <Button
                    size="sm"
                    onClick={handleNavigateToShowcase}
                    disabled={showcaseLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {showcaseLoading 
                      ? "Authenticating..." 
                      : cohortData.votingOpen 
                        ? "Go to Showcase & Vote" 
                        : "View Showcase"
                    }
                  </Button>
                  {cohortData.votingOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/results/${teamData.cohortTag}`)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      View Results
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legacy Instructions (fallback) */}
      {config.instructions && !config.stepByStepFlow && (
        <Alert className="bg-primary-50 border-primary-200">
          <Info className="w-4 h-4 text-primary-600" />
          <AlertDescription className="text-neutral-700">
            <div className="font-semibold mb-2">Next Steps:</div>
            <ol className="list-decimal list-inside space-y-1">
              {config.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation Footer */}
      <div className="lg:col-span-2 mt-12 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousPhase}
          disabled={config.phase === 1}
          className={cn("flex items-center space-x-2 border border-neutral-300 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 transition-colors duration-200", 
            config.phase === 1 && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Phase</span>
        </Button>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleSaveAndExit}
            disabled={loading}
            className={cn(
              "flex items-center space-x-2 border border-neutral-300 text-neutral-600 hover:bg-accent-600 hover:text-white hover:border-accent-600 transition-colors duration-200",
              loading ? "opacity-50 cursor-not-allowed" : "opacity-100 cursor-pointer"
            )}
          >
            <Save className="w-4 h-4" />
            <span>Save & Exit</span>
          </Button>
          
          {config.phase === PHASE_CONFIG.TOTAL_PHASES ? (
            <Button
              onClick={async () => {
                if (hasErrors) return;
                setLoading(true);
                try {
                  if (teamId) {
                    await savePhaseData(teamId, config.phase, formData);
                  } else {
                    saveToLocalStorage(config.phase, formData);
                  }
                  toast({
                    title: "🚀 Launch Complete!",
                    description: "Your final phase data has been saved successfully.",
                  });
                } catch (error) {
                  toast({
                    title: "Error saving progress",
                    description: "Failed to save your progress. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setLoading(false);
                }
              }}
              disabled={hasErrors || loading}
              className={cn("flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700 transition-all duration-200 ease-out transform hover:-translate-y-px shadow-sm hover:shadow-md font-semibold tracking-wide",
                (hasErrors || loading) && "opacity-50 cursor-not-allowed"
              )}
            >
              <span>🚀 Launched!</span>
            </Button>
          ) : (
            <Button
              onClick={handleProceedToNext}
              disabled={hasErrors || loading}
              className={cn("flex items-center space-x-2 bg-primary-500 text-white hover:bg-primary-600 transition-all duration-200 ease-out transform hover:-translate-y-px shadow-sm hover:shadow-md font-semibold tracking-wide",
                (hasErrors || loading) && "opacity-50 cursor-not-allowed"
              )}
            >
              <span>Continue to Phase {config.phase + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
