import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { deserializeUser, requireUser } from "../middleware";

const router = Router();
const controller = dashboardController();

router.use(deserializeUser, requireUser);

router.get("/summary", controller.getDashboardSummary);

export default router; 