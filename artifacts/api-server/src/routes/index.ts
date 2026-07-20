import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateRouter from "./generate";
import scriptsRouter from "./scripts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(generateRouter);
router.use(scriptsRouter);

export default router;
