import {
  Users, GraduationCap, HeartHandshake, TreePine, BookOpen,
  Palette, Dumbbell, Music, Ticket, Star, Blocks, Coffee,
} from "lucide-react";
import { CATEGORY_ICON_MAP } from "@/lib/constants";

const ICON_COMPONENTS: Record<string, any> = {
  Users, GraduationCap, HeartHandshake, TreePine, BookOpen,
  Palette, Dumbbell, Music, Ticket, Star, Blocks, Coffee,
};

export function CategoryIcon({ categoryId, className = "w-3.5 h-3.5" }: { categoryId: string; className?: string }) {
  const iconName = CATEGORY_ICON_MAP[categoryId];
  if (!iconName) return null;
  const Icon = ICON_COMPONENTS[iconName];
  if (!Icon) return null;
  return <Icon className={className} />;
}
