import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Field } from "./Field";
import { PromptPreview } from "./PromptPreview";
import { ChevronLeft, ChevronRight, Info, Vote, Save, Copy, CheckCircle, Clock, FileText, Target, ArrowRight } from "lucide-react";
import { savePhaseData, getPhaseData, saveToLocalStorage, getFromLocalStorage, getAllLocalStorageData, getAllPhaseDataForTeam, updateTeamPhase } from "@/lib/db";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

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
  stepByStepFlow?: Array<{
    step: number;
    action: string;
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
    ...allPhaseData,
  };

  const progressPercentage = (config.phase / 7) * 100;
  const hasErrors = Object.keys(errors).length > 0;

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
                Phase {config.phase} of 7
                {config.estimatedTime && ` • ${config.estimatedTime}`}
              </p>
            </div>
          </div>
          
          <Progress value={progressPercentage} className="mb-4" />
          
          <div className="mt-4">
            <p className="text-lg text-gray-700 leading-relaxed ui-label max-w-4xl">
              {config.intro}
            </p>
          </div>
        </CardHeader>
      </Card>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {config.stepByStepFlow.map((step) => (
                <div key={step.step} className="bg-white rounded-lg p-5 card-premium group cursor-pointer">
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
                  </div>
                </div>
              ))}
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
          className={cn("flex items-center space-x-2 btn-premium", 
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
            className={cn("flex items-center space-x-2 border border-neutral-300 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 transition-colors duration-200", 
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
