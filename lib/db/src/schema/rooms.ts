import { pgTable, serial, text, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gameType: text("game_type").notNull(),
  minBet: numeric("min_bet", { precision: 15, scale: 2 }).notNull(),
  maxBet: numeric("max_bet", { precision: 15, scale: 2 }).notNull(),
  playerCount: integer("player_count").notNull().default(0),
  maxPlayers: integer("max_players").notNull().default(6),
  status: text("status").notNull().default("waiting"),
  isHot: boolean("is_hot").notNull().default(false),
  isVip: boolean("is_vip").notNull().default(false),
  hasPassword: boolean("has_password").notNull().default(false),
  jackpot: numeric("jackpot", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ id: true, createdAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;
