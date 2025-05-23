// src/services/projectService.ts
import { AppDataSource } from "../utils/data-source"; 
import { Project, ProjectStatus } from "../entities/project-management.entity"; 
import { User } from "../entities/user.entity"; 
import AppError from "../utils/appError"; 
import ExcelJS from "exceljs"; 

// Repositories for Project and User
const projectRepo = AppDataSource.getRepository(Project);
const userRepo = AppDataSource.getRepository(User); 

// Project Service
export const ProjectService = () => {

    // Create Project
    const createProject = async (data: {
        name: string;
        leadName: string; 
        renewalDate: string; 
        status?: ProjectStatus;
    }) => {
        const { name, leadName, renewalDate, status } = data;

        // Optional: Check for existing project name if it should be unique
        const existingProject = await projectRepo.findOne({ where: { name, deleted: false } });
        if (existingProject) {
            throw new AppError(400, "Project with this name already exists");
        }

        const project = new Project();
        project.name = name;
        project.renewalDate = new Date(renewalDate);
        project.status = status || ProjectStatus.OPEN; 
        project.leadName = leadName;

        return await projectRepo.save(project);
    };

    // Get All Project
    const getAllProjects = async () => {
        return await projectRepo.find({
            where: { deleted: false },
            // relations: ["assignedLead"], // Uncomment if 'leadName' is a User relation
            order: { created_at: "DESC" }
        });
    };

    // Get Project by Id
    const getProjectById = async (id: string) => {
        const project = await projectRepo.findOne({
            where: { id, deleted: false },
            // relations: ["assignedLead"], // Uncomment if 'leadName' is a User relation
        });
        if (!project) throw new AppError(404, "Project not found");
        return project;
    };

    // Update Project
    const updateProject = async (id: string, data: {
        name?: string;
        leadName?: string; 
        renewalDate?: string; 
        status?: ProjectStatus;
    }) => {
        const project = await projectRepo.findOne({ where: { id, deleted: false } });
        if (!project) throw new AppError(404, "Project not found");

        // Optional: Check for existing project name if it should be unique and name is being updated
        if (data.name && data.name !== project.name) {
            const existing = await projectRepo.findOne({ where: { name: data.name, deleted: false } });
            if (existing) throw new AppError(400, "Project with this name already exists");
        }

        // Update fields if provided in data
        if (data.name !== undefined) project.name = data.name;
        if (data.renewalDate !== undefined) project.renewalDate = new Date(data.renewalDate);
        if (data.status !== undefined) project.status = data.status;
        if (data.leadName !== undefined) project.leadName = data.leadName;

        return await projectRepo.save(project);
    };

    // Delete Project
    const softDeleteProject = async (id: string) => {
        const project = await projectRepo.findOne({
            where: { id },
            // relations: ["assignedLead"], 
        });

        if (!project) throw new AppError(404, "Project not found");

        project.deleted = true;
        project.deleted_at = new Date();

        await projectRepo.save(project);

        return {
            status: "success",
            message: "Project soft deleted successfully",
            data: project,
        };
    };

    // Excel File Project
    const exportProjectsToExcel = async (): Promise<ExcelJS.Workbook> => {
        const projects = await projectRepo.find({
            where: { deleted: false },
            // relations: ["assignedLead"], 
            order: { created_at: "DESC" },
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Projects");

        // Define columns for the Excel sheet
        worksheet.columns = [
            { header: "Sr No", key: "sr_no", width: 6 },
            { header: "Project Name", key: "name", width: 30 },
            { header: "Lead Name", key: "lead_name", width: 25 }, 
            // If leadName is a User entity, use: { header: "Assigned Lead", key: "assigned_lead", width: 25 },
            { header: "Renewal Date", key: "renewal_date", width: 20 },
            { header: "Status", key: "status", width: 20 },
            { header: "Created At", key: "created_at", width: 25 },
        ];

        // Populate rows with project data
        projects.forEach((project, index) => {
            worksheet.addRow({
                sr_no: index + 1,
                name: project.name,
                lead_name: project.leadName ?? "", 
                // If leadName is a User entity: assigned_lead: project.assignedLead?.name ?? "",
                renewal_date: project.renewalDate?.toLocaleDateString() ?? "", 
                status: project.status ?? "",
                created_at: project.created_at?.toLocaleString() ?? "",
            });
        });

        return workbook;
    };

    return {
        createProject,
        getAllProjects,
        getProjectById,
        updateProject,
        softDeleteProject,
        exportProjectsToExcel
    };
};