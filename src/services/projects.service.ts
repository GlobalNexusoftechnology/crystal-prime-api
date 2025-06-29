import { AppDataSource } from "../utils/data-source";
import { Project } from "../entities/projects.entity";
import { Clients } from "../entities/clients.entity";
import AppError from "../utils/appError";

interface ProjectInput {
  client_id?: string;
  name: string;
  description: string;
  project_type?: string;
  budget?: number;
  cost_of_labour?: number,
  overhead_cost?: number,
  estimated_cost?: number;
  actual_cost?: number;
  start_date?: Date;
  end_date?: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
  template_id?: string;
  renewal_type?: string | null;
  renewal_date?: Date;
  is_renewal?: boolean;
}

const ProjectRepo = AppDataSource.getRepository(Project);
const clientRepo = AppDataSource.getRepository(Clients);

export const ProjectService = () => {
  const getQueryRunner = () => {
    return AppDataSource.createQueryRunner();
  };

  // Create Project
  const createProject = async (data: ProjectInput, queryRunner?: any) => {
    const {
      client_id,
      name,
      description,
      project_type,
      budget,
      cost_of_labour,
      overhead_cost,
      estimated_cost,
      actual_cost,
      start_date,
      end_date,
      actual_start_date,
      actual_end_date,
      template_id,
      renewal_type,
      renewal_date,
      is_renewal,
    } = data;

    let client;
    if (client_id) {
      client = queryRunner
        ? await queryRunner.manager.findOne(Clients, { where: { id: client_id } })
        : await clientRepo.findOne({ where: { id: client_id } });
      if (!client) throw new AppError(404, "Client not found");
    }

    let template;
    if (template_id) {
      template = queryRunner
        ? await queryRunner.manager.findOne(require("../entities/project-templates.entity").ProjectTemplates, { where: { id: template_id } })
        : await AppDataSource.getRepository(require("../entities/project-templates.entity").ProjectTemplates).findOne({ where: { id: template_id } });
      if (!template) throw new AppError(404, "Template not found");
    }

    const repo = queryRunner ? queryRunner.manager.getRepository(Project) : ProjectRepo;
    const project = repo.create({
      name,
      description,
      project_type,
      budget,
      cost_of_labour,
      overhead_cost,
      estimated_cost,
      actual_cost,
      start_date,
      end_date,
      actual_start_date,
      actual_end_date,
      renewal_type,
      renewal_date,
      is_renewal,
      client,
      template,
    });

    return await repo.save(project);
  };

  // Get All Projects
  const getAllProject = async () => {
    const data = await ProjectRepo.find({
      where: { deleted: false },
      relations: [
        "client",
        "milestones",
        "milestones.tasks",
        "attachments",
        "attachments.uploaded_by",
        "template"
      ],
    });
    return data;
  };

  // Get Project by ID
  const getProjectById = async (id: string) => {
    const project = await ProjectRepo.findOne({
      where: { id, deleted: false },
      relations: [
        "client",
        "milestones",
        "milestones.tasks",
        "attachments",
        "attachments.uploaded_by",
        "template"
      ],
    });

    if (!project) throw new AppError(404, "Project record not found");
    return project;
  };

  // Update Project
  const updateProject = async (id: string, data: Partial<ProjectInput>, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(Project) : ProjectRepo;
    const clientRepository = queryRunner ? queryRunner.manager.getRepository(Clients) : clientRepo;
    const project = await repo.findOne({
      where: { id, deleted: false },
      relations: ["client"],
    });
    if (!project) throw new AppError(404, "Project record not found");

    const {
      client_id,
      name,
      description,
      project_type,
      budget,
      cost_of_labour,
      overhead_cost,
      estimated_cost,
      actual_cost,
      start_date,
      end_date,
      actual_start_date,
      actual_end_date,
      renewal_type,
      renewal_date,
      is_renewal,
    } = data;

    if (client_id) {
      const client = await clientRepository.findOne({ where: { id: client_id } });
      if (!client) throw new AppError(404, "Client not found");
      project.client = client;
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (project_type !== undefined) project.project_type = project_type;
    if (budget !== undefined) project.budget = budget;
    if (cost_of_labour !== undefined) project.cost_of_labour = cost_of_labour;
    if (overhead_cost !== undefined) project.overhead_cost = overhead_cost;
    if (estimated_cost !== undefined) project.estimated_cost = estimated_cost;
    if (actual_cost !== undefined) project.actual_cost = actual_cost;
    if (start_date !== undefined) project.start_date = start_date;
    if (end_date !== undefined) project.end_date = end_date;
    if (actual_start_date !== undefined)
      project.actual_start_date = actual_start_date;
    if (actual_end_date !== undefined)
      project.actual_end_date = actual_end_date;
    if (renewal_type !== undefined) project.renewal_type = renewal_type as any;
    if (renewal_date !== undefined) project.renewal_date = renewal_date;
    if (is_renewal !== undefined) project.is_renewal = is_renewal;

    return await repo.save(project);
  };

  // Soft Delete Project
  const softDeleteProject = async (id: string) => {
    const project = await ProjectRepo.findOne({
      where: { id, deleted: false },
    });
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
    getQueryRunner,
  };
};
