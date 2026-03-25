import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { DISTANCE_OPTIONS } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserProfile } from "@shared/schema";

interface RadiusPickerProps {
  profile: UserProfile | undefined;
}

export function RadiusPicker({ profile }: RadiusPickerProps) {
  const currentRadius = profile?.distanceRadius || 5;

  const handleChange = async (radius: number) => {
    if (radius === currentRadius) return;
    await apiRequest("PUT", "/api/profile", { distanceRadius: radius });
    queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    queryClient.invalidateQueries({ queryKey: ["/api/places"] });
    queryClient.invalidateQueries({ queryKey: ["/api/featured"] });
  };

  return (
    <div className="flex items-center gap-2" data-testid="radius-picker">
      <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground shrink-0">
        <MapPin className="w-3.5 h-3.5" />
        <span>Within</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {DISTANCE_OPTIONS.map(d => (
          <button
            key={d}
            onClick={() => handleChange(d)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors",
              d === currentRadius
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            )}
            data-testid={`radius-option-${d}`}
          >
            {d} mi
          </button>
        ))}
      </div>
    </div>
  );
}
