import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TeamAvatar } from "@/components/TeamAvatar";
import { useToast } from "@/hooks/use-toast";
import { TEAM_AVATAR_ICONS } from "@shared/avatars";
import { apiRequest } from "@/lib/queryClient";

interface AvatarSelectorProps {
  teamId: number;
  currentAvatar?: string;
  teamName: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarSelector({ teamId, currentAvatar, teamName, size = 'md' }: AvatarSelectorProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarIcon: string) => {
      const response = await fetch(`/api/teams/${teamId}/avatar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ avatarIcon })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update avatar');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate team queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      
      toast({
        title: "Avatar updated",
        description: "Your team avatar has been successfully changed.",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: "Failed to update team avatar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarSelect = (avatarIcon: string) => {
    if (avatarIcon !== currentAvatar) {
      updateAvatarMutation.mutate(avatarIcon);
    } else {
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center hover:opacity-80 transition-opacity">
          <TeamAvatar 
            avatarIcon={currentAvatar}
            teamName={teamName}
            size={size}
            className="cursor-pointer"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-4" align="start">
        <div className="text-sm font-medium text-gray-900 mb-3">Choose your team avatar</div>
        <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
          {TEAM_AVATAR_ICONS.map((icon) => (
            <button
              key={icon}
              onClick={() => handleAvatarSelect(icon)}
              disabled={updateAvatarMutation.isPending}
              className={`p-2 rounded-lg border-2 transition-all hover:bg-gray-50 ${
                icon === currentAvatar 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${updateAvatarMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <img 
                  src={`/team_icons/${icon}`} 
                  alt={`Avatar ${icon}`}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            </button>
          ))}
        </div>
        {updateAvatarMutation.isPending && (
          <div className="text-xs text-gray-500 mt-2 text-center">
            Updating avatar...
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}