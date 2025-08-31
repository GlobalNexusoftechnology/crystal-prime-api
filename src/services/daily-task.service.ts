import { AppDataSource } from "../utils/data-source";
import { DailyTaskEntries } from "../entities/daily-task.entity";
import { Project } from "../entities/projects.entity";
import AppError from "../utils/appError";
import { Between, MoreThanOrEqual, LessThanOrEqual, In } from "typeorm";
import { ProjectTasks } from "../entities/project-task.entity";

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
const taskRepo = AppDataSource.getRepository(ProjectTasks);

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
      filters?: { status?: string; priority?: string; from?: string; to?: string; search?: string; taskId?: string }
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
        const entries = await query.getMany();
        
        // Manually load client relationships for each project
        for (const entry of entries) {
          if (entry.project) {
            const projectWithClient = await projectRepo.findOne({
              where: { id: entry.project.id },
              relations: ["client"]
            });
            if (projectWithClient) {
              entry.project = projectWithClient;
            }
          }
        }
        
        let enriched = await addTaskAndMilestoneIds(entries);
        if (filters?.taskId) {
          enriched = enriched.filter(e => e.taskId === filters.taskId);
        }
        return enriched;
      }

      // For repository find, fetch and sort in-memory by priority then created_at
      const entries = await entryRepo.find({
        where: whereClause,
        relations: ["project"],
        order: { created_at: "DESC" },
      });

      // Manually load client relationships for each project
      for (const entry of entries) {
        if (entry.project) {
          const projectWithClient = await projectRepo.findOne({
            where: { id: entry.project.id },
            relations: ["client"]
          });
          if (projectWithClient) {
            entry.project = projectWithClient;
          }
        }
      }
      // Custom sort: High > Medium > Low > others
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      entries.sort((a, b) => {
        const pa = priorityOrder[a.priority as keyof typeof priorityOrder] || 4;
        const pb = priorityOrder[b.priority as keyof typeof priorityOrder] || 4;
        if (pa !== pb) return pa - pb;
        // If same priority, sort by created_at DESC
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      let enriched = await addTaskAndMilestoneIds(entries);
      if (filters?.taskId) {
        enriched = enriched.filter(e => e.taskId === filters.taskId);
      }
      return enriched;
    };

    // Helper to add projectId, milestoneId, and taskId to each entry
    const addTaskAndMilestoneIds = async (entries: any[]) => {
      // Batch fetch all tasks for the relevant projects and assigned_to
      const projectIds = Array.from(new Set(entries.map(e => e.project?.id).filter(Boolean)));
      const assignedTos = Array.from(new Set(entries.map(e => e.assigned_to).filter(Boolean)));
      // Fetch all tasks for these projects and assigned_to
      const allTasks = await taskRepo.find({
        where: {
          assigned_to: assignedTos.length > 0 ? In(assignedTos) : undefined,
          deleted: false,
        },
        relations: ["milestone", "milestone.project"],
      });
      return entries.map(entry => {
        // Find a matching task
        const matchingTask = allTasks.find(task =>
          task.title === entry.task_title &&
          task.assigned_to === entry.assigned_to &&
          task.milestone?.project?.id === entry.project?.id
        );
        return {
          ...entry,
          projectId: entry.project?.id,
          milestoneId: matchingTask?.milestone?.id || null,
          taskId: matchingTask?.id || null,
        };
      });
    };

    // Get By ID
    const getEntryById = async (id: string) => {
        const entry = await entryRepo.findOne({
            where: { id, deleted: false },
            relations: ["project"],
        });
        if (!entry) throw new AppError(404, "Task entry not found");
        
        // Manually load client relationship for the project
        if (entry.project) {
            const projectWithClient = await projectRepo.findOne({
                where: { id: entry.project.id },
                relations: ["client"]
            });
            if (projectWithClient) {
                entry.project = projectWithClient;
            }
        }
        
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
