// src/services/taskService.ts
import { AppDataSource } from "../utils/data-source";
import { Task, TaskStatus, TaskPriority } from "../entities/task-management.entity";
import { User } from "../entities/user.entity";
import { Project } from "../entities/project-management.entity";
import AppError from "../utils/appError";
import ExcelJS from "exceljs";
import { CreateTaskInput, UpdateTaskInput } from "../schemas/task-management.schema";

// Repositories for Task and related entities
const taskRepo = AppDataSource.getRepository(Task);
const userRepo = AppDataSource.getRepository(User);
const projectRepo = AppDataSource.getRepository(Project);

// Task Service
export const TaskService = () => {

    // Create Task
    const createTask = async (data: CreateTaskInput) => {
        const { taskName, priority, endDate, assignedToId, status, projectId, description } = data;

        const task = new Task();
        task.taskName = taskName;
        task.priority = priority || TaskPriority.MEDIUM;
        task.endDate = new Date(endDate); // Convert string to Date object
        task.status = status || TaskStatus.OPEN; // Default to OPEN
        task.description = description ?? "";

        const existing = await taskRepo.findOne({ where: { taskName, deleted: false } });
        if (existing) {
            throw new AppError(400, "task with this name already exists");
        }

        // Handle assigned user
        if (assignedToId) {
            const assignedUser = await userRepo.findOne({ where: { id: assignedToId } });
            if (!assignedUser) throw new AppError(404, "Invalid assigned user");
            task.assignedTo = assignedUser;
        }

        // Handle project
        if (projectId) {
            const project = await projectRepo.findOne({ where: { id: projectId } });
            if (!project) throw new AppError(404, "Invalid project");
            task.project = project;
        }

        return await taskRepo.save(task);
    };

    // Get All Task
    const getAllTasks = async () => {
        return await taskRepo.find({
            where: { deleted: false },
            relations: ["assignedTo", "project"],
            order: { created_at: "DESC" }
        });
    };

    //Get Task by Id
    const getTaskById = async (id: string) => {
        const task = await taskRepo.findOne({
            where: { id, deleted: false },
            relations: ['assignedTo', 'project'],
        });
        if (!task) throw new AppError(404, "Task not found");
        return task;
    };

    // Update Task
    const updateTask = async (id: string, data: UpdateTaskInput) => {
        const task = await taskRepo.findOne({ where: { id, deleted: false } });
        if (!task) {
            throw new AppError(404, "Task not found");
        }

        // Update fields if provided in data
        if (data.taskName !== undefined) task.taskName = data.taskName;
        if (data.priority !== undefined) task.priority = data.priority;
        if (data.endDate !== undefined) task.endDate = new Date(data.endDate);
        if (data.status !== undefined) task.status = data.status;
        if (data.description !== undefined) task.description = data.description;

        // Handle assigned user
        if (data.assignedToId !== undefined) {
            if (data.assignedToId === null) {
                task.assignedTo = null;
            } else {
                const assignedUser = await userRepo.findOne({ where: { id: data.assignedToId } });
                if (!assignedUser) throw new AppError(404, "Invalid assigned user");
                task.assignedTo = assignedUser;
            }
        }

        // Handle project
        if (data.projectId !== undefined) {
            if (data.projectId === null) {
                task.project = null;
            } else {
                const project = await projectRepo.findOne({ where: { id: data.projectId } });
                if (!project) throw new AppError(404, "Invalid project");
                task.project = project;
            }
        }

        return await taskRepo.save(task);
    };

    // Delete task
    const softDeleteTask = async (id: string) => {
        const task = await taskRepo.findOne({ where: { id }, relations: ["assignedTo", "project"], });

        if (!task) throw new AppError(404, "Task not found");

        task.deleted = true;
        task.deleted_at = new Date();

        await taskRepo.save(task);

        return {
            status: "success",
            message: "Task soft deleted successfully",
            data: task,
        };
    };

    // Excel File Task
    const exportTasksToExcel = async (): Promise<ExcelJS.Workbook> => {
        const tasks = await taskRepo.find({
            where: { deleted: false },
            relations: ["assignedTo", "project"],
            order: { created_at: "DESC" }, // 
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Tasks");

        // Define columns for the Excel sheet
        worksheet.columns = [
            { header: "Sr No", key: "sr_no", width: 6 },
            { header: "Task Name", key: "task_name", width: 30 },
            { header: "Priority", key: "priority", width: 15 },
            { header: "End Date", key: "end_date", width: 20 },
            { header: "Assigned To", key: "assigned_to", width: 25 },
            { header: "Status", key: "status", width: 20 },
            { header: "Project Name", key: "project_name", width: 30 },
            { header: "Project Lead", key: "project_lead_name", width: 25 },
            { header: "Project Renewal Date", key: "project_renewal_date", width: 25 },
            { header: "Created At", key: "created_at", width: 25 },
        ];

        // Populate rows with task data
        tasks.forEach((task, index) => {
            worksheet.addRow({
                sr_no: index + 1,
                task_name: task.taskName,
                priority: task.priority,
                end_date: task.endDate?.toLocaleDateString(),
                // assigned_to: task.assignedTo?.name ?? "",
                status: task.status,
                project_name: task.project?.name ?? "",
                project_lead_name: task.project?.leadName ?? "",
                project_renewal_date: task.project?.renewalDate instanceof Date ? task.project.renewalDate.toLocaleDateString() : "",
                created_at: task.created_at instanceof Date ? task.created_at.toLocaleString() : "",
            });
        });

        return workbook;
    };

    return {
        createTask,
        getAllTasks,
        getTaskById,
        updateTask,
        softDeleteTask,
        exportTasksToExcel
    };
};