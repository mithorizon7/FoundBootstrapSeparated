import { BarChart3, Target, BookOpen, Lightbulb, FileText, Palette, Phone, Globe } from "lucide-react";

// Centralized phase icon mapping
export const PHASE_ICONS = {
  1: BarChart3,    // Market & Competitor Research - data analysis
  2: Target,       // Competitor Matrix Construction - competitive positioning  
  3: BookOpen,     // Background Research - research validation
  4: Lightbulb,    // Hero Offer Ideation - concept generation
  5: FileText,     // Hero Concept Brief - strategic brief
  6: Palette,      // Media Factory - creative assets
  7: Phone,        // AI Voice Agent - voice interaction
  8: Globe,        // AI Website Builder - digital presence
} as const;

export type PhaseNumber = keyof typeof PHASE_ICONS;

export function getPhaseIcon(phaseNumber: number): typeof BarChart3 | undefined {
  return PHASE_ICONS[phaseNumber as PhaseNumber];
}