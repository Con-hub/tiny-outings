import {
  type Event, type InsertEvent, events,
  type Place, type InsertPlace, places,
  type UserProfile, type InsertProfile, userProfiles,
  type Favourite, type InsertFavourite, favourites,
  type Sponsor, type InsertSponsor, sponsors,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, like, inArray } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");
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

      switch (filters.day) {
        case "today":
          allEvents = allEvents.filter(e => e.date === today || e.recurring);
          break;
        case "tomorrow":
          allEvents = allEvents.filter(e => e.date === tomorrow || e.recurring);
          break;
        case "this-week":
          allEvents = allEvents.filter(e => (e.date >= today && e.date <= weekEnd) || e.recurring);
          break;
        case "weekend":
          allEvents = allEvents.filter(e => (e.date === saturday || e.date === sunday) || e.recurring);
          break;
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
}

export const storage = new DatabaseStorage();
