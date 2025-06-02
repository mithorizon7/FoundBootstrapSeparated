import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, Check } from "lucide-react";
import { compileTemplate } from "@/lib/handlebars";
import { cn } from "@/lib/utils";

interface PromptPreviewProps {
  template: string;
  data: Record<string, any>;
}

export function PromptPreview({ template, data }: PromptPreviewProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const compiledPrompt = compileTemplate(template, data);
  
  // Enhanced formatting for better readability
  const formatPromptForDisplay = (text: string) => {
    return text
      // Bold headers and important terms
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      // Highlight template variables that are still unfilled
      .replace(/\{\{([^}]+)\}\}/g, '<span class="variable-highlight bg-yellow-100 text-yellow-800 font-medium px-1 rounded">{{$1}}</span>')
      // Emphasize section numbers and bullets
      .replace(/^(\d+\.\s)/gm, '<strong class="text-blue-700 font-semibold">$1</strong>')
      .replace(/^\s*\*\s/gm, '<span class="text-blue-600 font-medium">• </span>')
      // Preserve line breaks
      .replace(/\n/g, '<br>');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiledPrompt);
      setCopied(true);
      toast({
        title: "Prompt copied!",
        description: "The prompt has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy prompt to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([compiledPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Prompt downloaded!",
      description: "The prompt has been saved as prompt.txt.",
    });
  };

  return (
    <div className="bg-white rounded-xl card-premium p-6 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-green-200">
            <Copy className="w-4 h-4 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 heading-premium">AI Prompt Preview</h2>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded content-fade">Live Preview</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto border border-gray-200">
        <div 
          className="text-sm text-gray-800 text-premium leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: formatPromptForDisplay(compiledPrompt)
          }}
        />
      </div>

      <div className="flex items-center space-x-3">
        <Button
          onClick={handleCopy}
          className={cn("flex-1 btn-premium bg-primary text-white hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2",
            copied && "bg-green-600 hover:bg-green-700"
          )}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Copied!" : "Copy Prompt"}</span>
        </Button>
        <Button
          onClick={handleDownload}
          variant="outline"
          className="btn-premium px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
