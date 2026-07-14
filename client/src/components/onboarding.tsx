import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { MapPin, Baby } from "lucide-react";
import type { UserProfile } from "@shared/schema";

const CITIES = [
  { name: "Belfast", lat: 54.5973, lng: -5.9301, currency: "GBP" },
  { name: "Dublin", lat: 53.3498, lng: -6.2603, currency: "EUR" },
  { name: "Derry", lat: 54.9966, lng: -7.3086, currency: "GBP" },
  { name: "Cork", lat: 51.8985, lng: -8.4756, currency: "EUR" },
  { name: "Galway", lat: 53.2707, lng: -9.0568, currency: "EUR" },
  { name: "Edinburgh", lat: 55.9533, lng: -3.1883, currency: "GBP" },
  { name: "Glasgow", lat: 55.8642, lng: -4.2518, currency: "GBP" },
  { name: "London", lat: 51.5074, lng: -0.1278, currency: "GBP" },
];

const AGE_BANDS = [
  { id: "baby", label: "Baby", range: "0–12 months", emoji: "👶" },
  { id: "toddler", label: "Toddler", range: "1–3 years", emoji: "🧒" },
  { id: "preschooler", label: "Pre-schooler", range: "3–5 years", emoji: "🎒" },
];

interface OnboardingProps {
  profile: UserProfile;
  onComplete: () => void;
}

export function Onboarding({ profile, onComplete }: OnboardingProps) {
  const [step, setStep] = useState<"age" | "location">("age");
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<typeof CITIES[0] | null>(null);
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    setSaving(true);
    const updates: Partial<UserProfile> = {};
    if (selectedCity) {
      updates.locationCity = selectedCity.name;
      updates.locationLat = selectedCity.lat;
      updates.locationLng = selectedCity.lng;
      updates.preferredCurrency = selectedCity.currency as "GBP" | "EUR";
    }
    await apiRequest("PUT", "/api/profile", updates);
    queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    queryClient.invalidateQueries({ queryKey: ["/api/featured"] });
    setSaving(false);
    // Mark onboarding done in localStorage — exception: we store only a simple flag here, not app data
    try { (window as any).__tinyOnboardingDone = true; } catch {}
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center px-6 py-8">
      {/* Logo and welcome */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-1">
          <span className="text-3xl">👟</span>
        </div>
        <h1 className="font-extrabold text-xl text-center">Welcome to Tiny Outings</h1>
        <p className="text-sm text-muted-foreground text-center max-w-[280px]">
          Calm days out for you and your little one. Let's set things up in two quick steps.
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2 mb-7">
        <div className={`h-1.5 w-8 rounded-full transition-colors ${step === "age" ? "bg-primary" : "bg-primary/30"}`} />
        <div className={`h-1.5 w-8 rounded-full transition-colors ${step === "location" ? "bg-primary" : "bg-border"}`} />
      </div>

      {step === "age" && (
        <div className="flex flex-col items-center gap-5 w-full max-w-xs">
          <div className="flex flex-col items-center gap-1 text-center">
            <Baby className="w-5 h-5 text-primary mb-1" />
            <h2 className="font-bold text-base">How old is your little one?</h2>
            <p className="text-xs text-muted-foreground">We'll show the most relevant events</p>
          </div>
          <div className="flex flex-col gap-2.5 w-full">
            {AGE_BANDS.map(band => (
              <button
                key={band.id}
                onClick={() => setSelectedAge(band.id)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all text-left w-full ${
                  selectedAge === band.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                }`}
                data-testid={`onboarding-age-${band.id}`}
              >
                <span className="text-2xl">{band.emoji}</span>
                <div>
                  <p className="font-bold text-sm">{band.label}</p>
                  <p className="text-xs text-muted-foreground">{band.range}</p>
                </div>
                {selectedAge === band.id && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          <Button
            className="w-full mt-1"
            disabled={!selectedAge}
            onClick={() => setStep("location")}
            data-testid="onboarding-next"
          >
            Next
          </Button>
          <button
            onClick={() => setStep("location")}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Skip for now
          </button>
        </div>
      )}

      {step === "location" && (
        <div className="flex flex-col items-center gap-5 w-full max-w-xs">
          <div className="flex flex-col items-center gap-1 text-center">
            <MapPin className="w-5 h-5 text-primary mb-1" />
            <h2 className="font-bold text-base">Where are you based?</h2>
            <p className="text-xs text-muted-foreground">Shows events and places near you</p>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full">
            {CITIES.map(city => (
              <button
                key={city.name}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                  selectedCity?.name === city.name
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
                data-testid={`onboarding-city-${city.name.toLowerCase()}`}
              >
                {city.name}
              </button>
            ))}
          </div>
          <Button
            className="w-full mt-1"
            disabled={saving}
            onClick={handleComplete}
            data-testid="onboarding-done"
          >
            {saving ? "Setting up…" : "Let's go →"}
          </Button>
          <button
            onClick={handleComplete}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Skip and use Belfast
          </button>
        </div>
      )}
    </div>
  );
}
