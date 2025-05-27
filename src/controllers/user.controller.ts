import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

import { findAllUsers, findUserById, softDeleteUser, updateUser, createUser, exportUsersToExcel, findUserByEmail, findUserByPhoneNumber } from "../services/user.service";
import { createUserSchema, updateUserSchema } from "../schemas/user.schema";

// create user
export const createUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = createUserSchema.parse({ body: req.body });
    const { email, first_name, last_name, password, role_id, dob, phone_number } = validated.body;

    // Check if user already exists by email
    const existingUserByEmail = await findUserByEmail({ email });
    if (existingUserByEmail) {
      return res.status(409).json({
        status: "fail",
        message: "User with that email already exists",
      });
    }

    // Check if phone number is provided
    if (phone_number) {
      const existingUserByPhone = await findUserByPhoneNumber({ phone_number });
      if (existingUserByPhone) {
        return res.status(409).json({
          status: "fail",
          message: "User with that phone number already exists",
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare user data
    const userData = {
      email,
      first_name,
      last_name,
      dob,
      password: hashedPassword,
      role_id,
      verificationCode: null,
      verified: true,
      phone_number,
    };

    // Create user
    const newUser = await createUser(userData);

    res.status(201).json({
      status: "success",
      message: "User created successfully.",
      data: newUser,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        status: "fail",
        message: "Validation failed",
        errors: error.errors,
      });
    }

    next(error);
  }
};

//update profile
export const updateProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const validated = updateUserSchema.parse({ body: req.body });
    const payload = validated.body;

    const { email, phone_number } = payload;

    // Check if email is already used by another user
    if (email) {
      const existingUserByEmail = await findUserByEmail({ email });
      if (existingUserByEmail && existingUserByEmail.id !== userId) {
        return res.status(409).json({
          status: "fail",
          message: "Email is already in use by another user",
        });
      }
    }

    // Check if phone number is already used by another user
    if (phone_number) {
      const existingUserByPhone = await findUserByPhoneNumber({ phone_number });
      if (existingUserByPhone && existingUserByPhone.id !== userId) {
        return res.status(409).json({
          status: "fail",
          message: "Phone number is already in use by another user",
        });
      }
    }

    // Update user profile
    const updatedUser = await updateUser(userId, payload);

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// getProfileById
export const getProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    // Fetch user by ID
    const profile = await findUserById(userId);

    // If user doesn't exist or is soft deleted
    if (!profile || profile.deleted) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found",
      });
    }

    const filteredProfile = {
      id: profile.id,
      email: profile.email,
      phone_number: profile.phone_number,
      dob: profile.dob,
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      first_name: profile.first_name,
      last_name: profile.last_name,
    };

    // Return filtered profile
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

// Export users to Excel
export const exportUsersExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workbook = await exportUsersToExcel(); // call to service

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=leads_${Date.now()}.xlsx`
    )

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error exporting users:", error);
    res.status(500).json({ status: "error", message: "Failed to export user data" });
  }
};



