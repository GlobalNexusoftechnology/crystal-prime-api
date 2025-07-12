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
} from '../services';
import { findUserById } from '../services/user.service';

// Handler to create a new EILog
export const createEILogHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const userId = res.locals?.user?.id
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

// Handler to get all EILogs (with filters)
export const getAllEILogsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = req.query;
    const userId = res.locals?.user?.id
    const eilogs = await getAllEILogs(filters, userId);
    res.status(200).json({
      status: 'success',
      message: 'EILogs fetched successfully',
      data: eilogs,
    });
  } catch (err) {
    next(err);
  }
};

// Handler to get a single EILog by ID
export const getEILogByIdHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = res.locals?.user?.id
    const eilog = await getEILogById(id, userId);
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
    const userId = res.locals?.user?.id
    const updated = await updateEILogById(id, updates, userId);
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
    const userId = res.locals?.user?.id
    await deleteEILogById(id, userId);
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
    const userData = await findUserById(userId);
    const filters = req.query;

    const workbook = await exportEILogsToExcel(userId, filters);

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