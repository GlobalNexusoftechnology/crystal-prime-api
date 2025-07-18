import { Request, Response } from "express";
import { TaskCommentService } from "../services/task-comment.service";
import { createTaskCommentSchema, updateTaskCommentSchema, getTaskCommentsSchema } from "../schemas/task-comment.schema";
import AppError from "../utils/appError";

const taskCommentService = TaskCommentService();

export const TaskCommentController = () => {
    const createTaskComment = async (req: Request, res: Response) => {
        try {
            const validatedData = createTaskCommentSchema.parse(req);
            const taskComment = await taskCommentService.createTaskComment(validatedData.body);
            
            res.status(201).json({
                status: true,
                message: "Task comment created successfully",
                success: true,
                data: taskComment,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: false,
                    message: error.message,
                    success: false,
                });
            } else {
                res.status(500).json({
                    status: false,
                    message: "Internal server error",
                    success: false,
                });
            }
        }
    };

    const getTaskComments = async (req: Request, res: Response) => {
        try {
            const validatedData = getTaskCommentsSchema.parse(req);
            const result = await taskCommentService.getTaskComments(validatedData.params.task_id);
            
            res.status(200).json({
                status: true,
                message: "Task comments fetched successfully",
                success: true,
                data: result.data,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: false,
                    message: error.message,
                    success: false,
                });
            } else {
                res.status(500).json({
                    status: false,
                    message: "Internal server error",
                    success: false,
                });
            }
        }
    };

    const getTaskCommentById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const taskComment = await taskCommentService.getTaskCommentById(id);
            
            res.status(200).json({
                status: true,
                message: "Task comment fetched successfully",
                success: true,
                data: taskComment,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: false,
                    message: error.message,
                    success: false,
                });
            } else {
                res.status(500).json({
                    status: false,
                    message: "Internal server error",
                    success: false,
                });
            }
        }
    };

    const updateTaskComment = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const validatedData = updateTaskCommentSchema.parse(req);
            const taskComment = await taskCommentService.updateTaskComment(id, validatedData.body);
            
            res.status(200).json({
                status: true,
                message: "Task comment updated successfully",
                success: true,
                data: taskComment,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: false,
                    message: error.message,
                    success: false,
                });
            } else {
                res.status(500).json({
                    status: false,
                    message: "Internal server error",
                    success: false,
                });
            }
        }
    };

    const deleteTaskComment = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await taskCommentService.deleteTaskComment(id);
            
            res.status(200).json({
                status: true,
                message: "Task comment deleted successfully",
                success: true,
            });
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    status: false,
                    message: error.message,
                    success: false,
                });
            } else {
                res.status(500).json({
                    status: false,
                    message: "Internal server error",
                    success: false,
                });
            }
        }
    };

    return {
        createTaskComment,
        getTaskComments,
        getTaskCommentById,
        updateTaskComment,
        deleteTaskComment,
    };
}; 