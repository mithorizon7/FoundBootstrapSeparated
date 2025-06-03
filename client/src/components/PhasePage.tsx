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
import { ChevronLeft, ChevronRight, ChevronDown, Info, Vote, Save, Copy, CheckCircle, Clock, FileText, Target, ArrowRight, Globe, Upload } from "lucide-react";
import { savePhaseData, getPhaseData, saveToLocalStorage, getFromLocalStorage, getAllLocalStorageData, getAllPhaseDataForTeam, updateTeamPhase } from "@/lib/db";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { PHASE_CONFIG } from "../../../shared/constants";
import type { Team, Cohort } from "@shared/schema";

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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current phase is the final phase (Phase 8)
  const isFinalPhase = config.phase === Object.keys(PHASE_CONFIG).length;

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
    queryKey: ['/api/admin/cohorts', teamData?.cohortTag],
    queryFn: async () => {
      if (!teamData?.cohortTag) return null;
      const response = await fetch(`/api/admin/cohorts/${teamData.cohortTag}`);
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
        body: JSON.stringify({ website_url: url }),
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
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit website",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
        if (config.phase < 7) {
          await updateTeamPhase(teamId, config.phase + 1);
        }
      } else {
        saveToLocalStorage(config.phase, formData);
      }
      
      if (onNext) {
        onNext();
      } else if (config.phase < 7) {
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
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">{config.phase}</span>
            </div>
            <div>
              <CardTitle className="text-2xl page-title">{config.title}</CardTitle>
              <p className="text-sm text-gray-600 ui-label">
                Phase {config.phase} of {PHASE_CONFIG.TOTAL_PHASES}
                {config.estimatedTime && ` • ${config.estimatedTime}`}
              </p>
            </div>
          </div>
          
          <Progress value={progressPercentage} className="mb-4" />
          
          <div className="mt-4">
            <div className="text-lg text-gray-700 leading-relaxed ui-label max-w-4xl">
              <div dangerouslySetInnerHTML={{ 
                __html: config.intro
                  .replace(/\n\n/g, '</p><p class="mt-4">')
                  .replace(/^(.*)$/gm, '<p>$1</p>')
                  .replace(/• /g, '<li>')
                  .replace(/<p><li>/g, '<ul class="list-disc list-inside mt-2 space-y-1"><li>')
                  .replace(/<\/p>\s*<p><li>/g, '</li><li>')
                  .replace(/<li>([^<]*)<\/p>/g, '<li>$1</li></ul>')
                  .replace(/<p><\/p>/g, '')
              }} />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Decision Box Content */}
      {config.decisionBoxContent && (
        <Card className="bg-gradient-to-r from-primary-100 to-neutral-100 border-primary-400/30 card-premium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-neutral-800 section-header">
              <Vote className="w-5 h-5 text-primary" />
              <span>Phase {config.phase} Decision Box: {config.decisionBoxContent.title}</span>
            </CardTitle>
            <p className="text-neutral-600 mt-2 ui-label">
              {config.decisionBoxContent.subtitle}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {config.decisionBoxContent.sections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg p-6 card-premium">
                <h3 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    {section.number}
                  </div>
                  <span>{section.title}</span>
                </h3>
                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="border-l-4 border-primary/30 pl-4">
                      <h4 className="font-semibold text-neutral-800 mb-2">{item.label}:</h4>
                      <p className="text-neutral-700 leading-relaxed ui-label" dangerouslySetInnerHTML={{ __html: item.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-neutral-800">$1</strong>').replace(/\*(.*?)\*/g, '<em class="text-primary font-medium">$1</em>') }} />
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
              <p className="text-neutral-800 mb-3 ui-label font-medium">Once decided, write down:</p>
              <ul className="space-y-2">
                {config.decisionBoxContent.action.items.map((item, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-neutral-700 ui-label" dangerouslySetInnerHTML={{ __html: item.replace(/\{\{(.*?)\}\}/g, '<strong class="text-neutral-800">$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step-by-Step Flow - Full Width */}
      {config.stepByStepFlow && (
        <Card className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-neutral-300 card-premium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-neutral-800 section-header">
              <ArrowRight className="w-5 h-5 text-primary" />
              <span>Step-by-Step Workflow</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {config.stepByStepFlow.map((step) => {
                // Check if this is an expandable step (has details property)
                const hasDetails = step.details && step.details.steps;
                
                return (
                  <div key={step.step} className={`bg-white rounded-lg card-premium group border border-neutral-200 transition-all duration-200 ${hasDetails ? 'hover:border-primary/30' : 'hover:border-primary/30'}`}>
                    {hasDetails ? (
                      // Expandable accordion format for complex steps
                      <Collapsible>
                        <CollapsibleTrigger className="w-full p-6 text-left hover:bg-neutral-50 transition-colors duration-200">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="step-number w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white">
                                {step.step}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div 
                                className="text-neutral-700 text-premium leading-relaxed group-hover:text-neutral-800 transition-colors duration-200"
                                dangerouslySetInnerHTML={{
                                  __html: step.action
                                    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-neutral-800">$1</strong>')
                                    .replace(/\*([^*]+)\*/g, '<em class="italic text-primary font-medium">$1</em>')
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
                                  <h4 className="font-semibold text-neutral-800 text-lg">{step.details.title}</h4>
                                  {step.details.steps.map((detailStep, index) => (
                                    <div key={index} className="flex items-start space-x-3 bg-neutral-50 rounded-lg p-4">
                                      <div className="flex-shrink-0">
                                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-semibold text-primary">
                                          {detailStep.number}
                                        </div>
                                      </div>
                                      <div className="flex-1">
                                        <div 
                                          className="text-sm text-neutral-700 leading-relaxed"
                                          dangerouslySetInnerHTML={{
                                            __html: detailStep.action
                                              .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-neutral-800">$1</strong>')
                                              .replace(/\*([^*]+)\*/g, '<em class="italic text-primary font-medium">$1</em>')
                                              .replace(/•\s/g, '<br/>• ')
                                              .replace(/\n/g, '<br/>')
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
                            <div className="step-number w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white">
                              {step.step}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div 
                              className="text-neutral-700 text-premium leading-relaxed group-hover:text-neutral-800 transition-colors duration-200"
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
          <Card className="card-premium">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-accent-200">
                  <Vote className="w-4 h-4 text-accent-600" />
                </div>
                <CardTitle className="text-lg section-header">Decision Box</CardTitle>
                <div className="flex-1"></div>
                <div className="flex items-center space-x-2 text-sm text-neutral-500">
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                  <span className="text-premium">Auto-saving</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {config.fields.map((field) => (
                  <Field
                    key={field.id}
                    config={field}
                    value={formData[field.id] || ''}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    error={errors[field.id]}
                  />
                ))}
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
                <span className="font-medium">{config.phase - 1} of 7</span>
              </div>
              <Progress value={((config.phase - 1) / 7) * 100} />
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
        <Alert className="bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200 card-premium">
          <AlertDescription className="text-neutral-700">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-lg text-neutral-800 section-header">Expected Output & What Happens Next</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {config.expectedOutput.fileCreated && (
                <div className="bg-white rounded-lg p-4 border border-primary-200 card-premium group">
                  <div className="font-medium text-neutral-800 mb-2 flex items-center space-x-1">
                    <FileText className="w-4 h-4 text-primary-600" />
                    <span>File Created:</span>
                  </div>
                  <span className="font-mono bg-primary-50 px-3 py-2 rounded text-sm block text-center transition-all duration-200 group-hover:bg-primary-100 text-primary-700">
                    {config.expectedOutput.fileCreated}
                  </span>
                </div>
              )}
              {config.expectedOutput.whyItMatters && (
                <div className="bg-white rounded-lg p-4 border border-primary-200 card-premium">
                  <div className="font-medium text-neutral-800 mb-2 flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-accent-600" />
                    <span>Why it matters:</span>
                  </div>
                  <p className="text-sm text-neutral-700 text-premium">{config.expectedOutput.whyItMatters}</p>
                </div>
              )}
              {config.expectedOutput.nextSteps && (
                <div className="bg-white rounded-lg p-4 border border-primary-200 card-premium">
                  <div className="font-medium text-neutral-800 mb-2 flex items-center space-x-1">
                    <ArrowRight className="w-4 h-4 text-primary-600" />
                    <span>Next Steps:</span>
                  </div>
                  <p className="text-sm text-neutral-700 text-premium">{config.expectedOutput.nextSteps}</p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Website Submission Section - Final Phase Only */}
      {isFinalPhase && teamData?.cohortTag && cohortData?.submissionsOpen && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 card-premium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-neutral-800 section-header">
              <Globe className="w-5 h-5 text-green-600" />
              <span>Submit Your Deployed Website</span>
            </CardTitle>
            <p className="text-neutral-600 mt-2 ui-label">
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
            
            {teamData.submittedWebsiteUrl && cohortData && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 text-blue-800 mb-2">
                  <Vote className="w-4 h-4" />
                  <span className="font-medium">Next Steps</span>
                </div>
                <p className="text-blue-700 text-sm mb-3">
                  Your website has been submitted! You can now view the cohort showcase and vote for your favorite submissions.
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/showcase/${teamData.cohortTag}`)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    View Showcase
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
            className={cn("flex items-center space-x-2 border border-neutral-300 text-neutral-600 hover:bg-accent-600 hover:text-white hover:border-accent-600 transition-colors duration-200", 
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Save className="w-4 h-4" />
            <span>Save & Exit</span>
          </Button>
          
          <Button
            onClick={handleProceedToNext}
            disabled={hasErrors || loading || config.phase === 7}
            className={cn("flex items-center space-x-2 btn-premium bg-primary hover:bg-primary/90",
              (hasErrors || loading || config.phase === 7) && "opacity-50 cursor-not-allowed"
            )}
          >
            <span>
              {config.phase === 7 ? 'Complete' : `Continue to Phase ${config.phase + 1}`}
            </span>
            {config.phase < 7 && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
