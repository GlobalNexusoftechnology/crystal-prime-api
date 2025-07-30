import { AppDataSource } from "../utils/data-source";
import { ProjectMilestoneMaster } from "../entities/milestone-master.entity";
import { ProjectTemplates } from "../entities/project-templates.entity";
import { ProjectTaskMaster } from "../entities/task-master.entity";
import AppError from "../utils/appError";

const milestoneRepo = AppDataSource.getRepository(ProjectMilestoneMaster);
const templateRepo = AppDataSource.getRepository(ProjectTemplates);
const taskRepo = AppDataSource.getRepository(ProjectTaskMaster);

interface MilestoneMasterInput {
  template_id: string;
  name: string;
  description?: string;
  estimated_days?: number;
}

export const ProjectMilestoneMasterService = () => {

    // create 
  const createMilestone = async (data: MilestoneMasterInput) => {
    const template = await templateRepo.findOne({ where: { id: data.template_id } });
    if (!template) throw new AppError(404, "Template not found");

    const milestone = milestoneRepo.create({
      name: data.name,
      description: data.description,
      estimated_days: data.estimated_days,
      template,
    });

    return await milestoneRepo.save(milestone);
  };

  // get All
  const getAllMilestone = async () => {
    const data = await milestoneRepo.find({
      where: { deleted: false },
      relations: ["template"],
    });
    return data;
  };

  // get by id
  const getByIdMilestone = async (id: string) => {
    const milestone = await milestoneRepo.findOne({
      where: { id, deleted: false },
      relations: ["template"],
    });
    if (!milestone) throw new AppError(404, "Milestone not found");
    return milestone;
  };

  // update 
  const updateMilestone = async (id: string, data: Partial<MilestoneMasterInput>) => {
    const milestone = await milestoneRepo.findOne({ where: { id, deleted: false }, relations: ["template"] });
    if (!milestone) throw new AppError(404, "Milestone not found");

    if (data.template_id) {
      const template = await templateRepo.findOne({ where: { id: data.template_id } });
      if (!template) throw new AppError(404, "Template not found");
      milestone.template = template;
    }

    Object.assign(milestone, data);
    return await milestoneRepo.save(milestone);
  };

  // delete
  const softDeleteMilestone = async (id: string) => {
    // Check if any tasks are using this milestone
    const exist = await taskRepo.findOne({
      where: {
        milestone: { id: id },
        deleted: false,
      }
    });
    if (exist) {
      throw new AppError(400, "This milestone is in use by tasks cannot delete.");
    }

    const milestone = await milestoneRepo.findOne({ where: { id, deleted: false } });
    if (!milestone) throw new AppError(404, "Milestone not found");

    milestone.deleted = true;
    milestone.deleted_at = new Date();
    return await milestoneRepo.save(milestone);
  };

  return { createMilestone, getAllMilestone, getByIdMilestone, updateMilestone, softDeleteMilestone };
};
