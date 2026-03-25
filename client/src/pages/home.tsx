import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { EventCard } from "@/components/event-card";
import { PlaceCard } from "@/components/place-card";
import { FilterBar } from "@/components/filter-bar";
import { RadiusPicker } from "@/components/radius-picker";
import { DetailSheet } from "@/components/detail-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Sun, ArrowUpDown, MapPin, Calendar, Baby, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatGroupDate, DISTANCE_OPTIONS } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event, Place, UserProfile, Sponsor } from "@shared/schema";

export default function HomePage() {
  const { data: profile } = useQuery<UserProfile>({ queryKey: ["/api/profile"] });
  const [selectedAgeBands, setSelectedAgeBands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"nearest" | "soonest">("nearest");
  const [selectedEvent, setSelectedEvent] = useState<(Event & { distance?: number }) | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<(Place & { distance?: number }) | null>(null);

  const queryParams = new URLSearchParams();
  if (profile) {
    queryParams.set("lat", String(profile.locationLat));
    queryParams.set("lng", String(profile.locationLng));
    queryParams.set("radius", String(profile.distanceRadius));
  }
  if (selectedAgeBands.length > 0) queryParams.set("ageBands", selectedAgeBands.join(","));
  if (selectedCategory) queryParams.set("category", selectedCategory);
  if (selectedDay) queryParams.set("day", selectedDay);
  if (freeOnly) queryParams.set("free", "true");
  if (search) queryParams.set("search", search);
  queryParams.set("sort", sortBy);

  const { data: events, isLoading } = useQuery<(Event & { distance?: number })[]>({
    queryKey: ["/api/events", `?${queryParams.toString()}`],
    enabled: !!profile,
  });

  const { data: featured } = useQuery<{ events: (Event & { distance?: number })[]; places: (Place & { distance?: number })[] }>({
    queryKey: ["/api/featured", `?lat=${profile?.locationLat}&lng=${profile?.locationLng}`],
    enabled: !!profile,
  });

  // "What's on today" — events happening today
  const todayParams = new URLSearchParams();
  if (profile) {
    todayParams.set("lat", String(profile.locationLat));
    todayParams.set("lng", String(profile.locationLng));
    todayParams.set("radius", String(profile.distanceRadius));
  }
  todayParams.set("day", "today");
  todayParams.set("sort", "soonest");

  const { data: todayEvents } = useQuery<(Event & { distance?: number })[]>({
    queryKey: ["/api/events", `?${todayParams.toString()}`],
    enabled: !!profile,
  });

  const toggleAgeBand = (id: string) => {
    setSelectedAgeBands(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const showFeatured = featured && (featured.events.length > 0 || featured.places.length > 0) && !search && !selectedCategory && selectedAgeBands.length === 0 && !selectedDay;

  // Filter out featured events from main list
  const displayEvents = useMemo(() => {
    if (!events) return [];
    if (showFeatured) {
      return events.filter(event => !featured!.events.some(fe => fe.id === event.id));
    }
    return events;
  }, [events, featured, showFeatured]);

  // Group events by date for sticky day headers
  const groupedEvents = useMemo(() => {
    const groups: { date: string; label: string; events: (Event & { distance?: number })[] }[] = [];
    for (const event of displayEvents) {
      const existing = groups.find(g => g.date === event.date);
      if (existing) {
        existing.events.push(event);
      } else {
        groups.push({
          date: event.date,
          label: formatGroupDate(event.date),
          events: [event],
        });
      }
    }
    // Sort groups by date
    groups.sort((a, b) => a.date.localeCompare(b.date));
    return groups;
  }, [displayEvents]);

  const showTodaySection = todayEvents && todayEvents.length > 0 && !search && !selectedCategory && selectedAgeBands.length === 0 && !selectedDay;

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      {/* What's on today */}
      {showTodaySection && (
        <section data-testid="whats-on-today">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-amber-500" />
            <h2 className="font-extrabold text-sm tracking-wide uppercase text-amber-600 dark:text-amber-400">What's on today</h2>
            <span className="text-xs text-muted-foreground ml-auto">{todayEvents!.length} event{todayEvents!.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {todayEvents!.slice(0, 8).map(event => (
              <div key={`today-${event.id}`} className="min-w-[280px] max-w-[280px] flex-shrink-0">
                <EventCard event={event} onClick={() => setSelectedEvent(event)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured section */}
      {showFeatured && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-extrabold text-sm tracking-wide uppercase text-primary">Featured This Week</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {featured!.events.map(event => (
              <div key={`fe-${event.id}`} className="min-w-[280px] max-w-[280px] flex-shrink-0">
                <EventCard event={event} onClick={() => setSelectedEvent(event)} />
              </div>
            ))}
            {featured!.places.map(place => (
              <div key={`fp-${place.id}`} className="min-w-[280px] max-w-[280px] flex-shrink-0">
                <PlaceCard place={place} onClick={() => setSelectedPlace(place)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <FilterBar
        selectedAgeBands={selectedAgeBands}
        onToggleAgeBand={toggleAgeBand}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        freeOnly={freeOnly}
        onToggleFree={() => setFreeOnly(p => !p)}
        search={search}
        onSearchChange={setSearch}
        mode="events"
      />

      {/* Quick radius picker */}
      <RadiusPicker profile={profile} />

      {/* Sort toggle + heading */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-extrabold text-sm tracking-wide uppercase text-muted-foreground">
          {selectedDay === "today" ? "Today" :
           selectedDay === "tomorrow" ? "Tomorrow" :
           selectedDay === "weekend" ? "This Weekend" :
           "Upcoming Events"}
          {events ? ` (${displayEvents.length})` : ""}
        </h2>
        <button
          onClick={() => setSortBy(prev => prev === "nearest" ? "soonest" : "nearest")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          data-testid="sort-toggle"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sortBy === "nearest" ? "Nearest" : "Soonest"}
        </button>
      </div>

      {/* Event list grouped by day */}
      <section className="flex flex-col gap-1">
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        )}
        {events && displayEvents.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 gap-4" data-testid="empty-state-events">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <Baby className="w-7 h-7 text-muted-foreground/60" />
            </div>
            <div className="flex flex-col gap-1.5 max-w-[300px]">
              <p className="text-sm font-semibold text-foreground">
                No adventures found within {profile?.distanceRadius || 5} miles
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {(profile?.distanceRadius || 5) < 50
                  ? "You might be in a more rural area. Try widening your search radius to find events further afield, or try clearing some filters."
                  : "Try picking a different day or clearing some filters. There's always something fun to discover!"}
              </p>
              {(profile?.distanceRadius || 5) < 50 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2 mx-auto"
                  onClick={async () => {
                    const currentRadius = profile?.distanceRadius || 5;
                    const allOpts = [...DISTANCE_OPTIONS];
                    const nextRadius = allOpts.find(d => d > currentRadius) || allOpts[allOpts.length - 1];
                    await apiRequest("PUT", "/api/profile", { distanceRadius: nextRadius });
                    queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/places"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/featured"] });
                  }}
                  data-testid="increase-radius"
                >
                  <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
                  Widen to {(() => {
                    const currentRadius = profile?.distanceRadius || 5;
                    const allOpts = [...DISTANCE_OPTIONS];
                    return allOpts.find(d => d > currentRadius) || allOpts[allOpts.length - 1];
                  })()} miles
                </Button>
              )}
            </div>
          </div>
        )}
        {sortBy === "soonest" && groupedEvents.length > 0 ? (
          // Grouped by day with sticky headers
          groupedEvents.map(group => (
            <div key={group.date} className="flex flex-col gap-3 mb-4">
              <div className="sticky top-[57px] z-10 -mx-4 px-4 py-2 bg-background/95 backdrop-blur-sm border-b border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-wide text-primary" data-testid={`day-header-${group.date}`}>
                  {group.label}
                </h3>
              </div>
              {group.events.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          ))
        ) : (
          // Flat list (nearest first)
          displayEvents.map(event => (
            <div key={event.id} className="mb-3">
              <EventCard
                event={event}
                onClick={() => setSelectedEvent(event)}
              />
            </div>
          ))
        )}
      </section>

      {/* Local Partners — subtle sponsor section */}
      <LocalPartners />

      {/* Detail sheet */}
      <DetailSheet
        open={!!selectedEvent || !!selectedPlace}
        onClose={() => { setSelectedEvent(null); setSelectedPlace(null); }}
        event={selectedEvent}
        place={selectedPlace}
      />
    </div>
  );
}

function LocalPartners() {
  const { data: sponsors } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  if (!sponsors || sponsors.length === 0) return null;

  return (
    <section className="mt-6 pt-6 border-t border-border/50" data-testid="local-partners">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Local Partners</span>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {sponsors.map(sponsor => (
          <a
            key={sponsor.id}
            href={sponsor.website || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-[160px] flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border/50 hover:border-border transition-colors text-center"
            data-testid={`sponsor-card-${sponsor.id}`}
          >
            <span className="text-2xl">{sponsor.logoEmoji}</span>
            <span className="text-xs font-semibold text-foreground leading-tight">{sponsor.name}</span>
            <span className="text-[10px] text-muted-foreground leading-snug">{sponsor.tagline}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-medium mt-0.5">Sponsored</span>
          </a>
        ))}
      </div>
    </section>
  );
}
