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
    status?: string;
    remarks?: string;
    priority?: string;
    // Optional linkage to a project task when known
    task_id?: string;
}

const entryRepo = AppDataSource.getRepository(DailyTaskEntries);
const projectRepo = AppDataSource.getRepository(Project);
const taskRepo = AppDataSource.getRepository(ProjectTasks);

export const DailyTaskEntryService = () => {
    // Create Entry
    const createEntry = async (data: DailyTaskEntryInput) => {
        const project = await projectRepo.findOne({ where: { id: data.project_id } });
        if (!project) throw new AppError(404, "Project not found");

        // If task_id provided, normalize title/assignee from that task (when project matches)
        if (data.task_id) {
          const linkedTask = await taskRepo.findOne({
            where: { id: data.task_id, deleted: false },
            relations: ["milestone", "milestone.project"],
          });
          if (linkedTask && linkedTask.milestone?.project?.id === data.project_id) {
            // Preserve client-provided title; only fill if missing
            if (!data.task_title && linkedTask.title) {
              data.task_title = linkedTask.title;
            }
            if (!data.assigned_to && linkedTask.assigned_to) {
              data.assigned_to = linkedTask.assigned_to;
            }
          }
        }

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
      filters?: { status?: string; priority?: string; from?: string; to?: string; search?: string; taskId?: string; projectId?: string }
    ) => {
      // Build query using explicit conditions (QueryBuilder does not accept object where for nested props reliably)
      let query = entryRepo
        .createQueryBuilder("entry")
        .leftJoinAndSelect("entry.project", "project")
        .where("entry.deleted = :deleted", { deleted: false });

      if (filters?.projectId) {
        query = query.andWhere("project.id = :projectId", { projectId: filters.projectId });
      }
      if (filters?.status) {
        query = query.andWhere("entry.status = :status", { status: filters.status });
      }
      if (filters?.priority) {
        query = query.andWhere("entry.priority = :priority", { priority: filters.priority });
      }
      if (filters?.from && filters?.to) {
        query = query.andWhere("entry.entry_date BETWEEN :from AND :to", {
          from: new Date(filters.from),
          to: new Date(filters.to),
        });
      } else if (filters?.from) {
        query = query.andWhere("entry.entry_date >= :from", { from: new Date(filters.from) });
      } else if (filters?.to) {
        query = query.andWhere("entry.entry_date <= :to", { to: new Date(filters.to) });
      }

      // If a specific taskId is provided, constrain entries to that task's attributes
      if (filters?.taskId) {
        const targetTask = await taskRepo.findOne({
          where: { id: filters.taskId, deleted: false },
          relations: ["milestone", "milestone.project"],
        });
        if (!targetTask) {
          return [];
        }
        const targetProjectId = targetTask.milestone?.project?.id;
        if (targetProjectId) {
          query = query.andWhere("project.id = :tProjectId", { tProjectId: targetProjectId });
        }
        if (targetTask.assigned_to) {
          query = query.andWhere("entry.assigned_to = :tAssignedTo", { tAssignedTo: targetTask.assigned_to });
        }
        if ((targetTask as any).title) {
          const tTitle = ((targetTask as any).title as string).toLowerCase();
          query = query.andWhere("LOWER(entry.task_title) = :tTitle", { tTitle });
        }
      }

      // Add search filter if present
      if (filters?.search) {
        const search = `%${filters.search.toLowerCase()}%`;
        query = query.andWhere(
          "(LOWER(entry.task_title) LIKE :search OR LOWER(entry.description) LIKE :search)",
          { search }
        );
      }

      // Custom priority ordering: High > Medium > Low
      query = query.addOrderBy(
        `CASE entry.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END`,
        "ASC"
      );
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
      
      // Add task and milestone IDs
      let enriched = await addTaskAndMilestoneIds(entries, filters?.taskId);

      return enriched;
    };

    // Helper to add projectId, milestoneId, and taskId to each entry
    const addTaskAndMilestoneIds = async (entries: any[], targetTaskId?: string) => {
      // If a target task is specified, only tag entries that actually match it
      if (targetTaskId) {
        const targetTask = await taskRepo.findOne({
          where: { id: targetTaskId, deleted: false },
          relations: ["milestone", "milestone.project"],
        });

        if (targetTask) {
          const tProjectId = targetTask.milestone?.project?.id;
          const tAssignedTo = targetTask.assigned_to;
          const tTitle = ((targetTask as any).title as string | undefined)?.toLowerCase?.();

          return entries.map(entry => {
            const sameProject = entry.project?.id === tProjectId;
            const sameAssignee = tAssignedTo ? entry.assigned_to === tAssignedTo : true;
            const sameTitle = tTitle ? (entry.task_title || "").toLowerCase() === tTitle : true;
            const match = sameProject && sameAssignee && sameTitle;
            return {
              ...entry,
              projectId: entry.project?.id,
              milestoneId: match ? (targetTask.milestone?.id || null) : null,
              taskId: match ? targetTask.id : null,
            };
          });
        }
        // target task not found: fall through to generic enrichment
      }

      // Batch fetch all tasks for the relevant projects and assigned_to
      const projectIds = Array.from(new Set(entries.map(e => e.project?.id).filter(Boolean)));
      const assignedTos = Array.from(new Set(entries.map(e => e.assigned_to).filter(Boolean)));
      
      // Fetch all tasks for these projects and assigned_to
      const allTasks = await taskRepo.find({
        where: {
          assigned_to: assignedTos.length > 0 ? In(assignedTos) : undefined,
          deleted: false,
          milestone: { deleted: false, project: { deleted: false } },
        },
        relations: ["milestone", "milestone.project"],
      });

      return entries.map(entry => {
        // Find a matching task
        let matchingTask = allTasks.find(task =>
          task.assigned_to === entry.assigned_to &&
          task.milestone?.project?.id === entry.project?.id &&
          (task.title?.toLowerCase() === (entry.task_title || '').toLowerCase())
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

    // Update Status
    const updateEntryStatus = async (id: string, status: string) => {
        const entry = await entryRepo.findOne({ where: { id, deleted: false } });
        if (!entry) throw new AppError(404, "Task entry not found");

        entry.status = status;
        
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
        updateEntryStatus,
        softDeleteEntry,
    };
};
