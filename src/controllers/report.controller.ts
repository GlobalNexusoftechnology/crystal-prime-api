import { Request, Response, NextFunction } from 'express';
import { getStaffPerformanceReport, exportStaffPerformanceToExcel } from '../services/report.service';
import { StaffPerformanceReport } from '../types/report';

/**
 * Handles GET /api/reports/staff-performance
 * Accepts optional startDate and endDate query params for flexible filtering.
 */
export async function getStaffPerformance(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { startDate, endDate, userId } = req.query;
    // Pass dates as string | undefined to the service for flexible handling
    const report: StaffPerformanceReport = await getStaffPerformanceReport({
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      userId: userId as string | undefined,
    });
      return res.json({
          status: 'success',
          message: 'Staff performance details fetched successfully',
          data: report
      });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles GET /api/reports/staff-performance/export/excel
 * Streams an Excel file with the same filters as the JSON endpoint.
 */
export async function exportStaffPerformanceExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startDate, endDate, userId } = req.query;
    const data = await exportStaffPerformanceToExcel({
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      userId: userId as string | undefined,
    });
    const date = new Date();
    const formattedDate = date.toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=staff_performance_${data.name ?? ""}_${formattedDate}.xlsx`);
    await data.workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
} 