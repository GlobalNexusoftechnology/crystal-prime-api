import { Request, Response, NextFunction } from "express";
import { roleService } from "../services/roles.service";
import { CreateRoleSchema, UpdateRoleSchema } from "../schemas/roles.schema";

const service = roleService();

export const roleController = () => {

  // Create Role
  const createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = CreateRoleSchema.parse(req.body);
      const result = await service.createRole(parsedData);
      res.status(201).json({ status: "success", message: "Role created", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Get All Roles
  const getAllRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, page, limit, sortBy, sortOrder } = req.query;

      const result = await service.getAllRoles({
        search: search as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        sortBy: (sortBy as any) || 'created_at',
        sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC',
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Role by ID
  const getRoleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getRoleById(id);
      res.status(200).json({ status: "success", message: "Role fetched by ID", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Update Role
  const updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsedData = UpdateRoleSchema.parse(req.body);
      const result = await service.updateRole(id, parsedData);
      res.status(200).json({ status: "success", message: "Role updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Role
  const softDeleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteRole(id);
      res.status(200).json({ status: "success", message: "Role deleted", data: result });
    } catch (error) {
      next(error);
    }
  };

  return {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    softDeleteRole,
  };
};
