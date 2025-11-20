import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";

export const restrictTo =
  (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user;

    if (!user || !user.role || !allowedRoles.includes(user.role.role.toLowerCase())) {
      return next(
        new AppError(403, "You do not have permission to perform this action")
      );
    }

    next();
  };
