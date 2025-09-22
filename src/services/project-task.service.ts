import { AppDataSource } from "../utils/data-source";
import { ProjectTasks } from "../entities/project-task.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { TaskComment } from "../entities/task-comment.entity";
import { ClientFollowup } from "../entities/clients-followups.entity";
import AppError from "../utils/appError";
import { mergeDateWithCurrentTime } from "../utils";

const taskRepo = AppDataSource.getRepository(ProjectTasks);
const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);
const taskCommentRepo = AppDataSource.getRepository(TaskComment);
const clientFollowupRepo = AppDataSource.getRepository(ClientFollowup);

interface TaskInput {
  milestone_id: string;
  title: string;
  description?: string;
  due_date?: Date;
  status?: string;
  assigned_to?: string;
  priority?: string;
}

export const ProjectTaskService = () => {
  const createTask = async (data: TaskInput, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectTasks) : taskRepo;
    const milestoneRepository = queryRunner ? queryRunner.manager.getRepository(ProjectMilestones) : milestoneRepo;
    const milestone = await milestoneRepository.findOne({ where: { id: data.milestone_id } });
    if (!milestone) throw new AppError(404, "Milestone not found");

    const task = repo.create({
      milestone,
      title: data.title,
      description: data.description,
      due_date: mergeDateWithCurrentTime(data.due_date),
      status: data.status,
      assigned_to: data.assigned_to,
      priority: data.priority,
    });

    return await repo.save(task);
  };

  const getAllTasks = async () => {
    const data = await taskRepo.find({
      where: { deleted: false },
      relations: ["milestone"],
      order: {created_at: "DESC"}
    });
    return { data, total: data.length };
  };

  const getTaskById = async (id: string) => {
    const task = await taskRepo.findOne({ where: { id, deleted: false }, relations: ["milestone", "milestone.project"] });
    if (!task) throw new AppError(404, "Task not found");
    return task;
  };

  const updateTask = async (id: string, data: Partial<TaskInput>, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectTasks) : taskRepo;
    const milestoneRepository = queryRunner ? queryRunner.manager.getRepository(ProjectMilestones) : milestoneRepo;
    const task = await repo.findOne({ where: { id, deleted: false }, relations: ["milestone"] });
    if (!task) throw new AppError(404, "Task not found");

    if (data.milestone_id) {
      const milestone = await milestoneRepository.findOne({ where: { id: data.milestone_id } });
      if (!milestone) throw new AppError(404, "Milestone not found");
      task.milestone = milestone;
    }

    if (data.title !== undefined) task.title = data.title;
    if (data.description !== undefined) task.description = data.description;
    if (data.due_date !== undefined) task.due_date = mergeDateWithCurrentTime(data.due_date);
    if (data.status !== undefined) task.status = data.status;
    if (data.assigned_to !== undefined) task.assigned_to = data.assigned_to;
    if (data.priority !== undefined) task.priority = data.priority;

    return await repo.save(task);
  };

  const deleteTask = async (id: string, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectTasks) : taskRepo;
    const commentRepo = queryRunner ? queryRunner.manager.getRepository(TaskComment) : taskCommentRepo;
    const followupRepo = queryRunner ? queryRunner.manager.getRepository(ClientFollowup) : clientFollowupRepo;
    
    // Check if any task comments are using this task
    const existComment = await commentRepo.findOne({
      where: {
        task: { id: id },
        deleted: false,
      }
    });
    
    if (existComment) {
      throw new AppError(400, "This task is in use by task comments cannot delete.");
    }

    // Check if any client followups are using this task
    const existFollowup = await followupRepo.findOne({
      where: {
        project_task: { id: id },
        deleted: false,
      }
    });
    
    if (existFollowup) {
      throw new AppError(400, "This task is in use by client followups cannot delete.");
    }

    const task = await repo.findOne({ where: { id, deleted: false } });
    if (!task) throw new AppError(404, "Task not found");

    task.deleted = true;
    task.deleted_at = new Date();

    return await repo.save(task);
  };

  const deleteTaskWithCascade = async (id: string, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectTasks) : taskRepo;
    const commentRepo = queryRunner ? queryRunner.manager.getRepository(TaskComment) : taskCommentRepo;
    const followupRepo = queryRunner ? queryRunner.manager.getRepository(ClientFollowup) : clientFollowupRepo;
    
    // Check if any task comments are using this task
    const existComment = await commentRepo.findOne({
      where: {
        task: { id: id },
        deleted: false,
      }
    });

    // Check if any client followups are using this task
    const existFollowup = await followupRepo.findOne({
      where: {
        project_task: { id: id },
        deleted: false,
      }
    });

    // If comments exist, delete all comments associated with this task first
    if (existComment) {
      const comments = await commentRepo.find({
        where: {
          task: { id: id },
          deleted: false,
        }
      });
      
      for (const comment of comments) {
        comment.deleted = true;
        comment.deleted_at = new Date();
        await commentRepo.save(comment);
      }
    }
    
    // If followups exist, delete all followups associated with this task first
    if (existFollowup) {
      const followups = await followupRepo.find({
        where: {
          project_task: { id: id },
          deleted: false,
        }
      });
      
      for (const followup of followups) {
        followup.deleted = true;
        followup.deleted_at = new Date();
        await followupRepo.save(followup);
      }
    }

    const task = await repo.findOne({ where: { id, deleted: false } });
    if (!task) throw new AppError(404, "Task not found");

    task.deleted = true;
    task.deleted_at = new Date();

    return await repo.save(task);
  };

const getUserTaskCounts = async (userId: string) => {
  // Count tasks assigned to user, excluding tasks from deleted projects/milestones
  const query = `
    SELECT 
      COUNT(*) as total_tasks,
      SUM(CASE 
        WHEN LOWER(t.status) IN ('completed', 'done') THEN 1 
        ELSE 0 
      END) as completed_tasks,
      SUM(CASE 
        WHEN LOWER(t.status) IN ('pending', 'open') THEN 1 
        ELSE 0 
      END) as pending_tasks,
      SUM(CASE 
        WHEN LOWER(t.status) IN ('in progress', 'in-progress') THEN 1 
        ELSE 0 
      END) as in_progress_tasks
    FROM project_tasks t
    LEFT JOIN project_milestones m ON m.id = t.milestone_id
    LEFT JOIN projects p ON p.id = m.project_id
    WHERE t.assigned_to = $1
      AND t.deleted = false
      AND (m.id IS NULL OR m.deleted = false)
      AND (p.id IS NULL OR p.deleted = false)
  `;

  const result = await taskRepo.query(query, [userId]);
  
  return {
    total: parseInt(result[0].total_tasks) || 0,
    completed: parseInt(result[0].completed_tasks) || 0,
    pending: parseInt(result[0].pending_tasks) || 0,
    inProgress: parseInt(result[0].in_progress_tasks) || 0
  };
};

  return {
    getUserTaskCounts,
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
    deleteTaskWithCascade,
  };
};
