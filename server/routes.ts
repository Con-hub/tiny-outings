import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { CITIES } from "./cities";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed the database on first start
  seedDatabase();

  // Cities list
  app.get("/api/cities", (_req, res) => {
    res.json(CITIES);
  });

  // Profile
  app.get("/api/profile", async (_req, res) => {
    const profile = await storage.getOrCreateProfile();
    res.json(profile);
  });

  app.put("/api/profile", async (req, res) => {
    const profile = await storage.getOrCreateProfile();
    const updated = await storage.updateProfile(profile.id, req.body);
    res.json(updated);
  });

  // Events
  app.get("/api/events", async (req, res) => {
    const { lat, lng, radius, ageBands, category, day, free, search, sort } = req.query;
    const filters: any = {};
    if (lat) filters.lat = parseFloat(lat as string);
    if (lng) filters.lng = parseFloat(lng as string);
    if (radius) filters.radius = parseInt(radius as string);
    if (ageBands) filters.ageBands = (ageBands as string).split(",");
    if (category) filters.category = category as string;
    if (day) filters.day = day as string;
    if (free === "true") filters.freeOnly = true;
    if (search) filters.search = search as string;
    if (sort) filters.sort = sort as string;
    const result = await storage.getEvents(filters);
    res.json(result);
  });

  app.get("/api/events/:id", async (req, res) => {
    const event = await storage.getEvent(parseInt(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  // Places
  app.get("/api/places", async (req, res) => {
    const { lat, lng, radius, ageBands, category, search } = req.query;
    const filters: any = {};
    if (lat) filters.lat = parseFloat(lat as string);
    if (lng) filters.lng = parseFloat(lng as string);
    if (radius) filters.radius = parseInt(radius as string);
    if (ageBands) filters.ageBands = (ageBands as string).split(",");
    if (category) filters.category = category as string;
    if (search) filters.search = search as string;
    const result = await storage.getPlaces(filters);
    res.json(result);
  });

  app.get("/api/places/:id", async (req, res) => {
    const place = await storage.getPlace(parseInt(req.params.id));
    if (!place) return res.status(404).json({ message: "Place not found" });
    res.json(place);
  });

  // Featured
  app.get("/api/featured", async (req, res) => {
    const lat = parseFloat(req.query.lat as string) || 54.5973;
    const lng = parseFloat(req.query.lng as string) || -5.9301;
    const featured = await storage.getFeatured(lat, lng);
    res.json(featured);
  });

  // Favourites
  app.get("/api/favourites", async (_req, res) => {
    const profile = await storage.getOrCreateProfile();
    const favs = await storage.getFavourites(profile.id);
    // Enrich with event/place data
    const enriched = await Promise.all(favs.map(async (f) => {
      if (f.eventId) {
        const event = await storage.getEvent(f.eventId);
        return { ...f, event, place: null };
      }
      if (f.placeId) {
        const place = await storage.getPlace(f.placeId);
        return { ...f, event: null, place };
      }
      return { ...f, event: null, place: null };
    }));
    res.json(enriched);
  });

  app.post("/api/favourites", async (req, res) => {
    const profile = await storage.getOrCreateProfile();
    const { eventId, placeId } = req.body;
    // Check if already favourited
    const exists = await storage.isFavourite(profile.id, eventId, placeId);
    if (exists) return res.status(409).json({ message: "Already favourited" });
    const fav = await storage.addFavourite({ userId: profile.id, eventId, placeId });
    res.json(fav);
  });

  app.delete("/api/favourites/:id", async (req, res) => {
    await storage.removeFavourite(parseInt(req.params.id));
    res.json({ success: true });
  });

  // Sponsors
  app.get("/api/sponsors", async (_req, res) => {
    const activeSponsors = await storage.getActiveSponsors();
    res.json(activeSponsors);
  });

  return httpServer;
}
