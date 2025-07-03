import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";

const router = Router();
const controller = dashboardController();

router.get("/summary", controller.getDashboardSummary);

export default router; 