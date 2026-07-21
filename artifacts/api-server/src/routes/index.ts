import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateRouter from "./generate";
import scriptsRouter from "./scripts";
import trendingRouter from "./trending";

const router: IRouter = Router();

router.use(healthRouter);
router.use(generateRouter);
router.use(scriptsRouter);
router.use(trendingRouter);

export default router;
