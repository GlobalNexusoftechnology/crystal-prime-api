import { AppDataSource } from "../utils/data-source";
import { Project } from "../entities/project-management.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";
import { ClientFollowup } from "../entities/clients-followups.entity";
import { Clients } from "../entities/clients.entity";
import { ProjectTasks } from "../entities/project-task.entity";

const followupRepo = AppDataSource.getRepository(ClientFollowup);
const clientRepo = AppDataSource.getRepository(Clients);
const userRepo = AppDataSource.getRepository(User);
const taskRepo = AppDataSource.getRepository(ProjectTasks);

export const ClientFollowupService = () => {
  const createFollowup = async (data: { client_id: string; user_id?: string; status?: any; due_date?: Date; remarks?: string; project_task_id?: string; }) => {
    const client = await clientRepo.findOneBy({ id: data.client_id });
    if (!client) throw new AppError(404, "Client not found");

    let user = null;
    if (data.user_id) {
      user = await userRepo.findOneBy({ id: data.user_id });
      if (!user) throw new AppError(404, "User not found");
    }

    let project_task = null;
    if (data.project_task_id) {
      project_task = await taskRepo.findOneBy({ id: data.project_task_id });
      if (!project_task) throw new AppError(404, "Project Task not found");
    }

    let completed_date;
    if (data.status === 'COMPLETED' && !completed_date) {
      completed_date = new Date();
    }

    const followup = followupRepo.create({
      client,
      user,
      project_task,
      status: data.status,
      due_date: data.due_date,
      completed_date,
      remarks: data.remarks,
    });

    return await followupRepo.save(followup);
  };

  const getAllFollowups = async (project_task_id?: string) => {
    let where: any = { deleted: false };
    if (project_task_id) {
      where.project_task = { id: project_task_id };
    }
    const followup = await followupRepo.find({
      where,
      relations: ["user", "project_task"],
      order: { created_at: "DESC" },
    });
    return followup;
  };

  // Count today's followups, filtered by user's tasks for non-admins
  const getTodayFollowupsCount = async (userId?: string, role?: string) => {
    const qb = followupRepo
      .createQueryBuilder('f')
      .leftJoin('f.user', 'u')
      .leftJoin('f.project_task', 't')
      .where('f.deleted = :deleted', { deleted: false })
      // Treat due today based on DB current date to avoid timezone issues
      .andWhere("DATE(COALESCE(f.due_date, f.created_at)) = CURRENT_DATE")
      // Exclude completed
      .andWhere('(f.status IS NULL OR f.status != :completed)', { completed: 'COMPLETED' });

    if (role?.toLowerCase() !== 'admin' && userId) {
      qb.andWhere('(u.id = :userId OR t.assigned_to = :userId)', { userId });
    }

    return await qb.getCount();
  };

  const getFollowupById = async (id: string) => {
    const followup = await followupRepo.findOne({
      where: { id, deleted: false },
      relations: ["user", "project_task"],
    });
    if (!followup) throw new AppError(404, "Followup not found");
    return followup;
  };

  const updateFollowup = async (id: string, data: { client_id?: string; user_id?: string; status?: any; due_date?: Date; completed_date?: Date; remarks?: string; }) => {
    const followup = await followupRepo.findOneBy({ id });
    if (!followup) throw new AppError(404, "Followup not found");

    if (data.client_id) {
      const client = await clientRepo.findOneBy({ id: data.client_id });
      if (!client) throw new AppError(404, "Client not found");
      followup.client = client;
    }
    if (data.user_id) {
      const user = await userRepo.findOneBy({ id: data.user_id });
      if (!user) throw new AppError(404, "User not found");
      followup.user = user;
    }
    if (data.status !== undefined) followup.status = data.status;
    if (data.due_date !== undefined) followup.due_date = data.due_date;
    if (data.completed_date !== undefined) {
      followup.completed_date = data.completed_date;
    } else if (data.status === 'COMPLETED') {
      followup.completed_date = new Date();
    }
    if (data.remarks !== undefined) followup.remarks = data.remarks;

    return await followupRepo.save(followup);
  };

  const softDeleteFollowup = async (id: string) => {
    const followup = await followupRepo.findOneBy({ id });
    if (!followup) throw new AppError(404, "Followup not found");
    followup.deleted = true;
    followup.deleted_at = new Date();
    return await followupRepo.save(followup);
  };

  return {
    createFollowup,
    getAllFollowups,
    getFollowupById,
    updateFollowup,
    softDeleteFollowup,
    getTodayFollowupsCount,
  };
};