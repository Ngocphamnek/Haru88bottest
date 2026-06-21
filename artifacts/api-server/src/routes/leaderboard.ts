import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/leaderboard", async (_req, res) => {
  const players = await db.query.playersTable.findMany({
    orderBy: [desc(playersTable.wins)],
  });

  const entries = players.map((p, i) => {
    const wins = p.wins ?? 0;
    const losses = p.losses ?? 0;
    const total = wins + losses;
    return {
      rank: i + 1,
      playerId: p.id,
      username: p.username,
      avatar: p.avatar,
      totalWinnings: Number(p.goldCoins),
      gamesPlayed: total,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      level: p.level,
    };
  });

  res.json(entries);
});

router.get("/leaderboard/summary", async (_req, res) => {
  const players = await db.query.playersTable.findMany();
  const totalPlayers = players.length;
  const totalGamesPlayed = players.reduce((s, p) => s + p.wins + p.losses, 0);
  const biggestWin = players.reduce((max, p) => Math.max(max, Number(p.goldCoins)), 0);
  const topPlayer = [...players].sort((a, b) => b.wins - a.wins)[0]?.username ?? "—";

  res.json({ totalPlayers, totalGamesPlayed, biggestWin, topPlayer });
});

export default router;
