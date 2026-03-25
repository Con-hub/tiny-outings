import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EventCard } from "@/components/event-card";
import { PlaceCard } from "@/components/place-card";
import { DetailSheet } from "@/components/detail-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Sparkles, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const savedEvents = favourites?.filter(f => f.event).map(f => f.event!) || [];
  const savedPlaces = favourites?.filter(f => f.place).map(f => f.place!) || [];

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <h1 className="font-extrabold text-lg">Saved</h1>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="events" className="flex-1" data-testid="tab-saved-events">
            Events ({savedEvents.length})
          </TabsTrigger>
          <TabsTrigger value="places" className="flex-1" data-testid="tab-saved-places">
            Places ({savedPlaces.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4">
          {isLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
            </div>
          )}
          {savedEvents.length === 0 && !isLoading && (
            <EmptyState
              icon={<Sparkles className="w-7 h-7 text-muted-foreground/60" />}
              title="No saved events yet"
              message="When you find an event you love, tap the heart to save it here. Your saved adventures will be waiting for you!"
            />
          )}
          <div className="flex flex-col gap-3">
            {savedEvents.map(event => (
              <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="places" className="mt-4">
          {isLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
            </div>
          )}
          {savedPlaces.length === 0 && !isLoading && (
            <EmptyState
              icon={<MapPin className="w-7 h-7 text-muted-foreground/60" />}
              title="No saved places yet"
              message="Explore nearby spots on the Explore tab and save the ones that catch your eye. Perfect for planning your next wee outing!"
            />
          )}
          <div className="flex flex-col gap-3">
            {savedPlaces.map(place => (
              <PlaceCard key={place.id} place={place} onClick={() => setSelectedPlace(place)} />
            ))}
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
    <div className="flex flex-col items-center text-center py-16 gap-4" data-testid="empty-state-favourites">
      <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
        {icon}
      </div>
      <div className="flex flex-col gap-1.5 max-w-[280px]">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
