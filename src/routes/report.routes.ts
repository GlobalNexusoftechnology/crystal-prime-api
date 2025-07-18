import { Router } from 'express';
import { exportStaffPerformanceExcel, getStaffPerformance } from '../controllers/report.controller';
import { deserializeUser, requireUser } from '../middleware';

const router = Router();

router.use(deserializeUser, requireUser);

router.get('/staff-performance', getStaffPerformance);

router.get('/staff-performance/export/excel', exportStaffPerformanceExcel);

export default router; 