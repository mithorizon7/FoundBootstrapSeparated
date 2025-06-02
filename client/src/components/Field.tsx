import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

interface FieldProps {
  config: FieldConfig;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function Field({ config, value, onChange, error }: FieldProps) {
  const { id, label, type, placeholder, options, required, help } = config;

  const renderField = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`transition-all duration-200 ${error ? 'border-red-300' : ''}`}
            required={required}
          />
        );

      case "select":
        return (
          <Select value={value} onValueChange={onChange} required={required}>
            <SelectTrigger className={`transition-all duration-200 ${error ? 'border-red-300' : ''}`}>
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
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 font-mono text-sm"
              placeholder="#000000"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
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
            className={`transition-all duration-200 ${error ? 'border-red-300' : ''}`}
            required={required}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {help && <p className="text-xs text-gray-500">{help}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
