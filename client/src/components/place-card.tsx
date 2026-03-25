import { Card } from "@/components/ui/card";
import { AgeBandBadge } from "./age-band-badge";
import { FeatureBadge } from "./feature-badge";
import { MapPin, Navigation, Clock } from "lucide-react";
import { formatDistance, getCategoryLabel } from "@/lib/constants";
import type { Place } from "@shared/schema";

interface PlaceCardProps {
  place: Place & { distance?: number };
  onClick: () => void;
}

export function PlaceCard({ place, onClick }: PlaceCardProps) {
  const ageBands: string[] = JSON.parse(place.ageBands);
  const features: string[] = JSON.parse(place.childFeatures);

  return (
    <Card
      className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-shadow"
      onClick={onClick}
      data-testid={`place-card-${place.id}`}
    >
      <div className="flex flex-col gap-2.5">
        {/* Age bands + Category */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ageBands.map(band => (
            <AgeBandBadge key={band} band={band} compact />
          ))}
          {place.isFeatured && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold" data-testid="badge-promoted">
              Promoted
            </span>
          )}
          <span className="text-xs text-muted-foreground font-medium ml-auto">
            {getCategoryLabel(place.category)}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-bold text-base leading-tight" data-testid={`place-name-${place.id}`}>
          {place.name}
        </h3>

        {/* Description snippet */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {place.description}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {place.city}
          </span>
          {place.distance !== undefined && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Navigation className="w-3.5 h-3.5" />
              {formatDistance(place.distance)}
            </span>
          )}
          {place.openingHours && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="truncate max-w-[160px]">{place.openingHours}</span>
            </span>
          )}
        </div>

        {/* Features */}
        <div className="flex items-center gap-2 flex-wrap">
          {features.slice(0, 4).map(f => (
            <FeatureBadge key={f} feature={f} />
          ))}
        </div>
      </div>
    </Card>
  );
}
