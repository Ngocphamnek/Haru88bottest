import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, playersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();
const DEFAULT_PLAYER_ID = 1;

function formatTx(t: typeof transactionsTable.$inferSelect) {
  return {
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    description: t.description,
  };
}

router.get("/transactions", async (_req, res) => {
  const txs = await db.query.transactionsTable.findMany({
    where: eq(transactionsTable.playerId, DEFAULT_PLAYER_ID),
    orderBy: [desc(transactionsTable.createdAt)],
  });
  res.json(txs.map(formatTx));
});

router.post("/transactions", async (req, res) => {
  const { type, amount } = req.body as { type: string; amount: number };
  if (!amount || amount <= 0) { res.status(400).json({ error: "Invalid amount" }); return; }

  const [tx] = await db.insert(transactionsTable).values({
    playerId: DEFAULT_PLAYER_ID,
    type,
    amount: String(amount),
    status: "completed",
    description: type === "deposit"
      ? `Nạp ${amount.toLocaleString("vi-VN")} đ`
      : `Rút ${amount.toLocaleString("vi-VN")} đ`,
  }).returning();

  if (type === "deposit") {
    await db.update(playersTable)
      .set({ balance: sql`${playersTable.balance} + ${String(amount)}` })
      .where(eq(playersTable.id, DEFAULT_PLAYER_ID));
  } else if (type === "withdrawal") {
    await db.update(playersTable)
      .set({ balance: sql`GREATEST(0, ${playersTable.balance} - ${String(amount)})` })
      .where(eq(playersTable.id, DEFAULT_PLAYER_ID));
  }

  res.status(201).json(formatTx(tx));
});

export default router;
