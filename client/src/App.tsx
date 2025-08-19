import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "@/components/Footer";
import { useEffect } from "react";
import { getUrlParam, removeUrlParams } from "@/lib/urlUtils";
import Home from "@/pages/Home";
import Phase from "@/pages/Phase";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import Showcase from "@/pages/Showcase";
import Results from "@/pages/Results";
import Credits from "@/pages/Credits";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Check for access token in URL parameters and establish secure session
    const token = getUrlParam('token');
    
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
          removeUrlParams('token');
        }
      })
      .catch(error => {
        // Silently handle team login failure - user will see normal login flow
      });
    }
  }, []);

  // Don't show footer on Home page since it has its own with links
  const showFooter = location !== '/';

  return (
    <div className="min-h-screen flex flex-col">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/phase/:id" component={Phase} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/showcase/:cohortTag" component={Showcase} />
        <Route path="/results/:cohortTag" component={Results} />
        <Route path="/credits" component={Credits} />
        <Route path="/privacy" component={Privacy} />
        <Route component={NotFound} />
      </Switch>
      {showFooter && <Footer />}
    </div>
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
