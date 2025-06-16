import { Request, Response, NextFunction } from "express";
import { ProjectTaskMasterService } from "../services/task-master.service";
import {
    createProjectTaskMasterSchema,
    updateProjectTaskMasterSchema,
} from "../schemas/task-master.schema";

const service = ProjectTaskMasterService();

export const projectTaskMasterController = () => {
    //  Create Task
    const createTaskController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = createProjectTaskMasterSchema.parse(req.body);
            const result = await service.createTaskService(parsed);
            res.status(201).json({
                status: 'success',
                message: 'Task created successfully',
                data: result,
            });
        } catch (err) {
            next(err);
        }
    };

    //  Get All Tasks
    const getAllTasksController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await service.getAllTasksService();
            res.status(200).json({
                status: 'success',
                message: 'All tasks fetched successfully',
                data: result.data,
                total: result.total,
            });
        } catch (err) {
            next(err);
        }
    };

    //  Get Task By ID
    const getTaskByIdController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await service.getTaskByIdService(req.params.id);
            res.status(200).json({
                status: 'success',
                message: 'Task fetched successfully',
                data: result,
            });
        } catch (err) {
            next(err);
        }
    };

    //  Update Task
    const updateTaskController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = updateProjectTaskMasterSchema.parse(req.body);
            const result = await service.updateTaskService(req.params.id, parsed);
            res.status(200).json({
                status: 'success',
                message: 'Task updated successfully',
                data: result,
            });
        } catch (err) {
            next(err);
        }
    };

    //  Soft Delete Task
    const deleteTaskController = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await service.deleteTaskService(req.params.id);
            res.status(200).json({
                status: 'success',
                message: 'Task deleted successfully',
                data: result,
            });
        } catch (err) {
            next(err);
        }
    };

    return {
        createTaskController,
        getAllTasksController,
        getTaskByIdController,
        updateTaskController,
        deleteTaskController,
    };
};
