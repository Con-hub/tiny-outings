import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlaceCard } from "@/components/place-card";
import { FilterBar } from "@/components/filter-bar";
import { RadiusPicker } from "@/components/radius-picker";
import { DetailSheet } from "@/components/detail-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DISTANCE_OPTIONS } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Place, UserProfile } from "@shared/schema";

export default function ExplorePage() {
  const { data: profile } = useQuery<UserProfile>({ queryKey: ["/api/profile"] });
  const [selectedAgeBands, setSelectedAgeBands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<(Place & { distance?: number }) | null>(null);

  const queryParams = new URLSearchParams();
  if (profile) {
    queryParams.set("lat", String(profile.locationLat));
    queryParams.set("lng", String(profile.locationLng));
    queryParams.set("radius", String(profile.distanceRadius));
  }
  if (selectedAgeBands.length > 0) queryParams.set("ageBands", selectedAgeBands.join(","));
  if (selectedCategory) queryParams.set("category", selectedCategory);
  if (search) queryParams.set("search", search);

  const { data: places, isLoading } = useQuery<(Place & { distance?: number })[]>({
    queryKey: ["/api/places", `?${queryParams.toString()}`],
    enabled: !!profile,
  });

  const toggleAgeBand = (id: string) => {
    setSelectedAgeBands(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <FilterBar
        selectedAgeBands={selectedAgeBands}
        onToggleAgeBand={toggleAgeBand}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        search={search}
        onSearchChange={setSearch}
        mode="places"
      />

      {/* Quick radius picker */}
      <RadiusPicker profile={profile} />

      <section className="flex flex-col gap-3">
        <h2 className="font-extrabold text-sm tracking-wide uppercase text-muted-foreground">
          Nearby Places {places ? `(${places.length})` : ""}
        </h2>
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        )}
        {places && places.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 gap-4" data-testid="empty-state-places">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <MapPin className="w-7 h-7 text-muted-foreground/60" />
            </div>
            <div className="flex flex-col gap-1.5 max-w-[300px]">
              <p className="text-sm font-semibold text-foreground">
                No places found within {profile?.distanceRadius || 5} miles
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {(profile?.distanceRadius || 5) < 50
                  ? "You might be in a more rural area. Try widening your search radius to find places further afield."
                  : "Try clearing some filters. There are lovely spots waiting to be explored!"}
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
                  data-testid="increase-radius-places"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {places?.map(place => (
            <PlaceCard
              key={place.id}
              place={place}
              onClick={() => setSelectedPlace(place)}
            />
          ))}
        </div>
      </section>

      <DetailSheet
        open={!!selectedPlace}
        onClose={() => setSelectedPlace(null)}
        place={selectedPlace}
      />
    </div>
  );
}
