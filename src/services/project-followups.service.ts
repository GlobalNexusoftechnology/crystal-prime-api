import { AppDataSource } from "../utils/data-source";
import { ClientFollowup } from "../entities/project-followups.entity";
import { Project } from "../entities/project-management.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";

const followupRepo = AppDataSource.getRepository(ClientFollowup);
const projectRepo = AppDataSource.getRepository(Project);
const userRepo = AppDataSource.getRepository(User);

export const ProjectFollowupService = () => {
  const createFollowup = async (data: any) => {
    const project = await projectRepo.findOneBy({ id: data.project_id });
    if (!project) throw new AppError(404, "Project not found");

    let user = null;
    if (data.user_id) {
      user = await userRepo.findOneBy({ id: data.user_id });
      if (!user) throw new AppError(404, "User not found");
    }

    const followup = followupRepo.create({
      project,
      user,
      status: data.status,
      due_date: data.due_date,
      completed_date: data.completed_date,
      remarks: data.remarks,
    });

    return await followupRepo.save(followup);
  };

  const getAllFollowups = async () => {
    const followups = await followupRepo.find({
      where: { deleted: false },
      relations: ["project", "user"],
      order: { created_at: "DESC" },
    });
    return followups;
  };

  const getFollowupById = async (id: string) => {
    const followup = await followupRepo.findOne({
      where: { id, deleted: false },
      relations: ["project", "user"],
    });
    if (!followup) throw new AppError(404, "Followup not found");
    return followup;
  };

  const updateFollowup = async (id: string, data: any) => {
    const followup = await followupRepo.findOneBy({ id });
    if (!followup) throw new AppError(404, "Followup not found");

    if (data.project_id) {
      const project = await projectRepo.findOneBy({ id: data.project_id });
      if (!project) throw new AppError(404, "Project not found");
      followup.project = project;
    }
    if (data.user_id) {
      const user = await userRepo.findOneBy({ id: data.user_id });
      if (!user) throw new AppError(404, "User not found");
      followup.user = user;
    }
    if (data.status !== undefined) followup.status = data.status;
    if (data.due_date !== undefined) followup.due_date = data.due_date;
    if (data.completed_date !== undefined) followup.completed_date = data.completed_date;
    if (data.remarks !== undefined) followup.remarks = data.remarks;

    return await followupRepo.save(followup);
  };

  const softDeleteFollowup = async (id: string) => {
    const followup = await followupRepo.findOneBy({ id });
    if (!followup) throw new AppError(404, "Followup not found");
    followup.deleted = true;
    followup.deleted_at = new Date();
    return await followupRepo.save(followup);
  };

  return {
    createFollowup,
    getAllFollowups,
    getFollowupById,
    updateFollowup,
    softDeleteFollowup,
  };
}; 