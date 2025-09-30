import { AppDataSource } from "../utils/data-source";
import { DailyTaskEntries } from "../entities/daily-task.entity";
import AppError from "../utils/appError";
import { ProjectTasks } from "../entities/project-task.entity";

// interfaces/dailyTaskEntry.interface.ts
interface DailyTaskEntryInput {
    task_id: string;
    entry_date: Date;
    task_title?: string;
    description?: string;
    status?: string;
    remarks?: string;
    priority?: string;
}

const entryRepo = AppDataSource.getRepository(DailyTaskEntries);
const taskRepo = AppDataSource.getRepository(ProjectTasks);

export const DailyTaskEntryService = () => {
    // Create Entry
    const createEntry = async (data: DailyTaskEntryInput) => {
        // Get the linked task with all necessary relations
        const linkedTask = await taskRepo.findOne({
            where: { id: data.task_id, deleted: false },
            relations: ["milestone", "milestone.project"],
        });
        
        if (!linkedTask) {
            throw new AppError(404, "Task not found");
        }

        if (!linkedTask.milestone?.project) {
            throw new AppError(404, "Task project not found");
        }

        const project = linkedTask.milestone.project;

        const entry = entryRepo.create({
            task_title: data.task_title || linkedTask.title,
            assigned_to: linkedTask.assigned_to,
            entry_date: data.entry_date,
            description: data.description,
            status: data.status || 'Pending',
            remarks: data.remarks,
            priority: data.priority || 'Medium',
            project: project,
            task: linkedTask,
        });

        return await entryRepo.save(entry);
    };

    // Get All
    const getAllEntries = async (taskId: string) => {
      // Build query with proper relations loading
      let query = entryRepo
        .createQueryBuilder("entry")
        .leftJoinAndSelect("entry.project", "project")
        .leftJoinAndSelect("project.client", "client")
        .leftJoinAndSelect("entry.task", "task")
        .leftJoinAndSelect("task.milestone", "milestone")
        .where("entry.deleted = :deleted", { deleted: false })
        .andWhere("entry.task_id = :taskId", { taskId });

      // Custom priority ordering: High > Medium > Low
      query = query.addOrderBy(
        `CASE entry.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END`,
        "ASC"
      );
      query = query.addOrderBy("entry.created_at", "DESC");

      const entries = await query.getMany();
      
      // Add enriched data with task and milestone IDs
      const enriched = entries.map(entry => ({
        ...entry,
        projectId: entry.project?.id,
        milestoneId: entry.task?.milestone?.id || null,
        taskId: entry.task?.id || null,
      }));

      return enriched;
    };


    // Get By ID
    const getEntryById = async (id: string) => {
        const entry = await entryRepo.findOne({
            where: { id, deleted: false },
            relations: ["project", "project.client", "task", "task.milestone"],
        });
        if (!entry) throw new AppError(404, "Task entry not found");
        
        return {
            ...entry,
            projectId: entry.project?.id,
            milestoneId: entry.task?.milestone?.id || null,
            taskId: entry.task?.id || null,
        };
    };

    // Update
    const updateEntry = async (id: string, data: Partial<DailyTaskEntryInput>) => {
        const entry = await entryRepo.findOne({ where: { id, deleted: false } });
        if (!entry) throw new AppError(404, "Task entry not found");

        Object.assign(entry, data);
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
