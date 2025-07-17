import { AppDataSource } from "../utils/data-source";
import { DailyTaskEntries } from "../entities/daily-task.entity";
import { Project } from "../entities/projects.entity";
import AppError from "../utils/appError";
import { Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";

// interfaces/dailyTaskEntry.interface.ts
interface DailyTaskEntryInput {
    project_id: string;
    assigned_to: string;
    task_title: string;
    description?: string;
    entry_date: Date;
    hours_spent?: number;
    status?: string;
    remarks?: string;
    priority?: string;
}

const entryRepo = AppDataSource.getRepository(DailyTaskEntries);
const projectRepo = AppDataSource.getRepository(Project);

export const DailyTaskEntryService = () => {
    // Create Entry
    const createEntry = async (data: DailyTaskEntryInput) => {
        const project = await projectRepo.findOne({ where: { id: data.project_id } });
        if (!project) throw new AppError(404, "Project not found");

        const entry = entryRepo.create({
            ...data,
            project,
            priority: data.priority || 'Medium',
        });

        return await entryRepo.save(entry);
    };

    // Get All
    const getAllEntries = async (
      userId?: string,
      role?: string,
      filters?: { status?: string; priority?: string; from?: string; to?: string; search?: string }
    ) => {
      let whereClause: any = { deleted: false };
      if (role?.toLowerCase() !== "admin") {
        whereClause.assigned_to = userId;
      }
      if (filters?.status) {
        whereClause.status = filters.status;
      }
      if (filters?.priority) {
        whereClause.priority = filters.priority;
      }
      if (filters?.from && filters?.to) {
        whereClause.entry_date = Between(new Date(filters.from), new Date(filters.to));
      } else if (filters?.from) {
        whereClause.entry_date = MoreThanOrEqual(new Date(filters.from));
      } else if (filters?.to) {
        whereClause.entry_date = LessThanOrEqual(new Date(filters.to));
      }

      // If search is present, use query builder for LIKE
      if (filters?.search) {
        let query = entryRepo.createQueryBuilder("entry")
          .leftJoinAndSelect("entry.project", "project")
          .where(whereClause);
        query = query.andWhere(
          "(LOWER(entry.task_title) LIKE :search OR LOWER(entry.description) LIKE :search)",
          { search: `%${filters.search.toLowerCase()}%` }
        );
        // Custom priority ordering: High > Medium > Low
        query = query.addOrderBy(`CASE entry.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END`, "ASC");
        query = query.addOrderBy("entry.created_at", "DESC");
        return await query.getMany();
      }

      // For repository find, fetch and sort in-memory by priority then created_at
      const entries = await entryRepo.find({
        where: whereClause,
        relations: ["project"],
        order: { created_at: "DESC" },
      });
      // Custom sort: High > Medium > Low > others
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      entries.sort((a, b) => {
        const pa = priorityOrder[a.priority as keyof typeof priorityOrder] || 4;
        const pb = priorityOrder[b.priority as keyof typeof priorityOrder] || 4;
        if (pa !== pb) return pa - pb;
        // If same priority, sort by created_at DESC
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      return entries;
    };

    // Get By ID
    const getEntryById = async (id: string) => {
        const entry = await entryRepo.findOne({
            where: { id, deleted: false },
            relations: ["project"],
        });
        if (!entry) throw new AppError(404, "Task entry not found");
        return entry;
    };

    // Update
    const updateEntry = async (id: string, data: Partial<DailyTaskEntryInput>) => {
        const entry = await entryRepo.findOne({ where: { id, deleted: false } });
        if (!entry) throw new AppError(404, "Task entry not found");

        if (data.project_id) {
            const project = await projectRepo.findOne({ where: { id: data.project_id } });
            if (!project) throw new AppError(404, "Project not found");
            entry.project = project;
        }

        Object.assign(entry, data);
        if (data.priority !== undefined) entry.priority = data.priority;
        return await entryRepo.save(entry);
    };

    // Soft Delete
    const softDeleteEntry = async (id: string) => {
        const entry = await entryRepo.findOne({ where: { id, deleted: false } });
        if (!entry) throw new AppError(404, "Task entry not found");

        entry.deleted = true;
        entry.deleted_at = new Date();
        return await entryRepo.save(entry);
    };

    return {
        createEntry,
        getAllEntries,
        getEntryById,
        updateEntry,
        softDeleteEntry,
    };
};
