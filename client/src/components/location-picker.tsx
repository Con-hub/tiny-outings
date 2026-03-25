import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MapPin, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface City {
  name: string;
  country: string;
  region?: string;
  lat: number;
  lng: number;
  currency: string;
}

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
}

const REGION_ORDER = [
  "Northern Ireland",
  "Leinster", "Munster", "Connacht", "Ulster",
  "Scotland", "Wales", "England",
];

function getRegionLabel(region: string): string {
  if (["Leinster", "Munster", "Connacht", "Ulster"].includes(region)) {
    return `Ireland — ${region}`;
  }
  return region;
}

export function LocationPicker({ open, onClose, onSelect }: LocationPickerProps) {
  const [search, setSearch] = useState("");
  const { data: cities } = useQuery<City[]>({ queryKey: ["/api/cities"] });

  const filtered = cities?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.region && c.region.toLowerCase().includes(search.toLowerCase())) ||
    c.country.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Group by region
  const grouped = REGION_ORDER.map(region => ({
    region,
    label: getRegionLabel(region),
    cities: filtered.filter(c => c.region === region),
  })).filter(g => g.cities.length > 0);

  // If searching, show flat list for quick scanning
  const isSearching = search.length > 0;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[75vh] rounded-t-2xl pb-8">
        <SheetHeader className="text-left pb-3">
          <SheetTitle className="text-lg font-extrabold">Choose your location</SheetTitle>
          <p className="text-xs text-muted-foreground">Pick the town nearest to you</p>
        </SheetHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search towns & cities..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            data-testid="location-search"
          />
        </div>

        <div className="overflow-y-auto max-h-[45vh] flex flex-col gap-1">
          {isSearching ? (
            // Flat list when searching
            filtered.map(city => (
              <CityButton key={`${city.name}-${city.region}`} city={city} onSelect={onSelect} onClose={onClose} setSearch={setSearch} />
            ))
          ) : (
            // Grouped by region
            grouped.map(group => (
              <div key={group.region}>
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                  {group.label}
                </div>
                {group.cities.map(city => (
                  <CityButton key={`${city.name}-${city.region}`} city={city} onSelect={onSelect} onClose={onClose} setSearch={setSearch} />
                ))}
              </div>
            ))
          )}
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground font-medium">
                No towns found for "{search}"
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pick the nearest town to you — events are shown by distance
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CityButton({ city, onSelect, onClose, setSearch }: {
  city: City;
  onSelect: (city: City) => void;
  onClose: () => void;
  setSearch: (v: string) => void;
}) {
  return (
    <button
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover-elevate transition-colors w-full"
      onClick={() => { onSelect(city); onClose(); setSearch(""); }}
      data-testid={`city-${city.name}`}
    >
      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
      <div>
        <span className="font-semibold text-sm">{city.name}</span>
        <span className="text-xs text-muted-foreground ml-2">{city.country}</span>
      </div>
    </button>
  );
}
