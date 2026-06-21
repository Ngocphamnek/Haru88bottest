import { Router } from "express";
import { db } from "@workspace/db";
import { roomsTable } from "@workspace/db";

const router = Router();

const GAME_DEFS = [
  { id: "phela", name: "phela", displayName: "Phé Lá", description: "Game bài đặc sắc của PheLa86", minBet: 1000, maxBet: 10000000, icon: "🃏" },
  { id: "taixiu", name: "taixiu", displayName: "Tài Xỉu", description: "Lắc cốc đoán tổng điểm", minBet: 1000, maxBet: 50000000, icon: "🎲" },
  { id: "baucua", name: "baucua", displayName: "Bầu Cua", description: "Cổ điển bầu cua tôm cá", minBet: 1000, maxBet: 10000000, icon: "🦀" },
  { id: "poker", name: "poker", displayName: "Poker", description: "Poker Texas Hold'em", minBet: 10000, maxBet: 100000000, icon: "♠️" },
  { id: "tienlen", name: "tienlen", displayName: "Tiến Lên", description: "Đánh bài tiến lên miền Nam", minBet: 1000, maxBet: 10000000, icon: "🀄" },
];

router.get("/games", async (_req, res) => {
  const rooms = await db.query.roomsTable.findMany();
  const games = GAME_DEFS.map((g) => ({
    ...g,
    activeRooms: rooms.filter((r) => r.gameType === g.id).length,
  }));
  res.json(games);
});

export default router;
