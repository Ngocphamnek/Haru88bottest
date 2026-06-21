import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import roomsRouter from "./rooms";
import leaderboardRouter from "./leaderboard";
import transactionsRouter from "./transactions";
import gamesRouter from "./games";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(roomsRouter);
router.use(leaderboardRouter);
router.use(transactionsRouter);
router.use(gamesRouter);

export default router;
