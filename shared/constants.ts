// Central configuration for phase-related constants
export const PHASE_CONFIG = {
  TOTAL_PHASES: 8,
  MIN_PHASE: 1,
  MAX_PHASE: 8,
} as const;

// Helper function to get available phase numbers
export function getPhaseNumbers(): number[] {
  return Array.from({ length: PHASE_CONFIG.TOTAL_PHASES }, (_, i) => i + 1);
}

// Helper function to validate phase number
export function isValidPhaseNumber(phase: number): boolean {
  return phase >= PHASE_CONFIG.MIN_PHASE && phase <= PHASE_CONFIG.MAX_PHASE;
}