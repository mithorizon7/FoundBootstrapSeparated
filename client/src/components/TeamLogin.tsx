import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TeamLoginProps {
  onSuccess: () => void;
}

export function TeamLogin({ onSuccess }: TeamLoginProps) {
  const [code, setCode] = useState('');
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (teamCode: string) => {
      const response = await fetch('/api/auth/team/login-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: teamCode })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.team.name}!`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      loginMutation.mutate(code.trim().toUpperCase());
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Team Login</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter your team code to access avatar selection and other team features.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          placeholder="Enter team code (e.g., TTEC)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={loginMutation.isPending}
          className="uppercase"
        />
        <Button 
          type="submit" 
          disabled={!code.trim() || loginMutation.isPending}
          className="w-full"
        >
          {loginMutation.isPending ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  );
}