import { Router } from "express";
import { db } from "@workspace/db";
import { roomsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function formatRoom(r: typeof roomsTable.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    gameType: r.gameType,
    minBet: Number(r.minBet),
    maxBet: Number(r.maxBet),
    playerCount: r.playerCount,
    maxPlayers: r.maxPlayers,
    status: r.status,
    isHot: r.isHot,
    isVip: r.isVip,
    hasPassword: r.hasPassword,
    jackpot: r.jackpot != null ? Number(r.jackpot) : null,
  };
}

router.get("/rooms", async (req, res) => {
  const { gameType } = req.query as { gameType?: string };
  let rooms = await db.query.roomsTable.findMany();
  if (gameType && gameType !== "all") {
    rooms = rooms.filter((r) => r.gameType === gameType);
  }
  res.json(rooms.map(formatRoom));
});

router.post("/rooms", async (req, res) => {
  const body = req.body as { name: string; gameType: string; minBet: number; maxBet: number; maxPlayers?: number };
  const [room] = await db.insert(roomsTable).values({
    name: body.name,
    gameType: body.gameType,
    minBet: String(body.minBet),
    maxBet: String(body.maxBet),
    maxPlayers: body.maxPlayers ?? 6,
  }).returning();
  res.status(201).json(formatRoom(room));
});

router.get("/rooms/featured", async (_req, res) => {
  const rooms = await db.query.roomsTable.findMany({ where: eq(roomsTable.isHot, true) });
  res.json(rooms.map(formatRoom));
});

router.get("/rooms/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const room = await db.query.roomsTable.findFirst({ where: eq(roomsTable.id, id) });
  if (!room) { res.status(404).json({ error: "Room not found" }); return; }
  res.json(formatRoom(room));
});

router.get("/lobby/stats", async (_req, res) => {
  const rooms = await db.query.roomsTable.findMany();
  const activeRooms = rooms.length;
  const jackpotTotal = rooms.reduce((s, r) => s + (r.jackpot ? Number(r.jackpot) : 0), 0);
  res.json({
    onlinePlayers: Math.floor(Math.random() * 500) + 200,
    activeRooms,
    jackpotTotal,
    totalGamesToday: Math.floor(Math.random() * 5000) + 1000,
  });
});

export default router;
