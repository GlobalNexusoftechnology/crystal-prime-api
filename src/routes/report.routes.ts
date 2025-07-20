import { Router } from "express";
import {
  exportStaffPerformanceExcel,
  getProjectPerformanceReportController,
  getStaffPerformance,
  getLeadReportsController,
  getBusinessAnalysisController,
  getPublicDashboardController,
} from "../controllers/report.controller";
import { deserializeUser, requireUser } from "../middleware";

const router = Router();

router.use(deserializeUser, requireUser);

router.get("/staff-performance", getStaffPerformance);

router.get("/staff-performance/export/excel", exportStaffPerformanceExcel);

router.get("/project-performance", getProjectPerformanceReportController);

router.get("/leads", getLeadReportsController);

router.get("/business-analysis", getBusinessAnalysisController);

router.get("/public-dashboard", getPublicDashboardController);

export default router;
