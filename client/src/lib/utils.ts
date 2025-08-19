import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTeamCode(): string {
  // Generate cryptographically secure 4-character code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

export function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now.getTime() - past.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Less than an hour ago';
  } else if (diffInHours === 1) {
    return '1 hour ago';
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  }
}
