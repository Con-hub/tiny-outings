import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  venueName: text("venue_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  cost: real("cost").notNull().default(0),
  currency: text("currency").notNull().default("GBP"),
  isFree: integer("is_free", { mode: "boolean" }).notNull().default(true),
  ageBands: text("age_bands").notNull(),
  recurring: integer("recurring", { mode: "boolean" }).notNull().default(false),
  recurrencePattern: text("recurrence_pattern"),
  childFeatures: text("child_features").notNull().default("[]"),
  externalUrl: text("external_url"),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
});

export const places = sqliteTable("places", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  ageBands: text("age_bands").notNull(),
  childFeatures: text("child_features").notNull().default("[]"),
  openingHours: text("opening_hours"),
  website: text("website"),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
});

export const userProfiles = sqliteTable("user_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  locationCity: text("location_city").notNull().default("Belfast"),
  locationLat: real("location_lat").notNull().default(54.5973),
  locationLng: real("location_lng").notNull().default(-5.9301),
  childName: text("child_name"),
  childDob: text("child_dob"),
  preferredCurrency: text("preferred_currency").notNull().default("GBP"),
  distanceRadius: integer("distance_radius").notNull().default(5),
});

export const sponsors = sqliteTable("sponsors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  category: text("category").notNull(), // e.g. "Baby Shop", "Soft Play", "Café"
  city: text("city").notNull(),
  website: text("website"),
  logoEmoji: text("logo_emoji").notNull().default("🏪"), // simple emoji as placeholder logo
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const reactions = sqliteTable("reactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  type: text("type").notNull(), // "been_there" | "recommend"
  sessionId: text("session_id").notNull(), // anonymous session fingerprint
  createdAt: text("created_at").notNull(),
});

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull(),
  displayName: text("display_name").notNull(), // e.g. "Sarah, mum of 2"
  text: text("text").notNull(),
  sessionId: text("session_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const favourites = sqliteTable("favourites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  eventId: integer("event_id"),
  placeId: integer("place_id"),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertPlaceSchema = createInsertSchema(places).omit({ id: true });
export const insertProfileSchema = createInsertSchema(userProfiles).omit({ id: true });
export const insertFavouriteSchema = createInsertSchema(favourites).omit({ id: true });
export const insertSponsorSchema = createInsertSchema(sponsors).omit({ id: true });
export const insertReactionSchema = createInsertSchema(reactions).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true });

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Place = typeof places.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Favourite = typeof favourites.$inferSelect;
export type InsertFavourite = z.infer<typeof insertFavouriteSchema>;
export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;
export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
