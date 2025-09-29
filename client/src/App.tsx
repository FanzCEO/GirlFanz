import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import CreatorProfile from "@/pages/CreatorProfile";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import Moderation from "@/pages/Moderation";
import SystemHealth from "@/pages/SystemHealth";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Switch>
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/profile" component={CreatorProfile} />
            <Route path="/content" component={Dashboard} />
            <Route path="/messages" component={Messages} />
            <Route path="/analytics" component={Dashboard} />
            <Route path="/earnings" component={Dashboard} />
            <Route path="/settings" component={Settings} />
            <Route path="/moderation" component={Moderation} />
            <Route path="/health" component={SystemHealth} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gf-ink">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
