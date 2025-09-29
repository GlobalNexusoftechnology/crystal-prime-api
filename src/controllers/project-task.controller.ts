import { Request, Response, NextFunction } from "express";
import { ProjectTaskService } from "../services/project-task.service";
import { createTaskSchema, updateTaskSchema } from "../schemas/project-task.schema";

const service = ProjectTaskService();

export const projectTaskController = () => {
  const createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createTaskSchema.parse(req.body);
      const result = await service.createTask(parsed);
      res.status(201).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  };

  const getAllTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = res?.locals?.user?.id;
      const role = res?.locals?.user?.role?.role;
      const result = await service.getAllTasks(userId, role);
      res.status(200).json({ status: "success", ...result });
    } catch (err) {
      next(err);
    }
  };

  const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getTaskById(id);
      // Attach only project_id inside milestone if available
      let data: any = result;
      if (result?.milestone?.project) {
        const { project, ...milestoneRest } = result.milestone;
        data = {
          id: result.id,
          created_at: result.created_at,
          updated_at: result.updated_at,
          deleted: result.deleted,
          deleted_at: result.deleted_at,
          title: result.title,
          description: result.description,
          due_date: result.due_date,
          status: result.status,
          assigned_to: result.assigned_to,
          milestone: { ...(milestoneRest as any), project }
        };
      }
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  };

  const updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updateTaskSchema.parse(req.body);
      const result = await service.updateTask(id, parsed);
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  };

  const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.deleteTask(id);
      res.status(200).json({ status: "success", message: "Task deleted", data: result });
    } catch (err) {
      next(err);
    }
  };

  return {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
  };
};
