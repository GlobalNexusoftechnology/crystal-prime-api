import { AppDataSource } from "../utils/data-source";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { Project } from "../entities/projects.entity";
import AppError from "../utils/appError";

const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);
const projectRepo = AppDataSource.getRepository(Project);

interface MilestoneInput {
  name: string;
  start_date?: Date;
  end_date?: Date;
  actual_date?: Date;
  estimated_date?: Date;
  assigned_to?: string;
  status: string;
  remark?: string;
  project_id: string;
}

export const MilestoneService = () => {
  const createMilestone = async (data: MilestoneInput, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectMilestones) : milestoneRepo;
    const projectRepository = queryRunner ? queryRunner.manager.getRepository(Project) : projectRepo;
    const project = await projectRepository.findOne({ where: { id: data.project_id } });
    if (!project) throw new AppError(404, "Project not found");

    const milestone = repo.create({
      name: data.name,
      start_date: data.start_date,
      end_date: data.end_date,
      actual_date: data.actual_date,
      estimated_date: data.estimated_date,
      assigned_to: data.assigned_to,
      status: data.status,
      remark: data.remark,
      project,
    });

    return await repo.save(milestone);
  };

  const getAllMilestones = async () => {
    const data = await milestoneRepo.find({
      where: { deleted: false },
      relations: ["project"],
    });
    return { data, total: data.length };
  };

  const getMilestoneById = async (id: string) => {
    const milestone = await milestoneRepo.findOne({
      where: { id, deleted: false },
      relations: ["project"],
    });
    if (!milestone) throw new AppError(404, "Milestone not found");
    return milestone;
  };

  const updateMilestone = async (id: string, data: Partial<MilestoneInput>, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectMilestones) : milestoneRepo;
    const projectRepository = queryRunner ? queryRunner.manager.getRepository(Project) : projectRepo;
    const milestone = await repo.findOne({ where: { id, deleted: false }, relations: ["project"] });
    if (!milestone) throw new AppError(404, "Milestone not found");

    if (data.project_id) {
      const project = await projectRepository.findOne({ where: { id: data.project_id } });
      if (!project) throw new AppError(404, "Project not found");
      milestone.project = project;
    }

    if (data.name !== undefined) milestone.name = data.name;
    if (data.start_date !== undefined) milestone.start_date = data.start_date;
    if (data.end_date !== undefined) milestone.end_date = data.end_date;
    if (data.actual_date !== undefined) milestone.actual_date = data.actual_date;
    if (data.estimated_date !== undefined) milestone.estimated_date = data.estimated_date;
    if (data.assigned_to !== undefined) milestone.assigned_to = data.assigned_to;
    if (data.status !== undefined) milestone.status = data.status;
    if (data.remark !== undefined) milestone.remark = data.remark;

    return await repo.save(milestone);
  };

  const deleteMilestone = async (id: string) => {
    const milestone = await milestoneRepo.findOne({ where: { id, deleted: false } });
    if (!milestone) throw new AppError(404, "Milestone not found");

    milestone.deleted = true;
    milestone.deleted_at = new Date();

    return await milestoneRepo.save(milestone);
  };

  return {
    createMilestone,
    getAllMilestones,
    getMilestoneById,
    updateMilestone,
    deleteMilestone,
  };
};
