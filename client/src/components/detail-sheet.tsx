import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AgeBandBadge } from "./age-band-badge";
import { FeatureBadge } from "./feature-badge";
import { Heart, MapPin, Clock, Navigation, ExternalLink, Calendar, RotateCw, Share2, CalendarPlus } from "lucide-react";
import { formatDistance, formatCost, getCategoryLabel, formatFriendlyDate, getNextRecurringDates, generateICS, downloadFile, getHelperSentence } from "@/lib/constants";
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

  const helperSentence = isEvent ? getHelperSentence(event!) : "";

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
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard", description: text });
      } catch {
        toast({ title: "Share", description: text });
      }
    }
  };

  const handleCalendar = () => {
    if (!isEvent) return;
    const ics = generateICS(event!);
    downloadFile(ics, `${event!.title.replace(/[^a-zA-Z0-9]/g, "-")}.ics`, "text/calendar");
    toast({ title: "Calendar file downloaded", description: "Open it to add this event to your calendar" });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-8">
        <SheetHeader className="text-left pb-1">
          <SheetTitle className="text-lg font-extrabold leading-tight pr-8">
            {isEvent ? event!.title : place!.name}
          </SheetTitle>
          <span className="text-xs text-muted-foreground font-medium">
            {getCategoryLabel(isEvent ? event!.category : place!.category)}
          </span>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-3">
          {/* Helper sentence */}
          {helperSentence && (
            <p className="text-sm text-muted-foreground italic leading-relaxed" data-testid="helper-sentence">
              {helperSentence}
            </p>
          )}

          {/* Key info block — structured */}
          {isEvent && (
            <div className="rounded-xl bg-accent/40 p-3.5 flex flex-col gap-2.5" data-testid="event-key-info">
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">{formatFriendlyDate(event!.date)}</span>
                <span className="text-muted-foreground">
                  {event!.startTime}{event!.endTime ? `\u2013${event!.endTime}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>{event!.venueName}, {event!.address}</span>
              </div>
              {(item as any).distance !== undefined && (
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Navigation className="w-4 h-4 flex-shrink-0" />
                  <span>{formatDistance((item as any).distance)} away</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm">
                <span className={`font-bold text-base ${event!.isFree ? "text-primary" : ""}`}>
                  {formatCost(event!.cost, event!.currency, event!.isFree)}
                </span>

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
            </div>
          )}

          {/* Place info block */}
          {!isEvent && (
            <div className="rounded-xl bg-accent/40 p-3.5 flex flex-col gap-2.5" data-testid="place-key-info">
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>{place!.address}</span>
              </div>
              {(item as any).distance !== undefined && (
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Navigation className="w-4 h-4 flex-shrink-0" />
                  <span>{formatDistance((item as any).distance)} away</span>
                </div>
              )}
              {place!.openingHours && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{place!.openingHours}</span>
                </div>
              )}
            </div>
          )}

          {/* Age bands */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {ageBands.map(band => (
              <AgeBandBadge key={band} band={band} />
            ))}
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed">{isEvent ? event!.description : place!.description}</p>

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

          {/* Action buttons — map / site / save / calendar / share */}
          <div className="grid grid-cols-5 gap-2 pt-1" data-testid="action-buttons">
            <button
              onClick={() => window.open(mapsUrl, "_blank")}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-card border border-border hover:bg-accent transition-colors min-h-[60px]"
              data-testid="action-map"
              aria-label="Open in maps"
            >
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Map</span>
            </button>

            {((isEvent && event!.externalUrl) || (!isEvent && place!.website)) && (
              <a
                href={isEvent ? event!.externalUrl! : place!.website!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-card border border-border hover:bg-accent transition-colors min-h-[60px]"
                data-testid="action-website"
                aria-label="Visit website"
              >
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Site</span>
              </a>
            )}

            <button
              onClick={toggleFavourite}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-colors min-h-[60px] ${
                isFav
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-accent"
              }`}
              data-testid="toggle-favourite"
              aria-label={isFav ? "Remove from saved" : "Save"}
            >
              <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
              <span className="text-[10px] font-medium">{isFav ? "Saved" : "Save"}</span>
            </button>

            {isEvent && (
              <button
                onClick={handleCalendar}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-card border border-border hover:bg-accent transition-colors min-h-[60px]"
                data-testid="action-calendar"
                aria-label="Add to calendar"
              >
                <CalendarPlus className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Cal</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-card border border-border hover:bg-accent transition-colors min-h-[60px]"
              data-testid="share-button"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Share</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
