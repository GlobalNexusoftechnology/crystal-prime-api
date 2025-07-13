import { Request, Response, NextFunction } from 'express';
import {
  createEILog,
  getAllEILogs,
  getEILogById,
  updateEILogById,
  deleteEILogById,
  exportEILogsToExcel,
  generateEILogTemplate,
  uploadEILogsFromExcelService,
  getEILogStats,
  getEILogChartData,
} from '../services';
import { findUserById } from '../services/user.service';
import { AppError, uploadToCloudinary } from '../utils';

// Handler to create a new EILog
export const createEILogHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const userId = res.locals?.user?.id;
    
    // Handle file upload if present
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        "eilog-attachments"
      );
      payload.attachment = uploadResult.url;
    }
    
    const eilog = await createEILog(payload, userId);
    res.status(201).json({
      status: 'success',
      message: 'EILog created successfully',
      data: eilog,
    });
  } catch (err) {
    next(err);
  }
};

// Handler to get all EILogs (with advanced filters)
export const getAllEILogsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Query parameters received:', req.query); // Debug log
    
    const userId = res?.locals?.user?.id;
    const role = res?.locals?.user?.role?.role;
    const searchText = req.query.searchText as string | undefined;
    const eilogTypeId = req.query.eilogTypeId as string | undefined || req.query.eilogType as string | undefined || req.query.typeId as string | undefined;
    const eilogHeadId = req.query.eilogHeadId as string | undefined || req.query.eilogHead as string | undefined || req.query.headId as string | undefined;
    const paymentMode = req.query.paymentMode as string | undefined;
    const dateRange = req.query.dateRange as ("All" | "Daily" | "Weekly" | "Monthly") | undefined;
    const referenceDate = req.query.referenceDate ? new Date(req.query.referenceDate as string) : undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
    const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
    const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;
    const transactionType = req.query.transactionType as ("income" | "expense" | "both") | undefined;
    const createdById = req.query.createdById as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    console.log('Processed filters:', { eilogTypeId, eilogHeadId, paymentMode }); // Debug log

    let result;

    if (role === "Admin" || role === "admin") {
      result = await getAllEILogs({
        searchText,
        eilogTypeId,
        eilogHeadId,
        paymentMode,
        dateRange,
        referenceDate,
        fromDate,
        toDate,
        minAmount,
        maxAmount,
        transactionType,
        createdById,
        page,
        limit
      }, userId);
    } else {
      result = await getAllEILogs({
        searchText,
        eilogTypeId,
        eilogHeadId,
        paymentMode,
        dateRange,
        referenceDate,
        fromDate,
        toDate,
        minAmount,
        maxAmount,
        transactionType,
        page,
        limit
      }, userId); // Non-admins can only see their own logs
    }

    const eilogStats = await getEILogStats(userId);

    res.status(200).json({
      status: 'success',
      message: 'EILogs fetched successfully',
      data: { list: result, stats: eilogStats },
    });
  } catch (err) {
    next(err);
  }
};

// Handler to get a single EILog by ID
export const getEILogByIdHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = res.locals?.user?.id;
    const role = res.locals?.user?.role?.role;
    const eilog = await getEILogById(id, userId, role);
    res.status(200).json({
      status: 'success',
      message: 'EILog fetched successfully',
      data: eilog,
    });
  } catch (err) {
    next(err);
  }
};

// Handler to update an existing EILog by ID
export const updateEILogHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = res.locals?.user?.id;
    const role = res.locals?.user?.role?.role;
    // Handle file upload if present
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        "eilog-attachments"
      );
      updates.attachment = uploadResult.url;
    }
    const updated = await updateEILogById(id, updates, userId, role);
    res.status(200).json({
      status: 'success',
      message: 'EILog updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// Handler to soft delete an EILog by ID
export const deleteEILogHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = res.locals?.user?.id;
    const role = res.locals?.user?.role?.role;
    await deleteEILogById(id, userId, role);
    res.status(200).json({
      status: 'success',
      message: 'EILog deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// Handler to export EILogs to Excel
export const exportEILogsToExcelHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals?.user?.id;
    const role = res.locals?.user?.role?.role;
    const filters = req.query;

    const workbook = await exportEILogsToExcel(userId, role, filters);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=eilogs_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// Handler to download EILog template
export const downloadEILogTemplateHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workbook = await generateEILogTemplate();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=eilogs_template.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// Handler to upload EILogs from Excel
export const uploadEILogsFromExcelHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "No file uploaded" });
    }

    const result = await uploadEILogsFromExcelService(
      req.file.buffer,
      user
    );
    res.status(201).json({
      status: "success",
      message: "EILogs uploaded successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}; 

export const uploadSingleFileToCloudinary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file as Express.Multer.File

    if (!file) {
      return res.status(400).json({
        status: "error",
        message: "No file provided in the request",
      })
    }

    const uploadResult = await uploadToCloudinary(
      file.buffer,
      file.originalname,
      "uploads" // or any folder name
    )

    return res.status(200).json({
      status: "success",
      message: "File uploaded successfully",
      data: {
        docUrl: uploadResult.url,
        fileType: req.file?.mimetype,
        fileName: req.file?.originalname,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    next(
      new AppError(
        500,
        "An error occurred while uploading the file. Please try again later."
      )
    )
  }
}

// Handler to get EILog chart data for dashboard
export const getEILogChartDataHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals?.user?.id;
    const role = res.locals?.user?.role?.role;
    const view = (req.query.view as 'monthly' | 'yearly' | 'weekly') || 'monthly';
    // Only admin can filter by userId
    const filterUserId = (role === 'admin' || role === 'Admin') ? (req.query.userId as string | undefined) : undefined;
    const data = await getEILogChartData(userId, role, view, filterUserId);
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};