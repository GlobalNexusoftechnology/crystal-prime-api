import { Request, Response, NextFunction } from "express";
import * as workRequestService from "../services/work-request.service";

export const createWorkRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.user.id;
    const { requestDate, date, reason } = req.body;

    const workRequest = await workRequestService.createWorkRequest(
      userId,
      requestDate || date,
      reason
    );

    res.status(201).json({
      status: "success",
      message: "Work request created successfully",
      data: workRequest,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllWorkRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;
    const { status, staffId } = req.query;

    let filterStaffId = staffId;
    
    // If user is not admin, they can only see their own requests
    if (user.role?.role?.toLowerCase() !== 'admin') {
        filterStaffId = user.id;
    }

    const requests = await workRequestService.getAllWorkRequests({
      status,
      staffId: filterStaffId,
    });

    res.status(200).json({
      status: "success",
      message: "Work requests fetched successfully",
      data: requests,
    });
  } catch (err) {
    next(err);
  }
};

export const updateWorkRequestStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestId } = req.params;
    const { status, adminRemark } = req.body;

    const workRequest = await workRequestService.updateWorkRequestStatus(
      requestId,
      status,
      adminRemark
    );

    res.status(200).json({
      status: "success",
      message: `Work request ${status.toLowerCase()} successfully`,
      data: workRequest,
    });
  } catch (err) {
    next(err);
  }
};
