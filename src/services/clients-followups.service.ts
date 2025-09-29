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

    const saved = await followupRepo.save(followup);
    // Reload with relations
    const withRelations = await followupRepo.findOne({
      where: { id: saved.id },
      relations: [
        "user",
        "client",
        "project_task",
        "project_task.milestone",
        "project_task.milestone.project",
        "project_task.milestone.project.client",
      ],
    });
    return withRelations as ClientFollowup;
  };

  const getAllFollowups = async (filters?: {
    project_task_id?: string;
    client_id?: string;
    user_id?: string;
    status?: string | string[];
    from_date?: string; // ISO string
    to_date?: string;   // ISO string
    due_from?: string;  // ISO string for due_date
    due_to?: string;    // ISO string for due_date
    due_today?: string | boolean; // "true" | "false"
    q?: string; // search in remarks
  }) => {
    const qb = followupRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.user', 'u')
      .leftJoinAndSelect('f.client', 'c')
      .leftJoinAndSelect('f.project_task', 't')
      .leftJoinAndSelect('t.milestone', 'm')
      .leftJoinAndSelect('m.project', 'p')
      .leftJoinAndSelect('p.client', 'pc')
      .where('f.deleted = :deleted', { deleted: false });

    if (filters?.project_task_id) {
      qb.andWhere('t.id = :taskId', { taskId: filters.project_task_id });
    }
    if (filters?.client_id) {
      qb.andWhere('c.id = :clientId', { clientId: filters.client_id });
    }
    if (filters?.user_id) {
      qb.andWhere('u.id = :userId', { userId: filters.user_id });
    }
    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      qb.andWhere('f.status IN (:...statuses)', { statuses });
    }
    if (filters?.from_date && filters?.to_date) {
      qb.andWhere('f.created_at BETWEEN :from AND :to', { from: filters.from_date, to: filters.to_date });
    } else if (filters?.from_date) {
      qb.andWhere('f.created_at >= :from', { from: filters.from_date });
    } else if (filters?.to_date) {
      qb.andWhere('f.created_at <= :to', { to: filters.to_date });
    }
    if (filters?.due_from && filters?.due_to) {
      qb.andWhere('f.due_date BETWEEN :dfrom AND :dto', { dfrom: filters.due_from, dto: filters.due_to });
    } else if (filters?.due_from) {
      qb.andWhere('f.due_date >= :dfrom', { dfrom: filters.due_from });
    } else if (filters?.due_to) {
      qb.andWhere('f.due_date <= :dto', { dto: filters.due_to });
    }
    if (filters?.due_today && String(filters.due_today).toLowerCase() === 'true') {
      qb.andWhere('DATE(COALESCE(f.due_date, f.created_at)) = CURRENT_DATE');
    }
    if (filters?.q) {
      qb.andWhere('LOWER(f.remarks) LIKE :q', { q: `%${filters.q.toLowerCase()}%` });
    }

    qb.orderBy('f.created_at', 'DESC');
    return await qb.getMany();
  };

  // Count today's followups, filtered by user's tasks for non-admins
  const getTodayFollowupsCount = async (userId?: string, role?: string) => {
    // Get today's date in the format YYYY-MM-DD to ensure consistent comparison
    const today = new Date().toISOString().split('T')[0]; // Gets YYYY-MM-DD format
    
    const qb = followupRepo
      .createQueryBuilder('f')
      .leftJoin('f.user', 'u')
      .leftJoin('f.project_task', 't')
      .where('f.deleted = :deleted', { deleted: false })
      // Check if due_date is today, or if no due_date, check if created_at is today
      .andWhere(
        "(DATE(f.due_date) = :today AND f.due_date IS NOT NULL) OR (f.due_date IS NULL AND DATE(f.created_at) = :today)",
        { today }
      )
      // Exclude completed followups
      .andWhere('(f.status IS NULL OR f.status != :completed)', { completed: 'COMPLETED' });

    if (role?.toLowerCase() !== 'admin' && userId) {
      qb.andWhere('(u.id = :userId OR t.assigned_to = :userId)', { userId });
    }

    return await qb.getCount();
  };

  const getFollowupById = async (id: string) => {
    const followup = await followupRepo.findOne({
      where: { id, deleted: false },
      relations: [
        "user",
        "client",
        "project_task",
        "project_task.milestone",
        "project_task.milestone.project",
        "project_task.milestone.project.client",
      ],
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

    const saved = await followupRepo.save(followup);
    // Reload with relations
    const withRelations = await followupRepo.findOne({
      where: { id: saved.id },
      relations: [
        "user",
        "client",
        "project_task",
        "project_task.milestone",
        "project_task.milestone.project",
        "project_task.milestone.project.client",
      ],
    });
    return withRelations as ClientFollowup;
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