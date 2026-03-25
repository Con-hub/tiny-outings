import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/location-picker";
import { AgeBandBadge } from "@/components/age-band-badge";
import { MapPin, Baby, Ruler, Coins } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DISTANCE_OPTIONS } from "@/lib/constants";
import type { UserProfile } from "@shared/schema";

export default function ProfilePage() {
  const { data: profile } = useQuery<UserProfile>({ queryKey: ["/api/profile"] });
  const [locOpen, setLocOpen] = useState(false);

  if (!profile) return null;

  const updateProfile = async (data: Partial<UserProfile>) => {
    await apiRequest("PUT", "/api/profile", data);
    queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    queryClient.invalidateQueries({ queryKey: ["/api/places"] });
    queryClient.invalidateQueries({ queryKey: ["/api/featured"] });
  };

  const handleLocationSelect = async (city: { name: string; lat: number; lng: number; currency: string }) => {
    await updateProfile({
      locationCity: city.name,
      locationLat: city.lat,
      locationLng: city.lng,
      preferredCurrency: city.currency,
    });
  };

  // Calculate age band from DOB
  const getChildAgeBand = () => {
    if (!profile.childDob) return null;
    const dob = new Date(profile.childDob);
    const now = new Date();
    const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (months < 12) return "baby";
    if (months < 36) return "toddler";
    if (months < 60) return "preschooler";
    return null;
  };

  const childAgeBand = getChildAgeBand();

  const getChildAge = () => {
    if (!profile.childDob) return null;
    const dob = new Date(profile.childDob);
    const now = new Date();
    const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""} old`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return `${years} year${years !== 1 ? "s" : ""}${rem > 0 ? `, ${rem} month${rem !== 1 ? "s" : ""}` : ""} old`;
  };

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <h1 className="font-extrabold text-lg">Your Profile</h1>

      {/* Location */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Location</h3>
            <p className="text-xs text-muted-foreground">Events and places near you</p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="w-full justify-start"
          onClick={() => setLocOpen(true)}
          data-testid="profile-location"
        >
          <MapPin className="w-4 h-4 mr-2 text-primary" />
          {profile.locationCity}
        </Button>
      </Card>

      {/* Child info */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[hsl(var(--baby))]/50 flex items-center justify-center">
            <Baby className="w-4.5 h-4.5 text-[hsl(var(--baby-foreground))]" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Your little one</h3>
            <p className="text-xs text-muted-foreground">Helps show the right age band</p>
          </div>
        </div>
        {/* Child name */}
        <input
          type="text"
          placeholder="Child's name (optional)"
          value={(profile as any).childName || ""}
          onChange={(e) => updateProfile({ childName: e.target.value || null } as any)}
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-2"
          data-testid="profile-child-name"
        />
        {/* Child DOB */}
        <input
          type="date"
          value={profile.childDob || ""}
          onChange={(e) => updateProfile({ childDob: e.target.value || null } as any)}
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          data-testid="profile-dob"
          max={new Date().toISOString().split("T")[0]}
        />
        {profile.childDob && childAgeBand && (
          <div className="flex items-center gap-2 mt-3">
            <AgeBandBadge band={childAgeBand} />
            <span className="text-sm text-muted-foreground">
              {(profile as any).childName ? `${(profile as any).childName} is ` : ""}{getChildAge()}
            </span>
          </div>
        )}
        {profile.childDob && childAgeBand && (
          <p className="text-[11px] text-muted-foreground mt-2">
            Events will be automatically filtered for the {childAgeBand} age band when you set your date of birth.
          </p>
        )}
      </Card>

      {/* Distance radius */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Ruler className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Search radius</h3>
            <p className="text-xs text-muted-foreground">How far to look for events</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {DISTANCE_OPTIONS.map(d => (
            <Button
              key={d}
              variant={profile.distanceRadius === d ? "default" : "secondary"}
              size="sm"
              onClick={() => updateProfile({ distanceRadius: d })}
              data-testid={`radius-${d}`}
            >
              {d} mi
            </Button>
          ))}
        </div>
      </Card>

      {/* Currency */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Coins className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Currency</h3>
            <p className="text-xs text-muted-foreground">Auto-set from location</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={profile.preferredCurrency === "GBP" ? "default" : "secondary"}
            size="sm"
            onClick={() => updateProfile({ preferredCurrency: "GBP" })}
            data-testid="currency-gbp"
          >
            {"\u00a3"} GBP
          </Button>
          <Button
            variant={profile.preferredCurrency === "EUR" ? "default" : "secondary"}
            size="sm"
            onClick={() => updateProfile({ preferredCurrency: "EUR" })}
            data-testid="currency-eur"
          >
            {"\u20ac"} EUR
          </Button>
        </div>
      </Card>

      <LocationPicker
        open={locOpen}
        onClose={() => setLocOpen(false)}
        onSelect={handleLocationSelect}
      />
    </div>
  );
}
