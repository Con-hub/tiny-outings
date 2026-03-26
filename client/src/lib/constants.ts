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

/** Get the next occurrence date string (YYYY-MM-DD) for a recurring event.
 * If the event isn't recurring or pattern can't be parsed, returns the original date. */
export function getNextOccurrenceDate(event: { date: string; recurring: boolean; recurrencePattern?: string | null }): string {
  if (!event.recurring || !event.recurrencePattern) return event.date;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  // If the stored date is today or in the future, use it directly
  if (event.date >= todayStr) return event.date;

  const pattern = event.recurrencePattern.toLowerCase();
  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };

  // Find the target day from the pattern
  let targetDay = -1;
  for (const [name, num] of Object.entries(dayMap)) {
    if (pattern.includes(name)) { targetDay = num; break; }
  }
  // Fallback: derive from the original event date
  if (targetDay === -1) {
    targetDay = new Date(event.date + "T00:00:00").getDay();
  }

  // Calculate next occurrence (today or future)
  const currentDay = now.getDay();
  let daysUntil = (targetDay - currentDay + 7) % 7;
  // If it's today's day, include today
  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + daysUntil);
  return nextDate.toISOString().split("T")[0];
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

/** Generate an .ics calendar file string for an event */
export function generateICS(event: { title: string; description: string; date: string; startTime: string; endTime?: string | null; venueName: string; address: string }): string {
  const dtStart = event.date.replace(/-/g, "") + "T" + event.startTime.replace(":", "") + "00";
  const dtEnd = event.endTime
    ? event.date.replace(/-/g, "") + "T" + event.endTime.replace(":", "") + "00"
    : event.date.replace(/-/g, "") + "T" + String(Number(event.startTime.split(":")[0]) + 1).padStart(2, "0") + event.startTime.split(":")[1] + "00";
  const uid = `tiny-outings-${event.date}-${event.startTime}-${Math.random().toString(36).slice(2, 8)}@tinyoutings.app`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tiny Outings//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.slice(0, 200).replace(/[\n,;]/g, " ")}`,
    `LOCATION:${event.venueName}\\, ${event.address}`,
    `UID:${uid}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Download a string as a file */
export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Pick the single best badge for an event card */
export function pickCardBadge(event: { isFree: boolean; category: string; childFeatures: string }): { label: string; className: string } | null {
  const features: string[] = JSON.parse(event.childFeatures);
  // Priority order: Free, Indoor (by category), Baby-friendly, Buggy-friendly
  if (event.isFree) return { label: "Free", className: "bg-primary/10 text-primary" };
  const indoorCats = ["classes", "community", "arts", "music", "storytime", "indoor"];
  if (indoorCats.includes(event.category)) return { label: "Indoor", className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" };
  if (features.includes("buggy-friendly")) return { label: "Buggy friendly", className: "bg-accent text-accent-foreground" };
  if (features.includes("baby-changing")) return { label: "Baby-friendly", className: "bg-accent text-accent-foreground" };
  return null;
}

/** Helper sentence for event context */
export function getHelperSentence(event: { category: string; isFree: boolean; childFeatures: string; recurring: boolean }): string {
  const features: string[] = JSON.parse(event.childFeatures);
  const indoor = ["classes", "community", "arts", "music", "storytime", "indoor"].includes(event.category);
  const hasBuggy = features.includes("buggy-friendly");
  const hasBreastfeeding = features.includes("breastfeeding-welcome");
  
  if (indoor && hasBuggy) return "Great for a rainy day. Buggy friendly.";
  if (indoor && hasBreastfeeding) return "Indoor session. Breastfeeding welcome.";
  if (indoor) return "Indoor event — good for any weather.";
  if (event.category === "outdoor" && hasBuggy) return "Good with a pram. Outdoor activity.";
  if (event.category === "outdoor") return "Outdoor activity — dress for the weather.";
  if (event.category === "wellness") return "A little time for you, too.";
  if (event.recurring) return "Runs regularly — a great one to get into.";
  if (event.isFree) return "Free to attend. No booking needed.";
  return "";
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
