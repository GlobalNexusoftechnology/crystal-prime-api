import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt';
import { AppDataSource } from '../utils/data-source';
import { User } from '../entities/user.entity';
import AppError from '../utils/appError';

const userRepository = AppDataSource.getRepository(User);

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1) Check if token exists
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new AppError(401, 'You are not logged in'));
    }

    // 2) Verify token
    const decoded = verifyJwt<{ id: string }>(token, 'accessTokenPublicKey');
    if (!decoded) {
      return next(new AppError(401, 'Invalid token or user no longer exists'));
    }

    // 3) Check if user still exists
    const user = await userRepository.findOne({ where: { id: decoded.id } });
    if (!user) {
      return next(new AppError(401, 'User no longer exists'));
    }

    // 4) Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}; 