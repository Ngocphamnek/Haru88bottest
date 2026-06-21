import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_PLAYER_ID = 1;

function formatPlayer(p: typeof playersTable.$inferSelect) {
  const wins = p.wins ?? 0;
  const losses = p.losses ?? 0;
  const total = wins + losses;
  return {
    id: p.id,
    username: p.username,
    balance: Number(p.balance),
    goldCoins: Number(p.goldCoins),
    level: p.level,
    vipLevel: p.vipLevel,
    avatar: p.avatar,
    wins,
    losses,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    joinedAt: p.joinedAt.toISOString(),
  };
}

router.get("/players/me", async (req, res) => {
  let player = await db.query.playersTable.findFirst({
    where: eq(playersTable.id, DEFAULT_PLAYER_ID),
  });
  if (!player) {
    const [created] = await db.insert(playersTable).values({
      username: "Người chơi",
      balance: "1000000",
      goldCoins: "5000",
      level: 1,
      vipLevel: 0,
      wins: 0,
      losses: 0,
    }).returning();
    player = created;
  }
  res.json(formatPlayer(player));
});

router.patch("/players/me", async (req, res) => {
  const { username, avatar } = req.body as { username?: string; avatar?: string };
  const [updated] = await db.update(playersTable)
    .set({ ...(username ? { username } : {}), ...(avatar ? { avatar } : {}) })
    .where(eq(playersTable.id, DEFAULT_PLAYER_ID))
    .returning();
  if (!updated) { res.status(404).json({ error: "Player not found" }); return; }
  res.json(formatPlayer(updated));
});

router.get("/players", async (_req, res) => {
  const players = await db.query.playersTable.findMany();
  res.json(players.map(formatPlayer));
});

export default router;
