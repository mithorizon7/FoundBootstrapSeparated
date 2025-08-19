/**
 * Comprehensive URL utilities for consistent parameter handling across the application
 */

// Get URL search parameters from current location
export function getUrlParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

// Get a specific URL parameter by name
export function getUrlParam(name: string): string | null {
  return getUrlParams().get(name);
}

// Get multiple URL parameters by name
export function getMultipleUrlParams(...names: string[]): Record<string, string | null> {
  const params = getUrlParams();
  const result: Record<string, string | null> = {};
  
  for (const name of names) {
    result[name] = params.get(name);
  }
  
  return result;
}

// Remove specific parameters from current URL and update browser history
export function removeUrlParams(...paramNames: string[]): void {
  const url = new URL(window.location.href);
  
  for (const paramName of paramNames) {
    url.searchParams.delete(paramName);
  }
  
  window.history.replaceState({}, '', url.toString());
}

// Add or update URL parameters and navigate to new URL
export function navigateWithParams(basePath: string, params: Record<string, string | number>): void {
  const url = new URL(basePath, window.location.origin);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  
  window.location.href = url.toString();
}

// Construct URL with parameters (useful for sharing links)
export function buildUrlWithParams(basePath: string, params: Record<string, string | number>): string {
  const url = new URL(basePath, window.location.origin);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  
  return url.toString();
}

// Get current origin for URL construction
export function getOrigin(): string {
  return window.location.origin;
}

// Check if specific URL parameters exist
export function hasUrlParams(...paramNames: string[]): boolean {
  const params = getUrlParams();
  return paramNames.every(name => params.has(name));
}

// Get all URL parameters as an object
export function getAllUrlParams(): Record<string, string> {
  const params = getUrlParams();
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}