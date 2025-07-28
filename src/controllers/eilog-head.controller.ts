import { Request, Response, NextFunction } from 'express';
import {
  createEILogHead,
  getAllEILogHeads,
  getEILogHeadById,
  updateEILogHeadById,
  deleteEILogHeadById,
} from '../services';

// Handler to create a new EILogHead
export const createEILogHeadHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const eilogHead = await createEILogHead(payload);
    res.status(201).json({
      status: 'success',
      message: `${payload.name} created successfully`,
      data: eilogHead,
    });
  } catch (err) {
    next(err);
  }
};

// Handler to get all EILogHeads
export const getAllEILogHeadsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const filters = {
      page,
      limit
    };

    const result = await getAllEILogHeads(filters);
    res.status(200).json({
      status: 'success',
      message: 'EI Log Heads fetched successfully',
      data: { list: result.data, pagination: result.pagination },
    });
  } catch (err) {
    next(err);
  }
};

// Handler to get a single EILogHead by ID
export const getEILogHeadByIdHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const eilogHead = await getEILogHeadById(id);
    res.status(200).json({
      status: 'success',
      message: 'EI Log Head fetched successfully',
      data: eilogHead,
    });
  } catch (err) {
    next(err);
  }
};

// Handler to update an existing EILogHead by ID
export const updateEILogHeadHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await updateEILogHeadById(id, updates);
    res.status(200).json({
      status: 'success',
      message: 'EI Log Head updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// Handler to soft delete an EILogHead by ID
export const deleteEILogHeadHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await deleteEILogHeadById(id);
    res.status(200).json({
      status: 'success',
      message: 'EI Log Head deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}; 