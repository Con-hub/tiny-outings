import { Card } from "@/components/ui/card";
import { AgeBandBadge } from "./age-band-badge";
import { FeatureBadge } from "./feature-badge";
import { MapPin, Clock, Navigation, Calendar } from "lucide-react";
import {
  formatDistance, formatCost, getCategoryLabel,
  formatFriendlyDate, isHappeningNow, isStartingSoon,
  getNextRecurringDates,
} from "@/lib/constants";
import type { Event } from "@shared/schema";

interface EventCardProps {
  event: Event & { distance?: number };
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const ageBands: string[] = JSON.parse(event.ageBands);
  const features: string[] = JSON.parse(event.childFeatures);
  const happeningNow = isHappeningNow(event.date, event.startTime, event.endTime);
  const startingSoon = !happeningNow && isStartingSoon(event.date, event.startTime);
  const nextDates = event.recurring && event.recurrencePattern
    ? getNextRecurringDates(event.recurrencePattern, 3)
    : [];

  return (
    <Card
      className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-shadow"
      onClick={onClick}
      data-testid={`event-card-${event.id}`}
    >
      <div className="flex flex-col gap-2.5">
        {/* Badges row: age bands + status + category */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ageBands.map(band => (
            <AgeBandBadge key={band} band={band} compact />
          ))}
          {happeningNow && (
            <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-bold uppercase tracking-wide" data-testid="badge-happening-now">
              On now
            </span>
          )}
          {startingSoon && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wide" data-testid="badge-starting-soon">
              Starting soon
            </span>
          )}
          {event.isFeatured && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold" data-testid="badge-promoted">
              Promoted
            </span>
          )}
          <span className="text-xs text-muted-foreground font-medium ml-auto">
            {getCategoryLabel(event.category)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base leading-tight" data-testid={`event-title-${event.id}`}>
          {event.title}
        </h3>

        {/* Description snippet */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {event.description}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {formatFriendlyDate(event.date)}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {event.startTime}{event.endTime ? `\u2013${event.endTime}` : ""}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {event.venueName}
          </span>
          {event.distance !== undefined && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Navigation className="w-3.5 h-3.5" />
              {formatDistance(event.distance)}
            </span>
          )}
        </div>

        {/* Cost + Features */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-bold ${event.isFree ? "text-primary" : ""}`}>
            {formatCost(event.cost, event.currency, event.isFree)}
          </span>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {features.slice(0, 3).map(f => (
              <FeatureBadge key={f} feature={f} />
            ))}
          </div>
        </div>

        {/* Recurring tag + next dates */}
        {event.recurring && event.recurrencePattern && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-primary font-medium">
              {event.recurrencePattern}
            </span>
            {nextDates.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                Next: {nextDates.join(" · ")}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
