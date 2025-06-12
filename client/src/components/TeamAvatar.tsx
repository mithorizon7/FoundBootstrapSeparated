import { useMemo } from 'react';

interface TeamAvatarProps {
  avatarIcon?: string;
  teamName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TeamAvatar({ avatarIcon, teamName, size = 'md', className = '' }: TeamAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const iconPath = useMemo(() => {
    if (!avatarIcon) return null;
    try {
      // Import the SVG file dynamically
      return `/team_icons/${avatarIcon}`;
    } catch {
      return null;
    }
  }, [avatarIcon]);

  if (!iconPath) {
    // Fallback to initials if no avatar icon
    const initials = teamName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);

    return (
      <div className={`${sizeClasses[size]} bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}>
        <span className="text-white font-bold text-xs">{initials}</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}>
      <img 
        src={iconPath} 
        alt={`${teamName} avatar`}
        className="w-full h-full object-contain p-1"
      />
    </div>
  );
}