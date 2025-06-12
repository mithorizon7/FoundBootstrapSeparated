import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";
import Home from "@/pages/Home";
import Phase from "@/pages/Phase";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import Showcase from "@/pages/Showcase";
import Results from "@/pages/Results";
import Credits from "@/pages/Credits";
import NotFound from "@/pages/not-found";

function Router() {
  useEffect(() => {
    // Check for access token in URL parameters and establish secure session
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Attempt to login with the token
      fetch('/api/auth/team/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ access_token: token }),
      })
      .then(response => {
        if (response.ok) {
          // Remove token from URL for security
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('token');
          window.history.replaceState({}, '', newUrl.toString());
        }
      })
      .catch(error => {
        console.error('Team login failed:', error);
      });
    }
  }, []);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/phase/:id" component={Phase} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/showcase/:cohortTag" component={Showcase} />
      <Route path="/results/:cohortTag" component={Results} />
      <Route path="/credits" component={Credits} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
