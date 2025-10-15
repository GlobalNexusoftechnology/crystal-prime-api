import { Request, Response, NextFunction } from "express";
import * as leaveService from "../services";
import { createLeaveSchema, updateLeaveSchema } from "../schemas";
import { findUserById } from "../services";

export const applyLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = res.locals.user.id;
      const userData = await findUserById(userId);
      const userRole = userData.role.role;  
        
      if (userRole === "Admin") {
        return res.status(403).json({
          status: false,
          message: "Admin cannot apply leaves",
        });
      }
  
      const payload = createLeaveSchema.parse(req.body);
      payload.staffId = userId; 
      const leave = await leaveService.applyLeave(payload);
      res.status(201).json({ status: true, message: "Leave applied", data: leave });
    } catch (err) {
      next(err);
    }
  };
  
  export const updateLeaveStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = updateLeaveSchema.parse(req.body);
      const { id } = req.params;
      const leave = await leaveService.updateLeaveStatus(id, payload);
      res.json({ status: true, message: "Leave status updated", data: leave });
    } catch (err) {
      next(err);
    }
  };

export const getAllLeaves = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leaves = await leaveService.getAllLeaves();
    res.json({ status: true, message: "All leaves fetched", data: leaves });
  } catch (err) {
    next(err);
  }
};

export const getLeavesByStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { staffId } = req.params;
    const leaves = await leaveService.getLeavesByStaff(staffId);
    res.json({ status: true, message: "Staff leaves fetched", data: leaves });
  } catch (err) {
    next(err);
  }
};
