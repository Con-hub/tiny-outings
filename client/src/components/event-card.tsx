import { Card } from "@/components/ui/card";
import { AgeBandBadge } from "./age-band-badge";
import { MapPin, Clock, Calendar } from "lucide-react";
import {
  formatCost, formatFriendlyDate, pickCardBadge,
} from "@/lib/constants";
import type { Event } from "@shared/schema";

interface EventCardProps {
  event: Event & { distance?: number };
  onClick: () => void;
  compact?: boolean;
}

export function EventCard({ event, onClick, compact }: EventCardProps) {
  const ageBands: string[] = JSON.parse(event.ageBands);
  const badge = pickCardBadge(event);

  return (
    <Card
      className="p-3.5 cursor-pointer hover-elevate active-elevate-2 transition-shadow"
      onClick={onClick}
      data-testid={`event-card-${event.id}`}
    >
      <div className="flex flex-col gap-2">
        {/* Top row: single badge + age dots + price */}
        <div className="flex items-center gap-1.5">
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
              data-testid={`badge-${badge.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              {badge.label}
            </span>
          )}
          {event.isFeatured && !badge?.label.includes("Free") && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold" data-testid="badge-promoted">
              Promoted
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {ageBands.map(band => (
              <AgeBandBadge key={band} band={band} compact />
            ))}
          </div>
        </div>

        {/* Title — single line, truncate */}
        <h3 className="font-bold text-[15px] leading-snug truncate" data-testid={`event-title-${event.id}`}>
          {event.title}
        </h3>

        {/* One-line description if not compact */}
        {!compact && (
          <p className="text-sm text-muted-foreground line-clamp-1 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Meta: date · time · venue · price — single row */}
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            {formatFriendlyDate(event.date)}
          </span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            {event.startTime}{event.endTime ? `\u2013${event.endTime}` : ""}
          </span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            {event.city}
          </span>
        </div>

        {/* Price anchored bottom-right */}
        <div className="flex items-center justify-between">
          {event.recurring && event.recurrencePattern && (
            <span className="text-[11px] text-primary font-medium truncate max-w-[60%]">
              {event.recurrencePattern}
            </span>
          )}
          <span className={`text-sm font-bold ml-auto ${event.isFree ? "text-primary" : ""}`}>
            {formatCost(event.cost, event.currency, event.isFree)}
          </span>
        </div>
      </div>
    </Card>
  );
}
