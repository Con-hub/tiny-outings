import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EventCard } from "@/components/event-card";
import { PlaceCard } from "@/components/place-card";
import { FilterBar } from "@/components/filter-bar";
import { RadiusPicker } from "@/components/radius-picker";
import { DetailSheet } from "@/components/detail-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowUpDown, Baby, Maximize2, ChevronRight, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatGroupDate, DISTANCE_OPTIONS } from "@/lib/constants";
import type { Event, Place, UserProfile, Sponsor } from "@shared/schema";

type QuickFilter = "today" | "thisweek" | "weekend" | "free" | "indoor" | null;
type AgeBandFilter = "baby" | "toddler" | "preschooler";

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
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);
  const [quickAgeBand, setQuickAgeBand] = useState<AgeBandFilter | null>(null);
  const [showAllFeatured, setShowAllFeatured] = useState(false);

  // Apply quick filter to main query params
  const effectiveDay = quickFilter === "today" ? "today" : quickFilter === "thisweek" ? "thisweek" : quickFilter === "weekend" ? "weekend" : selectedDay;
  const effectiveFree = quickFilter === "free" ? true : freeOnly;
  // Merge quick age band with manual age band selection
  const effectiveAgeBands = quickAgeBand
    ? selectedAgeBands.includes(quickAgeBand) ? selectedAgeBands : [quickAgeBand, ...selectedAgeBands]
    : selectedAgeBands;

  const queryParams = new URLSearchParams();
  if (profile) {
    queryParams.set("lat", String(profile.locationLat));
    queryParams.set("lng", String(profile.locationLng));
    queryParams.set("radius", String(profile.distanceRadius));
  }
  if (effectiveAgeBands.length > 0) queryParams.set("ageBands", effectiveAgeBands.join(","));
  if (selectedCategory) queryParams.set("category", selectedCategory);
  if (effectiveDay) queryParams.set("day", effectiveDay);
  if (effectiveFree) queryParams.set("free", "true");
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

  const toggleAgeBand = (id: string) => {
    setSelectedAgeBands(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleQuickFilter = (filter: QuickFilter) => {
    if (quickFilter === filter) {
      setQuickFilter(null);
    } else {
      setQuickFilter(filter);
      // Clear conflicting manual filters
      if (filter === "today" || filter === "thisweek" || filter === "weekend") setSelectedDay(null);
      if (filter === "free") setFreeOnly(false);
    }
  };

  const handleQuickAgeBand = (band: AgeBandFilter) => {
    setQuickAgeBand(prev => prev === band ? null : band);
  };

  const hasActiveFilters = search || selectedCategory || selectedAgeBands.length > 0 || selectedDay || quickFilter || quickAgeBand;
  const showFeatured = featured && (featured.events.length > 0 || featured.places.length > 0) && !hasActiveFilters;

  // Limit featured to 3-5 items
  const featuredEvents = featured?.events.slice(0, showAllFeatured ? 10 : 3) || [];
  const featuredPlaces = featured?.places.slice(0, showAllFeatured ? 10 : 2) || [];
  const totalFeatured = (featured?.events.length || 0) + (featured?.places.length || 0);
  const showSeeAll = totalFeatured > 5 && !showAllFeatured;

  // Filter out featured events from main list + apply indoor filter client-side
  const INDOOR_CATEGORIES = ["classes", "community", "arts", "music", "storytime", "indoor"];
  const displayEvents = useMemo(() => {
    if (!events) return [];
    let filtered = events;
    if (showFeatured) {
      filtered = filtered.filter(event => !featured!.events.some(fe => fe.id === event.id));
    }
    if (quickFilter === "indoor") {
      filtered = filtered.filter(event => INDOOR_CATEGORIES.includes(event.category));
    }
    return filtered;
  }, [events, featured, showFeatured, quickFilter]);

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
    groups.sort((a, b) => a.date.localeCompare(b.date));
    return groups;
  }, [displayEvents]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-3 pb-5">
      {/* Subtitle */}
      <p className="text-sm text-muted-foreground leading-relaxed -mt-0.5">
        Calm days out for you and your little one
      </p>

      {/* Quick filter chips — day/type */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar" data-testid="quick-filters">
        {([
          { id: "today" as const, label: "Today" },
          { id: "thisweek" as const, label: "This Week" },
          { id: "weekend" as const, label: "Weekend" },
          { id: "free" as const, label: "Free" },
          { id: "indoor" as const, label: "Indoor" },
        ]).map(chip => (
          <button
            key={chip.id}
            onClick={() => handleQuickFilter(chip.id)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap border transition-colors min-h-[36px] ${
              quickFilter === chip.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/30"
            }`}
            data-testid={`quick-filter-${chip.id}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Age band quick chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mt-1" data-testid="age-quick-filters">
        {([
          { id: "baby" as const, label: "👶 Baby", desc: "0–12m" },
          { id: "toddler" as const, label: "🧒 Toddler", desc: "1–3y" },
          { id: "preschooler" as const, label: "🎒 Pre-schooler", desc: "3–5y" },
        ]).map(chip => (
          <button
            key={chip.id}
            onClick={() => handleQuickAgeBand(chip.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap border transition-colors min-h-[36px] ${
              quickAgeBand === chip.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/30"
            }`}
            data-testid={`age-filter-${chip.id}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Featured section — curated 3-5 items */}
      {showFeatured && (
        <section data-testid="featured-section">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm text-primary">Our Picks</h2>
            </div>
            {showSeeAll && (
              <button
                onClick={() => setShowAllFeatured(true)}
                className="inline-flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
                data-testid="see-all-featured"
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2.5">
            {featuredEvents.map(event => (
              <EventCard key={`fe-${event.id}`} event={event} onClick={() => setSelectedEvent(event)} />
            ))}
            {featuredPlaces.map(place => (
              <PlaceCard key={`fp-${place.id}`} place={place} onClick={() => setSelectedPlace(place)} />
            ))}
          </div>
        </section>
      )}

      {/* Full filters (collapsed behind search) */}
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

      {/* Radius picker */}
      <RadiusPicker profile={profile} />

      {/* Sort toggle + heading */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold text-sm text-muted-foreground">
          {effectiveDay === "today" ? "Today" :
           effectiveDay === "tomorrow" ? "Tomorrow" :
           effectiveDay === "thisweek" ? "This Week" :
           effectiveDay === "weekend" ? "This Weekend" :
           quickFilter === "indoor" ? "Indoor Events" :
           quickFilter === "free" ? "Free Events" :
           quickAgeBand === "baby" ? "Baby Events" :
           quickAgeBand === "toddler" ? "Toddler Events" :
           quickAgeBand === "preschooler" ? "Pre-schooler Events" :
           "Upcoming"}
          {events ? ` (${displayEvents.length})` : ""}
        </h2>
        <button
          onClick={() => setSortBy(prev => prev === "nearest" ? "soonest" : "nearest")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[32px]"
          data-testid="sort-toggle"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sortBy === "nearest" ? "Nearest" : "Soonest"}
        </button>
      </div>

      {/* Event list */}
      <section className="flex flex-col gap-1.5 sm:gap-2.5">
        {isLoading && (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col gap-2 p-3.5 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-4 w-4 rounded-full ml-auto" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-10 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}
        {events && displayEvents.length === 0 && (
          <div className="flex flex-col items-center text-center py-12 gap-4" data-testid="empty-state-events">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <Search className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <div className="flex flex-col gap-2 max-w-[300px]">
              <p className="text-sm font-bold text-foreground">
                Nothing found
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {quickFilter === "today"
                  ? "Nothing on today matching your filters — try This Week to see what's coming up."
                  : quickFilter === "thisweek"
                  ? "Nothing this week nearby — try widening your search radius or removing an age filter."
                  : quickAgeBand
                  ? `No ${quickAgeBand} events with these filters — try removing the age filter or choosing This Week.`
                  : (profile?.distanceRadius || 5) < 25
                  ? "Try widening your search radius to find more events nearby."
                  : "Try removing a filter or choosing a different week."}
              </p>
              <div className="flex flex-col gap-2 mt-1">
                {/* Smart suggestions based on active filter */}
                {quickFilter === "today" && (
                  <Button variant="secondary" size="sm" className="mx-auto" onClick={() => handleQuickFilter("thisweek")} data-testid="suggest-thisweek">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    See This Week instead
                  </Button>
                )}
                {quickAgeBand && (
                  <Button variant="secondary" size="sm" className="mx-auto" onClick={() => setQuickAgeBand(null)} data-testid="clear-age-filter">
                    Clear age filter
                  </Button>
                )}
                {(profile?.distanceRadius || 5) < 50 && !quickFilter && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mx-auto"
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
          </div>
        )}
        {sortBy === "soonest" && groupedEvents.length > 0 ? (
          groupedEvents.map(group => (
            <div key={group.date} className="flex flex-col gap-2 mb-3">
              <div className="sticky top-[57px] z-10 -mx-4 px-4 py-1.5 bg-background/95 backdrop-blur-sm border-b border-border/50">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {displayEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Local Partners — sponsor section */}
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
    <section className="mt-4 pt-4 border-t border-border/40" data-testid="local-partners">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Supported by</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {sponsors.map(sponsor => (
          <a
            key={sponsor.id}
            href={sponsor.website || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-[150px] flex flex-col items-center gap-1 p-2.5 rounded-xl bg-muted/40 border border-dashed border-border/60 hover:border-border transition-colors text-center"
            data-testid={`sponsor-card-${sponsor.id}`}
          >
            <span className="text-xl">{sponsor.logoEmoji}</span>
            <span className="text-xs font-semibold text-foreground leading-tight">{sponsor.name}</span>
            <span className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{sponsor.tagline}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40 font-medium mt-0.5">Ad</span>
          </a>
        ))}
      </div>
    </section>
  );
}
