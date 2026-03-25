export const AGE_BANDS = [
  { id: "baby", label: "Baby", subtitle: "0\u201312 months" },
  { id: "toddler", label: "Toddler", subtitle: "1\u20133 years" },
  { id: "preschooler", label: "Pre-schooler", subtitle: "3\u20135 years" },
] as const;

export const CATEGORIES = [
  { id: "community", label: "Community & Groups", icon: "Users" },
  { id: "classes", label: "Classes & Courses", icon: "GraduationCap" },
  { id: "social", label: "Social & Support", icon: "HeartHandshake" },
  { id: "outdoor", label: "Outdoor & Nature", icon: "TreePine" },
  { id: "storytime", label: "Story Time & Learning", icon: "BookOpen" },
  { id: "arts", label: "Arts & Creative", icon: "Palette" },
  { id: "wellness", label: "Wellness & Fitness", icon: "Dumbbell" },
  { id: "music", label: "Music & Performing", icon: "Music" },
  { id: "daysout", label: "Days Out & Venues", icon: "Ticket" },
  { id: "seasonal", label: "Seasonal & Special", icon: "Star" },
] as const;

export const PLACE_CATEGORIES = [
  { id: "daysout", label: "Days Out", icon: "Ticket" },
  { id: "parks", label: "Parks & Playgrounds", icon: "TreePine" },
  { id: "indoor", label: "Indoor Play", icon: "Blocks" },
  { id: "cafes", label: "Child-Friendly Cafes", icon: "Coffee" },
] as const;

export const CATEGORY_ICON_MAP: Record<string, string> = {
  community: "Users",
  classes: "GraduationCap",
  social: "HeartHandshake",
  outdoor: "TreePine",
  storytime: "BookOpen",
  arts: "Palette",
  wellness: "Dumbbell",
  music: "Music",
  daysout: "Ticket",
  seasonal: "Star",
  parks: "TreePine",
  indoor: "Blocks",
  cafes: "Coffee",
};

export const DAY_FILTERS = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "this-week", label: "This Week" },
  { id: "weekend", label: "Weekend" },
] as const;

export const DISTANCE_OPTIONS = [1, 3, 5, 10, 25, 50] as const;

export const CHILD_FEATURES: Record<string, { label: string }> = {
  "buggy-friendly": { label: "Buggy friendly" },
  "baby-changing": { label: "Baby changing" },
  "breastfeeding-welcome": { label: "Breastfeeding welcome" },
  "parking": { label: "Parking" },
  "highchairs": { label: "Highchairs" },
};

export function getAgeBandInfo(id: string) {
  return AGE_BANDS.find(b => b.id === id);
}

export function getCategoryLabel(id: string) {
  return [...CATEGORIES, ...PLACE_CATEGORIES].find(c => c.id === id)?.label || id;
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return "Nearby";
  if (miles < 1) return `${(miles).toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function formatCost(cost: number, currency: string, isFree: boolean): string {
  if (isFree) return "Free";
  const symbol = currency === "EUR" ? "\u20ac" : "\u00a3";
  return `${symbol}${cost.toFixed(cost % 1 === 0 ? 0 : 2)}`;
}

/** Friendly date formatting: Today, Tomorrow, day name, or "Mon 25 Mar" */
export function formatFriendlyDate(dateStr: string): string {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split("T")[0];

  if (dateStr === todayStr) return "Today";
  if (dateStr === tomorrowStr) return "Tomorrow";

  const date = new Date(dateStr + "T00:00:00");
  const diff = (date.getTime() - now.getTime()) / 86400000;

  // Within the next 6 days, show day name
  if (diff > 0 && diff < 7) {
    return date.toLocaleDateString("en-GB", { weekday: "long" });
  }

  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** Group date header: "Today", "Tomorrow", "Wednesday 26 March", etc. */
export function formatGroupDate(dateStr: string): string {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split("T")[0];

  if (dateStr === todayStr) return "Today";
  if (dateStr === tomorrowStr) return "Tomorrow";

  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

/** Check if event is happening now */
export function isHappeningNow(dateStr: string, startTime: string, endTime: string | null): boolean {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  if (dateStr !== todayStr) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = startTime.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  if (!endTime) return currentMinutes >= startMinutes && currentMinutes <= startMinutes + 120;
  const [eh, em] = endTime.split(":").map(Number);
  const endMinutes = eh * 60 + em;
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/** Check if event is starting within 60 minutes */
export function isStartingSoon(dateStr: string, startTime: string): boolean {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  if (dateStr !== todayStr) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = startTime.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const diff = startMinutes - currentMinutes;
  return diff > 0 && diff <= 60;
}

/** Get next upcoming dates for a recurring event pattern */
export function getNextRecurringDates(pattern: string, count: number = 3): string[] {
  const now = new Date();
  const dates: string[] = [];
  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };
  const patternLower = pattern.toLowerCase();

  // Try to find day name in pattern
  for (const [dayName, dayNum] of Object.entries(dayMap)) {
    if (patternLower.includes(dayName)) {
      let nextDate = new Date(now);
      const currentDay = nextDate.getDay();
      let daysUntil = (dayNum - currentDay + 7) % 7;
      if (daysUntil === 0) daysUntil = 0; // include today
      nextDate.setDate(nextDate.getDate() + daysUntil);
      for (let i = 0; i < count; i++) {
        dates.push(nextDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }));
        nextDate = new Date(nextDate.getTime() + 7 * 86400000);
      }
      return dates;
    }
  }

  // Weekly pattern — just show next 3 weeks from today's day
  if (patternLower.includes("weekly") || patternLower.includes("every week")) {
    let nextDate = new Date(now);
    for (let i = 0; i < count; i++) {
      dates.push(nextDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }));
      nextDate = new Date(nextDate.getTime() + 7 * 86400000);
    }
    return dates;
  }

  return dates;
}
