import { Request, Response, NextFunction } from "express";
import { findAllUsers, findUserById, softDeleteUser, updateUser, } from "../services";
import { RoleEnumType } from "../entities/user.entity";

//update profile
export const updateProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.user.id;
    const role = res.locals.user.role;
    const payload = req.body;

    // Update user profile without image handling
    const updatedUser = await updateUser(userId, role, payload);

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// getProfile
export const getProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;
    const profile = await findUserById(user.id);

    if (!profile || profile.deleted) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found",
      });
    }

    // Base filtered data for all roles
    let filteredProfile: any = {
      id: profile.id,
      email: profile.email,
      // number: profile.number,
      dob: profile.dob,

      role: profile.role,
    };

    // Additional fields by role
    if (user.role === RoleEnumType.DEVELOPER) {
      filteredProfile.first_name = profile.first_name;
      filteredProfile.last_name = profile.last_name;
      filteredProfile.role_id = profile.role_id;
    } else if (user.role === RoleEnumType.ADMIN) {

      filteredProfile.role_id = profile.role_id;

    }

    return res.status(200).json({
      status: "success",
      data: filteredProfile,
    });
  } catch (error) {
    next(error);
  }
};

// Get all users
export const getAllUsersHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await findAllUsers();
    res.status(200).json({ status: "success", data: users });
  } catch (error) {
    next(error);
  }
};

// Soft delete user
export const softDeleteUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await softDeleteUser(req.params.id);
    res.status(200).json({
      status: "success",
      message: "User soft-deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


