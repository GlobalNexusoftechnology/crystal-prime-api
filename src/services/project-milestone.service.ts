import { AppDataSource } from "../utils/data-source";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { Project } from "../entities/projects.entity";
import { ProjectTasks } from "../entities/project-task.entity";
import { Ticket } from "../entities/ticket.entity";
import AppError from "../utils/appError";
import { mergeDateWithCurrentTime } from "../utils";

const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);
const projectRepo = AppDataSource.getRepository(Project);
const taskRepo = AppDataSource.getRepository(ProjectTasks);
const ticketRepo = AppDataSource.getRepository(Ticket);

interface MilestoneInput {
  name: string;
  description: string;
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

    // For Support milestones, enforce only a single "Support" milestone per project
    const requestedName = (data.name || "").trim();
    if (requestedName.toLowerCase() === "support") {
      const existingSupport = await repo.findOne({
        where: { project: { id: data.project_id }, name: "Support", deleted: false },
      });
      if (existingSupport) {
        throw new AppError(400, "Support milestone already exists for this project");
      }
    }

    const milestone = repo.create({
      name: data.name,
      description: data.description,
      start_date: mergeDateWithCurrentTime(data.start_date),
      end_date: mergeDateWithCurrentTime(data.end_date),
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
      relations: ["project", "tasks", "tickets"],
    });
    return { data, total: data.length };
  };

  const getMilestoneById = async (id: string) => {
    const milestone = await milestoneRepo.findOne({
      where: { id, deleted: false },
      relations: ["project", "tasks", "tickets"],
    });
    if (!milestone) throw new AppError(404, "Milestone not found");
    return milestone;
  };

  const getMilestonesByProjectId = async (project_id: string, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectMilestones) : milestoneRepo;
    const milestones = await repo.find({
      where: { project: { id: project_id }, deleted: false },
      relations: ["tasks", "tickets"],
      order: {created_at: "DESC"}
    });
    return milestones;
  };

  const updateMilestone = async (id: string, data: Partial<MilestoneInput>, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectMilestones) : milestoneRepo;
    const projectRepository = queryRunner ? queryRunner.manager.getRepository(Project) : projectRepo;
    const milestone = await repo.findOne({ where: { id, deleted: false }, relations: ["project", "tasks", "tickets"] });
    if (!milestone) throw new AppError(404, "Milestone not found");

    if (data.project_id) {
      const project = await projectRepository.findOne({ where: { id: data.project_id } });
      if (!project) throw new AppError(404, "Project not found");
      milestone.project = project;
    }

    if (data.name !== undefined) milestone.name = data.name;
    if (data.description !== undefined) milestone.description = data.description;

    if (data.start_date !== undefined) milestone.start_date = mergeDateWithCurrentTime(data.start_date);

    if (data.end_date !== undefined) milestone.end_date = mergeDateWithCurrentTime(data.end_date);

    if (data.actual_date !== undefined) milestone.actual_date = data.actual_date;
    if (data.estimated_date !== undefined) milestone.estimated_date = data.estimated_date;
    if (data.assigned_to !== undefined) milestone.assigned_to = data.assigned_to;
    if (data.status !== undefined) milestone.status = data.status;
    if (data.remark !== undefined) milestone.remark = data.remark;

    return await repo.save(milestone);
  };

  const deleteMilestone = async (id: string, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectMilestones) : milestoneRepo;
    const taskRepository = queryRunner ? queryRunner.manager.getRepository(ProjectTasks) : taskRepo;
    
    // Check if any tasks are using this milestone
    const exist = await taskRepository.findOne({
      where: {
        milestone: { id: id },
        deleted: false,
      }
    });
    
    if (exist) {
      throw new AppError(400, "This milestone is in use by tasks cannot delete.");
    }

    const milestone = await repo.findOne({ where: { id, deleted: false } });
    if (!milestone) throw new AppError(404, "Milestone not found");

    milestone.deleted = true;
    milestone.deleted_at = new Date();

    return await repo.save(milestone);
  };

  const deleteMilestoneWithCascade = async (id: string, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectMilestones) : milestoneRepo;
    const taskRepository = queryRunner ? queryRunner.manager.getRepository(ProjectTasks) : taskRepo;
    const ticketRepository = queryRunner ? queryRunner.manager.getRepository(Ticket) : ticketRepo;
    
    // Check if any tasks are using this milestone
    const exist = await taskRepository.findOne({
      where: {
        milestone: { id: id },
        deleted: false,
      }
    });

    // If tasks exist, delete all tasks associated with this milestone first
    if (exist) {
      const tasks = await taskRepository.find({
        where: {
          milestone: { id: id },
          deleted: false,
        }
      });
      
      for (const task of tasks) {
        task.deleted = true;
        task.deleted_at = new Date();
        await taskRepository.save(task);
      }
    }

    // Check if any tickets are using this milestone
    const existTickets = await ticketRepository.findOne({
      where: {
        milestone: { id: id },
        deleted: false,
      }
    });

    // If tickets exist, reassign them to Support milestone instead of deleting
    if (existTickets) {
      const tickets = await ticketRepository.find({
        where: {
          milestone: { id: id },
          deleted: false,
        },
        relations: ["project"]
      });
      
      for (const ticket of tickets) {
        // Find Support milestone for this project
        const supportMilestone = await repo.findOne({
          where: { 
            project: { id: ticket.project.id }, 
            name: "Support", 
            deleted: false 
          }
        });
        
        if (supportMilestone) {
          ticket.milestone = supportMilestone;
          await ticketRepository.save(ticket);
        }
      }
    }

    const milestone = await repo.findOne({ where: { id, deleted: false } });
    if (!milestone) throw new AppError(404, "Milestone not found");

    milestone.deleted = true;
    milestone.deleted_at = new Date();

    return await repo.save(milestone);
  };

  return {
    createMilestone,
    getAllMilestones,
    getMilestoneById,
    getMilestonesByProjectId,
    updateMilestone,
    deleteMilestone,
    deleteMilestoneWithCascade,
  };
};
