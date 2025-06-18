import { AppDataSource } from "../utils/data-source";
import { Project } from "../entities/Project.entity";
import { Clients } from "../entities/clients.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { ProjectTasks } from "../entities/project-task.entity";
import AppError from "../utils/appError";

interface ProjectInput {
  client_id?: string;
  milestone_id?: string;
  task_id?: string;
  name: string;
  project_type?: string;
  budget?: number;
  estimated_cost?: number;
  actual_cost?: number;
  start_date?: Date;
  end_date?: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
}

const ProjectRepo = AppDataSource.getRepository(Project);
const clientRepo = AppDataSource.getRepository(Clients);
const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);
const taskRepo = AppDataSource.getRepository(ProjectTasks);

export const ProjectService = () => {
  // Create Project
  const createProject = async (data: ProjectInput) => {
    const {
      client_id,
      milestone_id,
      task_id,
      name,
      project_type,
      budget,
      estimated_cost,
      actual_cost,
      start_date,
      end_date,
      actual_start_date,
      actual_end_date,
    } = data;

    let client;
    if (client_id) {
      client = await clientRepo.findOne({ where: { id: client_id } });
      if (!client) throw new AppError(404, "Client not found");
    }

    let milestone;
    if (milestone_id) {
      milestone = await milestoneRepo.findOne({ where: { id: milestone_id } });
      if (!milestone) throw new AppError(404, "Milestone not found");
    }

    let task;
    if (task_id) {
      task = await taskRepo.findOne({ where: { id: task_id } });
      if (!task) throw new AppError(404, "Task not found");
    }

    const project = ProjectRepo.create({
      name,
      project_type,
      budget,
      estimated_cost,
      actual_cost,
      start_date,
      end_date,
      actual_start_date,
      actual_end_date,
      client,
      milestone,
      task,
    });

    return await ProjectRepo.save(project);
  };

  // Get All Projects
  const getAllProject = async () => {
    const data = await ProjectRepo.find({
      where: { deleted: false },
      relations: ["client", "milestone", "task"],
    });
    return data;
  };

  // Get Project by ID
  const getProjectById = async (id: string) => {
    const project = await ProjectRepo.findOne({
      where: { id, deleted: false },
      relations: ["client", "milestone", "task"],
    });

    if (!project) throw new AppError(404, "Project record not found");
    return project;
  };

  // Update Project
  const updateProject = async (id: string, data: Partial<ProjectInput>) => {
    const project = await ProjectRepo.findOne({
      where: { id, deleted: false },
      relations: ["client", "milestone", "task"],
    });
    if (!project) throw new AppError(404, "Project record not found");

    const {
      client_id,
      milestone_id,
      task_id,
      name,
      project_type,
      budget,
      estimated_cost,
      actual_cost,
      start_date,
      end_date,
      actual_start_date,
      actual_end_date,
    } = data;

    if (client_id) {
      const client = await clientRepo.findOne({ where: { id: client_id } });
      if (!client) throw new AppError(404, "Client not found");
      project.client = client;
    }

    if (milestone_id) {
      const milestone = await milestoneRepo.findOne({ where: { id: milestone_id } });
      if (!milestone) throw new AppError(404, "Milestone not found");
      project.milestone = milestone;
    }

    if (task_id) {
      const task = await taskRepo.findOne({ where: { id: task_id } });
      if (!task) throw new AppError(404, "Task not found");
      project.task = task;
    }

    if (name !== undefined) project.name = name;
    if (project_type !== undefined) project.project_type = project_type;
    if (budget !== undefined) project.budget = budget;
    if (estimated_cost !== undefined) project.estimated_cost = estimated_cost;
    if (actual_cost !== undefined) project.actual_cost = actual_cost;
    if (start_date !== undefined) project.start_date = start_date;
    if (end_date !== undefined) project.end_date = end_date;
    if (actual_start_date !== undefined) project.actual_start_date = actual_start_date;
    if (actual_end_date !== undefined) project.actual_end_date = actual_end_date;

    return await ProjectRepo.save(project);
  };

  // Soft Delete Project
  const softDeleteProject = async (id: string) => {
    const project = await ProjectRepo.findOne({ where: { id, deleted: false } });
    if (!project) throw new AppError(404, "Project record not found");

    project.deleted = true;
    project.deleted_at = new Date();

    return await ProjectRepo.save(project);
  };

  return {
    createProject,
    getAllProject,
    getProjectById,
    updateProject,
    softDeleteProject,
  };
};
