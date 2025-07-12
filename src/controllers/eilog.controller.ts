import { Request, Response, NextFunction } from 'express';
import {
  createEILog,
  getAllEILogs,
  getEILogById,
  updateEILogById,
  deleteEILogById,
} from '../services';

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