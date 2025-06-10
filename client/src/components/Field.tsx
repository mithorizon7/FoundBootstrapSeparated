import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lightbulb } from "lucide-react";
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
  tooltip?: string;
}

interface FieldProps {
  config: FieldConfig;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function Field({ config, value, onChange, error }: FieldProps) {
  const { id, label, type, placeholder, options, required, help, tooltip } = config;

  const renderField = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn("transition-all duration-200 ease-out border border-neutral-300 bg-white shadow-sm focus:border-primary-500 focus:shadow-md focus:-translate-y-px", error && 'border-red-300 focus:border-red-400')}
            required={required}
          />
        );

      case "select":
        return (
          <Select value={value} onValueChange={onChange} required={required}>
            <SelectTrigger className={cn("transition-all duration-200 ease-out border border-neutral-300 bg-white shadow-sm focus:border-primary-500 focus:shadow-md focus:-translate-y-px", error && 'border-red-300 focus:border-red-400')}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "color":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:shadow-md transition-all duration-200 hover:scale-105"
                  title="Click to open color picker"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-full h-full bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
              <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 font-mono text-sm transition-all duration-200 ease-out border border-neutral-300 bg-white shadow-sm focus:border-primary-500 focus:shadow-md focus:-translate-y-px"
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-xs text-gray-500 flex items-center space-x-1">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              <span>Click the color box to open the color picker</span>
            </p>
          </div>
        );

      default:
        return (
          <Input
            id={id}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn("transition-all duration-200 ease-out border border-neutral-300 bg-white shadow-sm focus:border-primary-500 focus:shadow-md focus:-translate-y-px", error && 'border-red-300 focus:border-red-400')}
            required={required}
          />
        );
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="bg-neutral-100 rounded-full p-1 cursor-help transition-all duration-200 hover:bg-primary-100 hover:scale-110 group">
                  <Lightbulb className="w-4 h-4 text-neutral-500 transition-colors group-hover:text-primary-600" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-primary-500 mt-1 flex-shrink-0" />
                  <p className="text-sm">{tooltip}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {renderField()}
        {help && <p className="text-xs text-gray-500">{help}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </TooltipProvider>
  );
}
