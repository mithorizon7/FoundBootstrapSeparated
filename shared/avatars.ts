// Available team avatar icons
export const TEAM_AVATAR_ICONS = [
  'alien-1-svgrepo-com.svg',
  'alien-2-svgrepo-com.svg',
  'alien-3-svgrepo-com.svg',
  'alien-4-svgrepo-com.svg',
  'alien-ship-2-svgrepo-com.svg',
  'alien-ship-beam-svgrepo-com.svg',
  'alien-ship-svgrepo-com.svg',
  'astronaut-helmet-svgrepo-com.svg',
  'atom-svgrepo-com.svg',
  'atronaut-svgrepo-com.svg',
  'black-hole-svgrepo-com.svg',
  'brain-slug-svgrepo-com.svg',
  'cylon-raider-svgrepo-com.svg',
  'falling-space-capsule-svgrepo-com.svg',
  'falling-star-svgrepo-com.svg',
  'flag-svgrepo-com.svg',
  'galaxy-svgrepo-com.svg',
  'international-space-station-svgrepo-com.svg',
  'landing-space-capsule-svgrepo-com.svg',
  'laser-gun-svgrepo-com.svg',
  'ring-ship-svgrepo-com.svg',
  'rocket-svgrepo-com.svg',
  'satellite-svgrepo-com.svg',
  'space-capsule-svgrepo-com.svg',
  'space-invader-svgrepo-com.svg',
  'space-rocket-svgrepo-com.svg',
  'space-rover-1-svgrepo-com.svg',
  'space-rover-2-svgrepo-com.svg',
  'space-ship-1-svgrepo-com.svg',
  'space-ship-2-svgrepo-com.svg',
  'space-ship-3-svgrepo-com.svg',
  'space-ship-svgrepo-com.svg',
  'space-shuttle-launch-svgrepo-com.svg',
  'space-shuttle-svgrepo-com.svg',
  'sputnick-1-svgrepo-com.svg',
  'sputnick-2-svgrepo-com.svg',
];

/**
 * Selects a random avatar icon that hasn't been used by the last 15 teams
 * @param recentAvatars Array of avatar icons used by recent teams
 * @returns Selected avatar icon filename
 */
export function selectRandomAvatar(recentAvatars: string[] = []): string {
  // Filter out recently used avatars to avoid duplicates
  const availableAvatars = TEAM_AVATAR_ICONS.filter(icon => !recentAvatars.includes(icon));
  
  // If all avatars have been used recently, use the full set
  const iconsToChooseFrom = availableAvatars.length > 0 ? availableAvatars : TEAM_AVATAR_ICONS;
  
  // Select random avatar
  const randomIndex = Math.floor(Math.random() * iconsToChooseFrom.length);
  return iconsToChooseFrom[randomIndex];
}