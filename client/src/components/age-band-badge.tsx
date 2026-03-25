import { Baby, Footprints, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAgeBandInfo } from "@/lib/constants";

const BAND_STYLES: Record<string, string> = {
  baby: "bg-[hsl(var(--baby))] text-[hsl(var(--baby-foreground))]",
  toddler: "bg-[hsl(var(--toddler))] text-[hsl(var(--toddler-foreground))]",
  preschooler: "bg-[hsl(var(--preschooler))] text-[hsl(var(--preschooler-foreground))]",
};

const BAND_ICONS: Record<string, typeof Baby> = {
  baby: Baby,
  toddler: Footprints,
  preschooler: PartyPopper,
};

export function AgeBandBadge({ band, compact }: { band: string; compact?: boolean }) {
  const info = getAgeBandInfo(band);
  if (!info) return null;
  const Icon = BAND_ICONS[band];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap",
        compact ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        BAND_STYLES[band]
      )}
      data-testid={`badge-age-${band}`}
    >
      {Icon && <Icon className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      {info.label}
    </span>
  );
}
