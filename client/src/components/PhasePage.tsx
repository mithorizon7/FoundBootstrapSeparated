import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Field } from "./Field";
import { PromptPreview } from "./PromptPreview";
import { ChevronLeft, ChevronRight, Info, Vote, Save } from "lucide-react";
import { savePhaseData, getPhaseData, saveToLocalStorage, getFromLocalStorage, getAllLocalStorageData, getAllPhaseDataForTeam, updateTeamPhase } from "@/lib/db";
import { useLocation } from "wouter";

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
              <CardTitle className="text-2xl">{config.title}</CardTitle>
              <p className="text-sm text-gray-600">
                Phase {config.phase} of 7
                {config.estimatedTime && ` • ${config.estimatedTime}`}
              </p>
            </div>
          </div>
          
          <Progress value={progressPercentage} className="mb-4" />
          
          <div className="prose prose-sm text-gray-700">
            <p>{config.intro}</p>
          </div>
        </CardHeader>
      </Card>

      {/* Step-by-Step Flow - Full Width */}
      {config.stepByStepFlow && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Info className="w-5 h-5 text-blue-600" />
              <span>Step-by-Step Workflow</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {config.stepByStepFlow.map((step) => (
                <div key={step.step} className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                        {step.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 leading-relaxed text-sm">{step.action}</p>
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
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Vote className="w-4 h-4 text-yellow-600" />
                </div>
                <CardTitle className="text-lg">Decision Box</CardTitle>
                <div className="flex-1"></div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Auto-saving</span>
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
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
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
        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <AlertDescription className="text-green-800">
            <div className="font-semibold mb-4 text-lg text-green-900">Expected Output & What Happens Next</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {config.expectedOutput.fileCreated && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="font-medium text-green-900 mb-2">File Created:</div>
                  <span className="font-mono bg-green-100 px-3 py-2 rounded text-sm block text-center">
                    {config.expectedOutput.fileCreated}
                  </span>
                </div>
              )}
              {config.expectedOutput.whyItMatters && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="font-medium text-green-900 mb-2">Why it matters:</div>
                  <p className="text-sm text-green-800">{config.expectedOutput.whyItMatters}</p>
                </div>
              )}
              {config.expectedOutput.nextSteps && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="font-medium text-green-900 mb-2">Next Steps:</div>
                  <p className="text-sm text-green-800">{config.expectedOutput.nextSteps}</p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Legacy Instructions (fallback) */}
      {config.instructions && !config.stepByStepFlow && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
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
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Phase</span>
        </Button>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleSaveAndExit}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save & Exit</span>
          </Button>
          
          <Button
            onClick={handleProceedToNext}
            disabled={hasErrors || loading || config.phase === 7}
            className="flex items-center space-x-2"
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
