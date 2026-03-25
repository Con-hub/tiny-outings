import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AgeBandBadge } from "./age-band-badge";
import { FeatureBadge } from "./feature-badge";
import { Heart, MapPin, Clock, Navigation, ExternalLink, Calendar, RotateCw, Share2 } from "lucide-react";
import { formatDistance, formatCost, getCategoryLabel, formatFriendlyDate, getNextRecurringDates } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Event, Place } from "@shared/schema";

interface DetailSheetProps {
  open: boolean;
  onClose: () => void;
  event?: (Event & { distance?: number }) | null;
  place?: (Place & { distance?: number }) | null;
}

export function DetailSheet({ open, onClose, event, place }: DetailSheetProps) {
  const { data: favourites } = useQuery<any[]>({ queryKey: ["/api/favourites"] });
  const { toast } = useToast();
  const item = event || place;
  if (!item) return null;

  const isEvent = !!event;
  const ageBands: string[] = JSON.parse(isEvent ? event!.ageBands : place!.ageBands);
  const features: string[] = JSON.parse(isEvent ? event!.childFeatures : place!.childFeatures);
  const isFav = favourites?.some(f =>
    isEvent ? f.eventId === event!.id : f.placeId === place!.id
  );
  const favId = favourites?.find(f =>
    isEvent ? f.eventId === event!.id : f.placeId === place!.id
  )?.id;

  const nextDates = isEvent && event!.recurring && event!.recurrencePattern
    ? getNextRecurringDates(event!.recurrencePattern, 3)
    : [];

  const toggleFavourite = async () => {
    if (isFav && favId) {
      await apiRequest("DELETE", `/api/favourites/${favId}`);
    } else {
      await apiRequest("POST", "/api/favourites", isEvent ? { eventId: event!.id } : { placeId: place!.id });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/favourites"] });
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    isEvent ? `${event!.venueName} ${event!.address}` : `${place!.name} ${place!.address}`
  )}`;

  const handleShare = async () => {
    const title = isEvent ? event!.title : place!.name;
    const text = isEvent
      ? `${event!.title} — ${formatFriendlyDate(event!.date)} at ${event!.startTime}, ${event!.venueName}`
      : `${place!.name} — ${place!.address}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text });
      } catch {
        // User cancelled — do nothing
      }
    } else {
      // Fallback: copy text to clipboard
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard", description: text });
      } catch {
        toast({ title: "Share", description: text });
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-8">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-lg font-extrabold leading-tight pr-8">
            {isEvent ? event!.title : place!.name}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Age bands */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {ageBands.map(band => (
              <AgeBandBadge key={band} band={band} />
            ))}
            <span className="text-sm text-muted-foreground font-medium ml-2">
              {getCategoryLabel(isEvent ? event!.category : place!.category)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed">{isEvent ? event!.description : place!.description}</p>

          {/* Event-specific details */}
          {isEvent && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>{formatFriendlyDate(event!.date)} at {event!.startTime}{event!.endTime ? `\u2013${event!.endTime}` : ""}</span>
              </div>
              {event!.recurring && event!.recurrencePattern && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <RotateCw className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{event!.recurrencePattern}</span>
                  </div>
                  {nextDates.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-6">
                      Next: {nextDates.join(" · ")}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className={`font-bold text-base ${event!.isFree ? "text-primary" : ""}`}>
                  {formatCost(event!.cost, event!.currency, event!.isFree)}
                </span>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>{isEvent ? `${event!.venueName}, ${event!.address}` : place!.address}</span>
            </div>
            {(item as any).distance !== undefined && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Navigation className="w-4 h-4 flex-shrink-0" />
                <span>{formatDistance((item as any).distance)} away</span>
              </div>
            )}
          </div>

          {/* Place opening hours */}
          {!isEvent && place!.openingHours && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>{place!.openingHours}</span>
            </div>
          )}

          {/* Child features */}
          {features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {features.map(f => (
                <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-xs text-accent-foreground font-medium">
                  <FeatureBadge feature={f} />
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant={isFav ? "default" : "secondary"}
              className="flex-1"
              onClick={toggleFavourite}
              data-testid="toggle-favourite"
            >
              <Heart className={`w-4 h-4 mr-2 ${isFav ? "fill-current" : ""}`} />
              {isFav ? "Saved" : "Save"}
            </Button>
            <Button variant="secondary" className="flex-1" asChild>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" data-testid="link-maps">
                <MapPin className="w-4 h-4 mr-2" />
                Directions
              </a>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleShare}
              data-testid="share-button"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* External link */}
          {((isEvent && event!.externalUrl) || (!isEvent && place!.website)) && (
            <Button variant="secondary" size="sm" asChild>
              <a
                href={isEvent ? event!.externalUrl! : place!.website!}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-external"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                Visit website
              </a>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
