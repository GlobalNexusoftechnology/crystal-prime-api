import { AppDataSource } from "../utils/data-source";
import { ProjectTemplates } from "../entities/project-templates.entity";
import AppError from "../utils/appError";
import { ProjectMilestoneMasterService } from "./milestone-master.service";
import { ProjectTaskMasterService } from "./task-master.service";

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
  const createTemplate = async (data: any) => {
    const { milestones, ...templateData } = data;
    const existing = await templateRepo.findOne({ where: { name: templateData.name } });
    if (existing) throw new AppError(400, "Template with this name already exists");

    const template = templateRepo.create({
      name: templateData.name,
      description: templateData.description,
      project_type: templateData.project_type,
      estimated_days: templateData.estimated_days,
    });
    const savedTemplate = await templateRepo.save(template);

    const milestoneService = ProjectMilestoneMasterService();
    const taskService = ProjectTaskMasterService();
    let createdMilestones = [];

    if (Array.isArray(milestones)) {
      for (const milestone of milestones) {
        const milestoneData = {
          template_id: savedTemplate.id,
          name: milestone.name,
          description: milestone.description,
          estimated_days: milestone.estimated_days,
        };
        const createdMilestone = await milestoneService.createMilestone(milestoneData);
        let createdTasks = [];
        if (Array.isArray(milestone.tasks)) {
          for (const task of milestone.tasks) {
            const taskData = {
              milestone_master_id: createdMilestone.id,
              title: task.title,
              description: task.description,
              estimated_days: task.estimated_days,
            };
            const createdTask = await taskService.createTaskService(taskData);
            createdTasks.push(createdTask);
          }
        }
        createdMilestones.push({ ...createdMilestone, tasks: createdTasks });
      }
    }

    return { template: savedTemplate, milestones: createdMilestones };
  };

  // Get All
  const getAllTemplates = async () => {
    const templates = await templateRepo.find({
      where: { deleted: false },
      order: { created_at: "DESC" },
      relations: [
        'project_milestone_master',
        'project_milestone_master.project_task_master'
      ]
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


