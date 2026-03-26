import {
  type Event, type InsertEvent, events,
  type Place, type InsertPlace, places,
  type UserProfile, type InsertProfile, userProfiles,
  type Favourite, type InsertFavourite, favourites,
  type Sponsor, type InsertSponsor, sponsors,
  type Reaction, type InsertReaction, reactions,
  type Review, type InsertReview, reviews,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, like, inArray } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

// Create tables if they don't exist (needed for fresh deploys like Render)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    venue_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    cost REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'GBP',
    is_free INTEGER NOT NULL DEFAULT 1,
    age_bands TEXT NOT NULL,
    recurring INTEGER NOT NULL DEFAULT 0,
    recurrence_pattern TEXT,
    child_features TEXT NOT NULL DEFAULT '[]',
    external_url TEXT,
    is_featured INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    age_bands TEXT NOT NULL,
    child_features TEXT NOT NULL DEFAULT '[]',
    opening_hours TEXT,
    website TEXT,
    is_featured INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_city TEXT NOT NULL DEFAULT 'Belfast',
    location_lat REAL NOT NULL DEFAULT 54.5973,
    location_lng REAL NOT NULL DEFAULT -5.9301,
    child_name TEXT,
    child_dob TEXT,
    preferred_currency TEXT NOT NULL DEFAULT 'GBP',
    distance_radius INTEGER NOT NULL DEFAULT 5
  );
  CREATE TABLE IF NOT EXISTS sponsors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT NOT NULL,
    website TEXT,
    logo_emoji TEXT NOT NULL DEFAULT '🏪',
    is_active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    session_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    display_name TEXT NOT NULL,
    text TEXT NOT NULL,
    session_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS favourites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER,
    place_id INTEGER
  );
`);

export const db = drizzle(sqlite);

// Haversine distance in miles
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface IStorage {
  // Events
  getEvents(filters: {
    lat?: number; lng?: number; radius?: number;
    ageBands?: string[]; category?: string; day?: string;
    freeOnly?: boolean; search?: string; sort?: string;
  }): Promise<(Event & { distance?: number })[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;

  // Places
  getPlaces(filters: {
    lat?: number; lng?: number; radius?: number;
    ageBands?: string[]; category?: string; search?: string;
  }): Promise<(Place & { distance?: number })[]>;
  getPlace(id: number): Promise<Place | undefined>;
  createPlace(place: InsertPlace): Promise<Place>;

  // Profile
  getProfile(id: number): Promise<UserProfile | undefined>;
  getOrCreateProfile(): Promise<UserProfile>;
  updateProfile(id: number, data: Partial<InsertProfile>): Promise<UserProfile | undefined>;

  // Favourites
  getFavourites(userId: number): Promise<Favourite[]>;
  addFavourite(fav: InsertFavourite): Promise<Favourite>;
  removeFavourite(id: number): Promise<void>;
  isFavourite(userId: number, eventId?: number, placeId?: number): Promise<boolean>;

  // Featured
  getFeatured(lat: number, lng: number): Promise<{ events: (Event & { distance?: number })[]; places: (Place & { distance?: number })[] }>;

  // Sponsors
  getActiveSponsors(): Promise<Sponsor[]>;
  createSponsor(sponsor: InsertSponsor): Promise<Sponsor>;

  // Reactions
  getReactionCounts(eventId: number): Promise<{ beenThere: number; recommend: number }>;
  addReaction(reaction: InsertReaction): Promise<Reaction>;
  hasReacted(eventId: number, sessionId: string, type: string): Promise<boolean>;
  getEventReactionCounts(eventIds: number[]): Promise<Record<number, { beenThere: number; recommend: number }>>;

  // Reviews
  getReviews(eventId: number): Promise<Review[]>;
  addReview(review: InsertReview): Promise<Review>;
}

export class DatabaseStorage implements IStorage {
  async getEvents(filters: {
    lat?: number; lng?: number; radius?: number;
    ageBands?: string[]; category?: string; day?: string;
    freeOnly?: boolean; search?: string; sort?: string;
  }): Promise<(Event & { distance?: number })[]> {
    let allEvents = db.select().from(events).all();

    // Filter by category
    if (filters.category) {
      allEvents = allEvents.filter(e => e.category === filters.category);
    }

    // Filter by age bands
    if (filters.ageBands && filters.ageBands.length > 0) {
      allEvents = allEvents.filter(e => {
        const bands: string[] = JSON.parse(e.ageBands);
        return filters.ageBands!.some(b => bands.includes(b));
      });
    }

    // Filter by free
    if (filters.freeOnly) {
      allEvents = allEvents.filter(e => e.isFree);
    }

    // Filter by day
    if (filters.day) {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const tomorrow = new Date(now.getTime() + 86400000).toISOString().split("T")[0];
      const weekEnd = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];
      const dayOfWeek = now.getDay();
      const saturdayOffset = (6 - dayOfWeek + 7) % 7;
      const saturday = new Date(now.getTime() + saturdayOffset * 86400000).toISOString().split("T")[0];
      const sunday = new Date(now.getTime() + (saturdayOffset + 1) * 86400000).toISOString().split("T")[0];

      // Helper: check if a recurring event falls on a given day number (0=Sun, 6=Sat)
      const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const recursFallsOnDay = (e: Event, targetDayNum: number): boolean => {
        if (!e.recurring || !e.recurrencePattern) return false;
        const pattern = e.recurrencePattern.toLowerCase();
        // Check if pattern mentions the target day name
        if (pattern.includes(DAY_NAMES[targetDayNum])) return true;
        // "Every day" / "Daily" patterns match any day
        if (pattern.includes("every day") || pattern.includes("daily")) return true;
        // "Every week" without a specific day — use the original event date's day
        if (pattern.includes("weekly") || pattern.includes("every week")) {
          const eventDate = new Date(e.date + "T00:00:00");
          return eventDate.getDay() === targetDayNum;
        }
        return false;
      };

      // Helper: check if a recurring event falls on any of the given day numbers
      const recursFallsOnAny = (e: Event, targetDays: number[]): boolean => {
        return targetDays.some(d => recursFallsOnDay(e, d));
      };

      switch (filters.day) {
        case "today":
          allEvents = allEvents.filter(e => e.date === today || recursFallsOnDay(e, dayOfWeek));
          break;
        case "tomorrow": {
          const tomorrowDayNum = (dayOfWeek + 1) % 7;
          allEvents = allEvents.filter(e => e.date === tomorrow || recursFallsOnDay(e, tomorrowDayNum));
          break;
        }
        case "this-week": {
          // Collect the day numbers for the next 7 days
          const weekDays = Array.from({ length: 7 }, (_, i) => (dayOfWeek + i) % 7);
          allEvents = allEvents.filter(e => (e.date >= today && e.date <= weekEnd) || recursFallsOnAny(e, weekDays));
          break;
        }
        case "weekend": {
          allEvents = allEvents.filter(e => (e.date === saturday || e.date === sunday) || recursFallsOnAny(e, [6, 0]));
          break;
        }
      }
    }

    // Filter by search
    if (filters.search) {
      const s = filters.search.toLowerCase();
      allEvents = allEvents.filter(e =>
        e.title.toLowerCase().includes(s) ||
        e.description.toLowerCase().includes(s) ||
        e.venueName.toLowerCase().includes(s) ||
        e.city.toLowerCase().includes(s)
      );
    }

    // Calculate distance and filter by radius
    if (filters.lat !== undefined && filters.lng !== undefined) {
      const radius = filters.radius || 25;
      const withDistance = allEvents.map(e => ({
        ...e,
        distance: haversineDistance(filters.lat!, filters.lng!, e.latitude, e.longitude),
      }));
      const filtered = withDistance.filter(e => e.distance <= radius);
      // Sort: "soonest" by date/time, default is "nearest" by distance
      if (filters.sort === "soonest") {
        return filtered.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        });
      }
      return filtered.sort((a, b) => a.distance - b.distance);
    }

    return allEvents;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return db.select().from(events).where(eq(events.id, id)).get();
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    return db.insert(events).values(event).returning().get();
  }

  async getPlaces(filters: {
    lat?: number; lng?: number; radius?: number;
    ageBands?: string[]; category?: string; search?: string;
  }): Promise<(Place & { distance?: number })[]> {
    let allPlaces = db.select().from(places).all();

    if (filters.category) {
      allPlaces = allPlaces.filter(p => p.category === filters.category);
    }

    if (filters.ageBands && filters.ageBands.length > 0) {
      allPlaces = allPlaces.filter(p => {
        const bands: string[] = JSON.parse(p.ageBands);
        return filters.ageBands!.some(b => bands.includes(b));
      });
    }

    if (filters.search) {
      const s = filters.search.toLowerCase();
      allPlaces = allPlaces.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        p.city.toLowerCase().includes(s)
      );
    }

    if (filters.lat !== undefined && filters.lng !== undefined) {
      const radius = filters.radius || 25;
      const withDistance = allPlaces.map(p => ({
        ...p,
        distance: haversineDistance(filters.lat!, filters.lng!, p.latitude, p.longitude),
      }));
      return withDistance
        .filter(p => p.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
    }

    return allPlaces;
  }

  async getPlace(id: number): Promise<Place | undefined> {
    return db.select().from(places).where(eq(places.id, id)).get();
  }

  async createPlace(place: InsertPlace): Promise<Place> {
    return db.insert(places).values(place).returning().get();
  }

  async getProfile(id: number): Promise<UserProfile | undefined> {
    return db.select().from(userProfiles).where(eq(userProfiles.id, id)).get();
  }

  async getOrCreateProfile(): Promise<UserProfile> {
    const existing = db.select().from(userProfiles).get();
    if (existing) return existing;
    return db.insert(userProfiles).values({}).returning().get();
  }

  async updateProfile(id: number, data: Partial<InsertProfile>): Promise<UserProfile | undefined> {
    const result = db.update(userProfiles).set(data).where(eq(userProfiles.id, id)).returning().get();
    return result;
  }

  async getFavourites(userId: number): Promise<Favourite[]> {
    return db.select().from(favourites).where(eq(favourites.userId, userId)).all();
  }

  async addFavourite(fav: InsertFavourite): Promise<Favourite> {
    return db.insert(favourites).values(fav).returning().get();
  }

  async removeFavourite(id: number): Promise<void> {
    db.delete(favourites).where(eq(favourites.id, id)).run();
  }

  async isFavourite(userId: number, eventId?: number, placeId?: number): Promise<boolean> {
    if (eventId) {
      const f = db.select().from(favourites)
        .where(and(eq(favourites.userId, userId), eq(favourites.eventId, eventId))).get();
      return !!f;
    }
    if (placeId) {
      const f = db.select().from(favourites)
        .where(and(eq(favourites.userId, userId), eq(favourites.placeId, placeId))).get();
      return !!f;
    }
    return false;
  }

  async getFeatured(lat: number, lng: number): Promise<{ events: (Event & { distance?: number })[]; places: (Place & { distance?: number })[] }> {
    const allEvents = db.select().from(events).all().filter(e => e.isFeatured);
    const allPlaces = db.select().from(places).all().filter(p => p.isFeatured);

    const eventsWithDist = allEvents.map(e => ({
      ...e,
      distance: haversineDistance(lat, lng, e.latitude, e.longitude),
    })).sort((a, b) => a.distance - b.distance).slice(0, 6);

    const placesWithDist = allPlaces.map(p => ({
      ...p,
      distance: haversineDistance(lat, lng, p.latitude, p.longitude),
    })).sort((a, b) => a.distance - b.distance).slice(0, 4);

    return { events: eventsWithDist, places: placesWithDist };
  }

  async getActiveSponsors(): Promise<Sponsor[]> {
    return db.select().from(sponsors).where(eq(sponsors.isActive, true)).all();
  }

  async createSponsor(sponsor: InsertSponsor): Promise<Sponsor> {
    return db.insert(sponsors).values(sponsor).returning().get();
  }

  async getReactionCounts(eventId: number): Promise<{ beenThere: number; recommend: number }> {
    const all = db.select().from(reactions).where(eq(reactions.eventId, eventId)).all();
    return {
      beenThere: all.filter(r => r.type === "been_there").length,
      recommend: all.filter(r => r.type === "recommend").length,
    };
  }

  async addReaction(reaction: InsertReaction): Promise<Reaction> {
    return db.insert(reactions).values(reaction).returning().get();
  }

  async hasReacted(eventId: number, sessionId: string, type: string): Promise<boolean> {
    const r = db.select().from(reactions)
      .where(and(eq(reactions.eventId, eventId), eq(reactions.sessionId, sessionId), eq(reactions.type, type))).get();
    return !!r;
  }

  async getEventReactionCounts(eventIds: number[]): Promise<Record<number, { beenThere: number; recommend: number }>> {
    if (eventIds.length === 0) return {};
    const all = db.select().from(reactions).all();
    const result: Record<number, { beenThere: number; recommend: number }> = {};
    for (const id of eventIds) {
      const forEvent = all.filter(r => r.eventId === id);
      result[id] = {
        beenThere: forEvent.filter(r => r.type === "been_there").length,
        recommend: forEvent.filter(r => r.type === "recommend").length,
      };
    }
    return result;
  }

  async getReviews(eventId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.eventId, eventId)).all();
  }

  async addReview(review: InsertReview): Promise<Review> {
    return db.insert(reviews).values(review).returning().get();
  }
}

export const storage = new DatabaseStorage();
