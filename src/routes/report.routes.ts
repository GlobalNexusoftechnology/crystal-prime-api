import { Router } from "express";
import {
  exportStaffPerformanceExcel,
  getProjectPerformanceReportController,
  getStaffPerformance,
  getLeadReportsController,
  getBusinessAnalysisController,
  getPublicDashboardController,
  exportProjectPerformanceExcelController,
  exportLeadReportExcelController,
  exportBusinessAnalysisExcelController,
  exportPublicDashboardExcelController,
} from "../controllers/report.controller";
import { deserializeUser, requireUser } from "../middleware";

const router = Router();

router.use(deserializeUser, requireUser);

router.get("/staff-performance", getStaffPerformance);
router.get("/staff-performance/export/excel", exportStaffPerformanceExcel);

router.get("/project-performance", getProjectPerformanceReportController);
router.get(
  "/project-performance/export/excel",
  exportProjectPerformanceExcelController
);

router.get("/leads", getLeadReportsController);
router.get("/leads/export/excel", exportLeadReportExcelController);

router.get("/business-analysis", getBusinessAnalysisController);
router.get(
  "/business-analysis/export/excel",
  exportBusinessAnalysisExcelController
);

router.get("/public-dashboard", getPublicDashboardController);
router.get(
  "/public-dashboard/export/excel",
  exportPublicDashboardExcelController
);

export default router;
