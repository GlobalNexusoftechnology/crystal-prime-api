import { Request, Response, NextFunction } from "express";
import { findUserById, updateUser } from "../services";
import { RoleEnumType } from "../entities/user.entity";
import { uploadToS3 } from "../utils/s3Bucket";

export const updateProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.user.id;
    const role = res.locals.user.role;
    const payload = req.body;
    let image: string | null = null;

    if (req.file) {
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname
      );
      image = uploadResult.url;
    }

    const updatedProfile = await updateUser(userId, role, {...payload, image});

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;
    const profile = await findUserById(user.id);

    if (!profile) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found",
      });
    }

    let filteredProfile;

    if (user.role === RoleEnumType.CUSTOMER) {
      filteredProfile = {
        id: profile.id,
        image: profile.image,
        name: profile.name,
        email: profile.email,
      };
    } else if (user.role === RoleEnumType.ADMIN) {
      filteredProfile = {
        id: profile.id,
        image: profile.image,
        city: profile.city,
        state: profile.state,
        country: profile.country,
      };
    } else {
      return res.status(400).json({ status: "error", message: "Invalid role" });
    }

    return res.status(200).json({
      status: "success",
      data: filteredProfile,
    });
  } catch (error) {
    next(error);
  }
};
