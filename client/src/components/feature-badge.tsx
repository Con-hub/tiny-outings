import { Accessibility, Baby as BabyIcon, Heart, Car, Armchair } from "lucide-react";
import { CHILD_FEATURES } from "@/lib/constants";

const FEATURE_ICONS: Record<string, typeof Accessibility> = {
  "buggy-friendly": Accessibility,
  "baby-changing": BabyIcon,
  "breastfeeding-welcome": Heart,
  "parking": Car,
  "highchairs": Armchair,
};

export function FeatureBadge({ feature }: { feature: string }) {
  const info = CHILD_FEATURES[feature];
  const Icon = FEATURE_ICONS[feature];
  if (!info) return null;

  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-muted-foreground"
      data-testid={`feature-${feature}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span>{info.label}</span>
    </span>
  );
}
