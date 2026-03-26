import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DetailSheet } from "@/components/detail-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MapPin, Calendar, Clock, X, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFriendlyDate } from "@/lib/constants";
import type { Event, Place } from "@shared/schema";

interface EnrichedFav {
  id: number;
  eventId: number | null;
  placeId: number | null;
  event: Event | null;
  place: Place | null;
}

export default function FavouritesPage() {
  const { data: favourites, isLoading } = useQuery<EnrichedFav[]>({
    queryKey: ["/api/favourites"],
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const savedEvents = favourites?.filter(f => f.event) || [];
  const savedPlaces = favourites?.filter(f => f.place) || [];

  const handleRemove = async (favId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await apiRequest("DELETE", `/api/favourites/${favId}`);
    queryClient.invalidateQueries({ queryKey: ["/api/favourites"] });
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <h1 className="font-extrabold text-lg">My Plans</h1>
      <p className="text-sm text-muted-foreground -mt-2">Your saved outings and places</p>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="events" className="flex-1" data-testid="tab-saved-events">
            Events ({savedEvents.length})
          </TabsTrigger>
          <TabsTrigger value="places" className="flex-1" data-testid="tab-saved-places">
            Places ({savedPlaces.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-3">
          {isLoading && (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ))}
            </div>
          )}
          {savedEvents.length === 0 && !isLoading && (
            <EmptyState
              icon={<Sparkles className="w-6 h-6 text-muted-foreground/60" />}
              title="No saved events yet"
              message="Tap the heart on any event to save it here for quick access."
            />
          )}
          <div className="flex flex-col gap-1.5">
            {savedEvents.map(fav => {
              const ev = fav.event!;
              return (
                <button
                  key={fav.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors text-left w-full"
                  data-testid={`saved-event-${ev.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">{ev.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatFriendlyDate(ev.date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ev.startTime}
                      </span>
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {ev.city}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemove(fav.id, e)}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors"
                    aria-label="Remove from saved"
                    data-testid={`remove-fav-${fav.id}`}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </button>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="places" className="mt-3">
          {isLoading && (
            <div className="flex flex-col gap-2">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ))}
            </div>
          )}
          {savedPlaces.length === 0 && !isLoading && (
            <EmptyState
              icon={<MapPin className="w-6 h-6 text-muted-foreground/60" />}
              title="No saved places yet"
              message="Explore nearby spots and save the ones that catch your eye."
            />
          )}
          <div className="flex flex-col gap-1.5">
            {savedPlaces.map(fav => {
              const pl = fav.place!;
              return (
                <button
                  key={fav.id}
                  onClick={() => setSelectedPlace(pl)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors text-left w-full"
                  data-testid={`saved-place-${pl.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">{pl.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {pl.city}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemove(fav.id, e)}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors"
                    aria-label="Remove from saved"
                    data-testid={`remove-fav-${fav.id}`}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </button>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <DetailSheet
        open={!!selectedEvent || !!selectedPlace}
        onClose={() => { setSelectedEvent(null); setSelectedPlace(null); }}
        event={selectedEvent}
        place={selectedPlace}
      />
    </div>
  );
}

function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center text-center py-12 gap-3" data-testid="empty-state-favourites">
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
        {icon}
      </div>
      <div className="flex flex-col gap-1 max-w-[260px]">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
