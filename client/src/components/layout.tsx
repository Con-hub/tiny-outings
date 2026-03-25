import { Link, useRoute } from "wouter";
import { Home, Compass, Heart, User, MapPin, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LocationPicker } from "./location-picker";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PerplexityAttribution } from "./PerplexityAttribution";
import { useTheme } from "./theme-provider";
import type { UserProfile } from "@shared/schema";

const TABS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/explore", label: "Explore", icon: Compass },
  { path: "/favourites", label: "Saved", icon: Heart },
  { path: "/profile", label: "Profile", icon: User },
];

function TabItem({ path, label, icon: Icon }: typeof TABS[0]) {
  const [isActive] = useRoute(path);
  return (
    <Link href={path} data-testid={`tab-${label.toLowerCase()}`}>
      <div
        className={cn(
          "flex flex-col items-center gap-0.5 py-1.5 px-3 min-w-[56px] transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-semibold">{label}</span>
      </div>
    </Link>
  );
}

// SVG Logo
function Logo() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="w-7 h-7 text-primary"
      fill="none"
      aria-label="Tiny Outings logo"
    >
      {/* Boot shape */}
      <path
        d="M8 12v10a4 4 0 0 0 4 4h12a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-6v-8"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M8 12v10a4 4 0 0 0 4 4h12a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-6v-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ankle cuff */}
      <path d="M7 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Lace dots */}
      <circle cx="12" cy="16" r="0.8" fill="currentColor" />
      <circle cx="12" cy="19" r="0.8" fill="currentColor" />
      {/* Star */}
      <path
        d="M22 6l1 2.5h2.5l-2 1.5.8 2.5-2.3-1.5-2.3 1.5.8-2.5-2-1.5H21z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: profile } = useQuery<UserProfile>({ queryKey: ["/api/profile"] });
  const [locOpen, setLocOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleLocationSelect = async (city: { name: string; lat: number; lng: number; currency: string }) => {
    await apiRequest("PUT", "/api/profile", {
      locationCity: city.name,
      locationLat: city.lat,
      locationLng: city.lng,
      preferredCurrency: city.currency,
    });
    queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    queryClient.invalidateQueries({ queryKey: ["/api/places"] });
    queryClient.invalidateQueries({ queryKey: ["/api/featured"] });
  };

  return (
    <div className="flex flex-col min-h-screen max-w-3xl mx-auto bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-extrabold text-base tracking-tight">Tiny Outings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              data-testid="theme-toggle"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Moon className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={() => setLocOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-accent text-sm font-semibold hover-elevate"
              data-testid="location-button"
            >
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="max-w-[100px] truncate">{profile?.locationCity || "Belfast"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-around max-w-3xl mx-auto py-1 safe-bottom">
          {TABS.map(tab => <TabItem key={tab.path} {...tab} />)}
        </div>
      </nav>

      {/* Footer attribution (above tabs) */}
      <div className="pb-16">
        <PerplexityAttribution />
      </div>

      <LocationPicker
        open={locOpen}
        onClose={() => setLocOpen(false)}
        onSelect={handleLocationSelect}
      />
    </div>
  );
}
