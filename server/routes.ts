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

  // Reactions
  app.get("/api/events/:id/reactions", async (req, res) => {
    const eventId = parseInt(req.params.id);
    const sessionId = (req.query.sessionId as string) || "";
    const counts = await storage.getReactionCounts(eventId);
    const hasBeenThere = sessionId ? await storage.hasReacted(eventId, sessionId, "been_there") : false;
    const hasRecommended = sessionId ? await storage.hasReacted(eventId, sessionId, "recommend") : false;
    res.json({ ...counts, hasBeenThere, hasRecommended });
  });

  app.post("/api/events/:id/reactions", async (req, res) => {
    const eventId = parseInt(req.params.id);
    const { type, sessionId } = req.body;
    if (!type || !sessionId) return res.status(400).json({ message: "type and sessionId required" });
    if (type !== "been_there" && type !== "recommend") return res.status(400).json({ message: "Invalid reaction type" });
    const already = await storage.hasReacted(eventId, sessionId, type);
    if (already) return res.status(409).json({ message: "Already reacted" });
    const reaction = await storage.addReaction({ eventId, type, sessionId, createdAt: new Date().toISOString() });
    const counts = await storage.getReactionCounts(eventId);
    res.json({ reaction, ...counts });
  });

  // Batch reaction counts (for event cards)
  app.get("/api/reaction-counts", async (req, res) => {
    const ids = (req.query.ids as string || "").split(",").map(Number).filter(Boolean);
    const counts = await storage.getEventReactionCounts(ids);
    res.json(counts);
  });

  // Reviews
  app.get("/api/events/:id/reviews", async (req, res) => {
    const eventId = parseInt(req.params.id);
    const eventReviews = await storage.getReviews(eventId);
    res.json(eventReviews);
  });

  app.post("/api/events/:id/reviews", async (req, res) => {
    const eventId = parseInt(req.params.id);
    const { displayName, text, sessionId } = req.body;
    if (!displayName || !text || !sessionId) return res.status(400).json({ message: "displayName, text, and sessionId required" });
    if (text.length > 200) return res.status(400).json({ message: "Review too long (max 200 chars)" });
    const review = await storage.addReview({ eventId, displayName, text, sessionId, createdAt: new Date().toISOString() });
    res.json(review);
  });

  return httpServer;
}
