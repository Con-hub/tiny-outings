import { Card } from "@/components/ui/card";
import { AgeBandBadge } from "./age-band-badge";
import { MapPin, Navigation, Clock } from "lucide-react";
import { formatDistance, getCategoryLabel } from "@/lib/constants";
import type { Place } from "@shared/schema";

interface PlaceCardProps {
  place: Place & { distance?: number };
  onClick: () => void;
}

export function PlaceCard({ place, onClick }: PlaceCardProps) {
  const ageBands: string[] = JSON.parse(place.ageBands);

  return (
    <Card
      className="p-3.5 cursor-pointer hover-elevate active-elevate-2 transition-shadow"
      onClick={onClick}
      data-testid={`place-card-${place.id}`}
    >
      <div className="flex flex-col gap-2">
        {/* Top row: promoted badge + age dots */}
        <div className="flex items-center gap-1.5">
          {place.isFeatured && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold" data-testid="badge-promoted">
              Promoted
            </span>
          )}
          <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[120px]">
            {getCategoryLabel(place.category)}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            {ageBands.map(band => (
              <AgeBandBadge key={band} band={band} compact />
            ))}
          </div>
        </div>

        {/* Name */}
        <h3 className="font-bold text-[15px] leading-snug truncate" data-testid={`place-name-${place.id}`}>
          {place.name}
        </h3>

        {/* One-line description */}
        <p className="text-sm text-muted-foreground line-clamp-1 leading-relaxed">
          {place.description}
        </p>

        {/* Meta: location · distance · hours */}
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            {place.city}
          </span>
          {place.distance !== undefined && (
            <>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
                {formatDistance(place.distance)}
              </span>
            </>
          )}
          {place.openingHours && (
            <>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1 truncate max-w-[160px]">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                {place.openingHours}
              </span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
