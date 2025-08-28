import { Request, Response, NextFunction } from 'express';
import { getStaffPerformanceReport, exportStaffPerformanceToExcel, getProjectPerformanceReport, getLeadReports, getBusinessAnalysisReport, getPublicDashboardReport, exportProjectPerformanceReportToExcel, exportLeadReportToExcel, exportBusinessAnalysisReportToExcel, exportPublicDashboardReportToExcel } from '../services/report.service';
import { StaffPerformanceReport } from '../types/report';
import { ProjectPerformanceReport } from '../types/report';
import { LeadReportsParams, BusinessAnalysisParams } from '../types/report';

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

/**
 * Handles GET /api/reports/project-performance
 * Accepts projectId and clientId as query params. Returns unified project report.
 */
export async function getProjectPerformanceReportController(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { projectId, clientId } = req.query;
    const report: ProjectPerformanceReport = await getProjectPerformanceReport({
      projectId: projectId as string | undefined,
      clientId: clientId as string | undefined,
    });
    return res.json({
      status: 'success',
      message: 'Project performance report fetched successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles GET /api/reports/leads
 * Accepts optional fromDate, toDate, userId, sourceId, statusId, typeId query params for flexible filtering.
 */
export async function getLeadReportsController(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { fromDate, toDate } = req.query;
    
    const report = await getLeadReports({
      fromDate: fromDate as string | undefined,
      toDate: toDate as string | undefined,
    });

    return res.json({
      status: 'success',
      message: 'Lead reports fetched successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
} 

/**
 * Handles GET /api/reports/business-analysis
 * Accepts optional fromDate, toDate, userId query params for flexible filtering.
 */
export async function getBusinessAnalysisController(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { fromDate, toDate, userId } = req.query;
    
    // Get current user info for role-based filtering
    const currentUser = res?.locals?.user;
    const currentUserId = currentUser?.id;
    const currentUserRole = currentUser?.role?.role;

    // For non-admin users, force userId to be their own ID
    const filteredUserId = (currentUserRole === 'admin' || currentUserRole === 'Admin') 
      ? (userId as string | undefined) 
      : currentUserId;

    const report = await getBusinessAnalysisReport({
      fromDate: fromDate as string | undefined,
      toDate: toDate as string | undefined,
      userId: filteredUserId,
    });

    return res.json({
      status: 'success',
      message: 'Business analysis report fetched successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
} 

/**
 * Handles GET /api/reports/public-dashboard
 * Accepts optional fromDate and toDate query params for filtering.
 */
export async function getPublicDashboardController(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { fromDate, toDate } = req.query;
    const report = await getPublicDashboardReport({
      fromDate: fromDate as string | undefined,
      toDate: toDate as string | undefined,
    });
    return res.json({
      status: 'success',
      message: 'Public dashboard report fetched successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
} 

export async function exportProjectPerformanceExcelController(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, clientId, fromDate, toDate } = req.query;
    const { workbook, name } = await exportProjectPerformanceReportToExcel({ projectId, clientId, fromDate, toDate });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${name}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
}

export async function exportLeadReportExcelController(req: Request, res: Response, next: NextFunction) {
  try {
    const { fromDate, toDate, userId, sourceId, statusId, typeId } = req.query;
    const { workbook, name } = await exportLeadReportToExcel({ fromDate, toDate, userId, sourceId, statusId, typeId });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${name}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
}

export async function exportBusinessAnalysisExcelController(req: Request, res: Response, next: NextFunction) {
  try {
    const { fromDate, toDate } = req.query;
    const { workbook, name } = await exportBusinessAnalysisReportToExcel({ fromDate, toDate });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${name}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
}

export async function exportPublicDashboardExcelController(req: Request, res: Response, next: NextFunction) {
  try {
    const { fromDate, toDate } = req.query;
    const { workbook, name } = await exportPublicDashboardReportToExcel({ fromDate, toDate });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${name}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
} 