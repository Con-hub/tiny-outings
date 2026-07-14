import { useState } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout";
import { Onboarding } from "@/components/onboarding";
import HomePage from "@/pages/home";
import ExplorePage from "@/pages/explore";
import FavouritesPage from "@/pages/favourites";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";
import type { UserProfile } from "@shared/schema";

function AppRouter() {
  // Show onboarding if profile has no city set yet (fresh install) or flag not set
  const { data: profile, isLoading } = useQuery<UserProfile>({ queryKey: ["/api/profile"] });
  const [onboardingDone, setOnboardingDone] = useState<boolean>(
    () => !!(window as any).__tinyOnboardingDone
  );

  // Show onboarding only when profile has no DOB set (user hasn't personalised yet)
  // Once they set a DOB via onboarding or profile page, this won't show again
  const shouldShowOnboarding = !isLoading && profile && !onboardingDone && !profile.childDob;

  return (
    <Layout>
      {shouldShowOnboarding && profile && (
        <Onboarding profile={profile} onComplete={() => setOnboardingDone(true)} />
      )}
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/explore" component={ExplorePage} />
        <Route path="/favourites" component={FavouritesPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
