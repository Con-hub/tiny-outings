import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { AGE_BANDS, CATEGORIES, PLACE_CATEGORIES, DAY_FILTERS } from "@/lib/constants";
import { CategoryIcon } from "./category-icon";

interface FilterBarProps {
  selectedAgeBands: string[];
  onToggleAgeBand: (id: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  selectedDay?: string | null;
  onSelectDay?: (id: string | null) => void;
  freeOnly?: boolean;
  onToggleFree?: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  mode?: "events" | "places";
}

const BAND_ACTIVE_STYLES: Record<string, string> = {
  baby: "bg-[hsl(var(--baby))] text-[hsl(var(--baby-foreground))] border-[hsl(var(--baby-foreground)/0.2)]",
  toddler: "bg-[hsl(var(--toddler))] text-[hsl(var(--toddler-foreground))] border-[hsl(var(--toddler-foreground)/0.2)]",
  preschooler: "bg-[hsl(var(--preschooler))] text-[hsl(var(--preschooler-foreground))] border-[hsl(var(--preschooler-foreground)/0.2)]",
};

export function FilterBar({
  selectedAgeBands, onToggleAgeBand,
  selectedCategory, onSelectCategory,
  selectedDay, onSelectDay,
  freeOnly, onToggleFree,
  search, onSearchChange,
  mode = "events",
}: FilterBarProps) {
  const cats = mode === "events" ? CATEGORIES : PLACE_CATEGORIES;

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder={mode === "events" ? "Search events..." : "Search places..."}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          data-testid="search-input"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
            data-testid="search-clear"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Age bands */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {AGE_BANDS.map(band => {
          const active = selectedAgeBands.includes(band.id);
          return (
            <button
              key={band.id}
              onClick={() => onToggleAgeBand(band.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors",
                active
                  ? BAND_ACTIVE_STYLES[band.id]
                  : "bg-card text-muted-foreground border-border"
              )}
              data-testid={`filter-age-${band.id}`}
            >
              {band.label}
            </button>
          );
        })}
      </div>

      {/* Day filter (events only) */}
      {mode === "events" && onSelectDay && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {DAY_FILTERS.map(day => (
            <button
              key={day.id}
              onClick={() => onSelectDay(selectedDay === day.id ? null : day.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors",
                selectedDay === day.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              )}
              data-testid={`filter-day-${day.id}`}
            >
              {day.label}
            </button>
          ))}
          {onToggleFree && (
            <button
              onClick={onToggleFree}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors",
                freeOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              )}
              data-testid="filter-free"
            >
              Free only
            </button>
          )}
        </div>
      )}

      {/* Categories with icons */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {cats.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(selectedCategory === cat.id ? null : cat.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border"
            )}
            data-testid={`filter-cat-${cat.id}`}
          >
            <CategoryIcon categoryId={cat.id} className="w-3 h-3" />
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
