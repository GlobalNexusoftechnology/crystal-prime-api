import { AppDataSource } from "../utils/data-source";
import { TaskComment } from "../entities/task-comment.entity";
import { ProjectTasks } from "../entities/project-task.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";

const taskCommentRepo = AppDataSource.getRepository(TaskComment);
const taskRepo = AppDataSource.getRepository(ProjectTasks);
const userRepo = AppDataSource.getRepository(User);

interface TaskCommentInput {
    task_id: string;
    assigned_to: string;
    remarks: string;
}

export const TaskCommentService = () => {
    const createTaskComment = async (data: TaskCommentInput) => {
        // Verify task exists
        const task = await taskRepo.findOne({ where: { id: data.task_id, deleted: false } });
        if (!task) {
            throw new AppError(404, "Task not found");
        }

        // Verify user exists
        const user = await userRepo.findOne({ where: { id: data.assigned_to, deleted: false } });
        if (!user) {
            throw new AppError(404, "User not found");
        }

        const taskComment = taskCommentRepo.create({
            task,
            assignedTo: user,
            remarks: data.remarks,
        });

        return await taskCommentRepo.save(taskComment);
    };

    const getTaskComments = async (taskId: string) => {
        const task = await taskRepo.findOne({ where: { id: taskId, deleted: false } });
        if (!task) {
            throw new AppError(404, "Task not found");
        }

        const comments = await taskCommentRepo.find({
            where: { task: { id: taskId }, deleted: false },
            relations: ["assignedTo", "task"],
            order: { created_at: "DESC" },
        });

        return { data: comments, total: comments.length };
    };

    const getTaskCommentById = async (id: string) => {
        const comment = await taskCommentRepo.findOne({
            where: { id, deleted: false },
            relations: ["task", "assignedTo"],
        });
        if (!comment) {
            throw new AppError(404, "Task comment not found");
        }
        return comment;
    };

    const updateTaskComment = async (id: string, data: { remarks: string }) => {
        const comment = await taskCommentRepo.findOne({
            where: { id, deleted: false },
            relations: ["task", "assignedTo"],
        });
        if (!comment) {
            throw new AppError(404, "Task comment not found");
        }

        comment.remarks = data.remarks;
        return await taskCommentRepo.save(comment);
    };

    const deleteTaskComment = async (id: string) => {
        const comment = await taskCommentRepo.findOne({
            where: { id, deleted: false },
        });
        if (!comment) {
            throw new AppError(404, "Task comment not found");
        }

        comment.deleted = true;
        comment.deleted_at = new Date();
        return await taskCommentRepo.save(comment);
    };

    return {
        createTaskComment,
        getTaskComments,
        getTaskCommentById,
        updateTaskComment,
        deleteTaskComment,
    };
}; 