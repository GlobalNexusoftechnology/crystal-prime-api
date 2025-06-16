import { AppDataSource } from "../utils/data-source";
import { ProjectTasks } from "../entities/project-task.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import AppError from "../utils/appError";

const taskRepo = AppDataSource.getRepository(ProjectTasks);
const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);

interface TaskInput {
  milestone_id: string;
  title: string;
  description?: string;
  due_date?: Date;
  status?: string;
  assigned_to?: string;
}

export const ProjectTaskService = () => {
  const createTask = async (data: TaskInput) => {
    const milestone = await milestoneRepo.findOne({ where: { id: data.milestone_id } });
    if (!milestone) throw new AppError(404, "Milestone not found");

    const task = taskRepo.create({
      milestone,
      title: data.title,
      description: data.description,
      due_date: data.due_date,
      status: data.status,
      assigned_to: data.assigned_to,
    });

    return await taskRepo.save(task);
  };

  const getAllTasks = async () => {
    const data = await taskRepo.find({
      where: { deleted: false },
      relations: ["milestone"],
    });
    return { data, total: data.length };
  };

  const getTaskById = async (id: string) => {
    const task = await taskRepo.findOne({ where: { id, deleted: false }, relations: ["milestone"] });
    if (!task) throw new AppError(404, "Task not found");
    return task;
  };

  const updateTask = async (id: string, data: Partial<TaskInput>) => {
    const task = await taskRepo.findOne({ where: { id, deleted: false }, relations: ["milestone"] });
    if (!task) throw new AppError(404, "Task not found");

    if (data.milestone_id) {
      const milestone = await milestoneRepo.findOne({ where: { id: data.milestone_id } });
      if (!milestone) throw new AppError(404, "Milestone not found");
      task.milestone = milestone;
    }

    if (data.title !== undefined) task.title = data.title;
    if (data.description !== undefined) task.description = data.description;
    if (data.due_date !== undefined) task.due_date = data.due_date;
    if (data.status !== undefined) task.status = data.status;
    if (data.assigned_to !== undefined) task.assigned_to = data.assigned_to;

    return await taskRepo.save(task);
  };

  const deleteTask = async (id: string) => {
    const task = await taskRepo.findOne({ where: { id, deleted: false } });
    if (!task) throw new AppError(404, "Task not found");

    task.deleted = true;
    task.deleted_at = new Date();

    return await taskRepo.save(task);
  };

  return {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
  };
};
