import { AppDataSource } from "../utils/data-source";
import { DailyTaskEntries } from "../entities/daily-task.entity";
import { Project } from "../entities/projects.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";

// interfaces/dailyTaskEntry.interface.ts
interface DailyTaskEntryInput {
    project_id: string;
    user_id: string;
    task_title: string;
    description?: string;
    entry_date: Date;
    hours_spent?: number;
    status?: string;
}

const entryRepo = AppDataSource.getRepository(DailyTaskEntries);
const projectRepo = AppDataSource.getRepository(Project);
const userRepo = AppDataSource.getRepository(User);

export const DailyTaskEntryService = () => {
    // Create Entry
    const createEntry = async (data: DailyTaskEntryInput) => {
        const project = await projectRepo.findOne({ where: { id: data.project_id } });
        if (!project) throw new AppError(404, "Project not found");

        const user = await userRepo.findOne({ where: { id: data.user_id } });
        if (!user) throw new AppError(404, "User not found");

        const entry = entryRepo.create({
            ...data,
            project,
            user,
        });

        return await entryRepo.save(entry);
    };

    // Get All
    const getAllEntries = async () => {
        const entries = await entryRepo.find({
            where: { deleted: false },
            relations: ["project", "user"],
            order: { created_at: "DESC" },
        });

        return entries
    };

    // Get By ID
    const getEntryById = async (id: string) => {
        const entry = await entryRepo.findOne({
            where: { id, deleted: false },
            relations: ["project", "user"],
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

        if (data.user_id) {
            const user = await userRepo.findOne({ where: { id: data.user_id } });
            if (!user) throw new AppError(404, "User not found");
            entry.user = user;
        }

        Object.assign(entry, data);
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
