import { AppDataSource } from "../utils/data-source";
import AppError from "../utils/appError";
import { ProjectTaskMaster } from "../entities/task-master.entity";
import { ProjectMilestoneMaster } from "../entities/milestone-master.entity";
import { TaskComment } from "../entities/task-comment.entity";
import { ClientFollowup } from "../entities/clients-followups.entity";

const repo = AppDataSource.getRepository(ProjectTaskMaster);
const milestoneRepo = AppDataSource.getRepository(ProjectMilestoneMaster);
const taskCommentRepo = AppDataSource.getRepository(TaskComment);
const clientFollowupRepo = AppDataSource.getRepository(ClientFollowup);

export const ProjectTaskMasterService = () => {
    const createTaskService = async (data: any) => {
        const milestone = await milestoneRepo.findOne({ where: { id: data.milestone_master_id } });
        if (!milestone) throw new AppError(404, 'Milestone not found');

        const task = repo.create({
            title: data.title,
            description: data.description,
            estimated_days: data.estimated_days,
            milestone,
        });

        return await repo.save(task);
    };

    const getAllTasksService = async () => {
        const tasks = await repo.find({
            where: { deleted: false },
            relations: ['milestone']
        });
        return { data: tasks, total: tasks.length };
    };

    const getTaskByIdService = async (id: string) => {
        const task = await repo.findOne({
            where: { id, deleted: false },
            relations: ['milestone']
        });
        if (!task) throw new AppError(404, 'Task not found');
        return task;
    };

    const updateTaskService = async (id: string, data: any) => {
        const task = await repo.findOne({
             where: { id, deleted: false },
              relations: ['milestone'] 
            });
        if (!task) throw new AppError(404, 'Task not found');

        if (data.milestone_master_id) {
            const milestone = await milestoneRepo.findOne({ where: { id: data.milestone_master_id } });
            if (!milestone) throw new AppError(404, 'Milestone not found');
            task.milestone = milestone;
        }

        if (data.title !== undefined) task.title = data.title;
        if (data.description !== undefined) task.description = data.description;
        if (data.estimated_days !== undefined) task.estimated_days = data.estimated_days;

        return await repo.save(task);
    };

    const deleteTaskService = async (id: string) => {
        // Check if any task comments are using this task
        const existComment = await taskCommentRepo.findOne({
            where: {
                task: { id: id },
                deleted: false,
            }
        });
        if (existComment) {
            throw new AppError(400, "This task is in use by task comments cannot delete.");
        }

        // Check if any client followups are using this task
        const existFollowup = await clientFollowupRepo.findOne({
            where: {
                project_task: { id: id },
                deleted: false,
            }
        });
        if (existFollowup) {
            throw new AppError(400, "This task is in use by client followups cannot delete.");
        }

        const task = await repo.findOne({ where: { id, deleted: false } });
        if (!task) throw new AppError(404, 'Task not found');

        task.deleted = true;
        task.deleted_at = new Date();
        return await repo.save(task);
    };

    return {
        createTaskService,
        getAllTasksService,
        getTaskByIdService,
        updateTaskService,
        deleteTaskService,
    };
};


