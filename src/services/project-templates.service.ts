import { AppDataSource } from "../utils/data-source";
import { ProjectTemplates } from "../entities/project-templates.entity";
import AppError from "../utils/appError";

const templateRepo = AppDataSource.getRepository(ProjectTemplates);

// Local Interface (cleaned: no `| null`)
interface ProjectTemplateInput {
  name: string;
  description?: string;
  project_type?: string;
  estimated_days?: number;
}

export const ProjectTemplateService = () => {
  // Create
  const createTemplate = async (data: ProjectTemplateInput) => {
    const existing = await templateRepo.findOne({ where: { name: data.name } });
    if (existing) throw new AppError(400, "Template with this name already exists");

    const template = templateRepo.create({
      name: data.name,
      description: data.description,
      project_type: data.project_type,
      estimated_days: data.estimated_days,
    });

    return await templateRepo.save(template);
  };

  // Get All
  const getAllTemplates = async () => {
    const templates = await templateRepo.find({
      where: { deleted: false },
      order: { created_at: "DESC" },
    });

    return { templates, total: templates.length };
  };

  // Get By ID
  const getTemplateById = async (id: string) => {
    const template = await templateRepo.findOne({ where: { id, deleted: false } });
    if (!template) throw new AppError(404, "Project template not found");
    return template;
  };

  // Update
  const updateTemplate = async (id: string, data: Partial<ProjectTemplateInput>) => {
    const template = await templateRepo.findOne({ where: { id, deleted: false } });
    if (!template) throw new AppError(404, "Project template not found");

    if (data.name !== undefined) template.name = data.name;
    if (data.description !== undefined) template.description = data.description;
    if (data.project_type !== undefined) template.project_type = data.project_type;
    if (data.estimated_days !== undefined) template.estimated_days = data.estimated_days;

    return await templateRepo.save(template);
  };

  // Soft Delete
  const softDeleteTemplate = async (id: string) => {
    const template = await templateRepo.findOne({ where: { id, deleted: false } });
    if (!template) throw new AppError(404, "Project template not found");

    template.deleted = true;
    template.deleted_at = new Date();

    return await templateRepo.save(template);
  };

  return {
    createTemplate,
    getAllTemplates,
    getTemplateById,
    updateTemplate,
    softDeleteTemplate,
  };
};


