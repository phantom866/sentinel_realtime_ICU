import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import bedsRouter from "./beds";
import alertsRouter from "./alerts";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patientsRouter);
router.use(bedsRouter);
router.use(alertsRouter);
router.use(dashboardRouter);

export default router;
