import { AppDataSource } from "../utils/data-source";
import { Ticket } from "../entities/ticket.entity";
import { Project } from "../entities/projects.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import AppError from "../utils/appError";

const ticketRepo = AppDataSource.getRepository(Ticket);
const projectRepo = AppDataSource.getRepository(Project);
const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);

interface TicketInput {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  project_id: string;
  milestone_id?: string;
  assigned_to?: string;
  image_url?: string;
  remark?: string;
}

export const TicketService = () => {
  const createTicket = async (data: TicketInput, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(Ticket) : ticketRepo;
    const projectRepository = queryRunner ? queryRunner.manager.getRepository(Project) : projectRepo;
    const milestoneRepository = queryRunner ? queryRunner.manager.getRepository(ProjectMilestones) : milestoneRepo;
    
    const project = await projectRepository.findOne({ where: { id: data.project_id } });
    if (!project) throw new AppError(404, "Project not found");

    let milestone = null;
    if (data.milestone_id) {
      milestone = await milestoneRepository.findOne({ where: { id: data.milestone_id } });
      if (!milestone) throw new AppError(404, "Milestone not found");
    } else {
      // Auto-assign to Support milestone
      milestone = await milestoneRepository.findOne({
        where: { 
          project: { id: data.project_id }, 
          name: "Support", 
          deleted: false 
        },
        relations: ["project"]
      });

      if (!milestone) {
        // Try to create Support milestone if it doesn't exist
        const project = await projectRepository.findOne({ where: { id: data.project_id } });
        if (!project) throw new AppError(404, "Project not found");
        
        // Create Support milestone
        const supportMilestone = milestoneRepository.create({
          name: "Support",
          description: "Support and maintenance milestone for ongoing project support",
          status: "Open",
          project: project,
          start_date: new Date(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        });
        
        milestone = await milestoneRepository.save(supportMilestone);
      }
    }

    const ticket = repo.create({
      title: data.title,
      description: data.description,
      status: data.status || "Open",
      priority: data.priority || "Medium",
      assigned_to: data.assigned_to,
      project,
      milestone,
      image_url: data.image_url,
      remark: data.remark,
    });

    const savedTicket = await repo.save(ticket);
    
    // Return the ticket with relationships loaded using QueryBuilder
    return await repo.createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.milestone", "milestone")
      .where("ticket.id = :id", { id: savedTicket.id })
      .getOne();
  };

  const getAllTickets = async (filters: any = {}) => {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const { searchText, status, priority } = filters;

    let query = ticketRepo.createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.milestone", "milestone")
      .where("ticket.deleted = false");

    if (searchText && searchText.trim() !== "") {
      const search = `%${searchText.trim().toLowerCase()}%`;
      query = query.andWhere(
        `LOWER(ticket.title) LIKE :search OR LOWER(ticket.description) LIKE :search OR LOWER(ticket.status) LIKE :search OR LOWER(ticket.priority) LIKE :search OR LOWER(ticket.remark) LIKE :search OR LOWER(project.name) LIKE :search`,
        { search }
      );
    }

    if (status && status.trim() !== "") {
      query = query.andWhere("LOWER(ticket.status) = LOWER(:status)", { status });
    }

    if (priority && priority.trim() !== "") {
      query = query.andWhere("LOWER(ticket.priority) = LOWER(:priority)", { priority });
    }

    query = query.orderBy("ticket.created_at", "DESC");
    query.skip(skip).take(limit);

    const [tickets, total] = await query.getManyAndCount();

    return {
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  const getTicketById = async (id: string) => {
    const ticket = await ticketRepo.createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.milestone", "milestone")
      .where("ticket.id = :id", { id })
      .andWhere("ticket.deleted = false")
      .getOne();
    if (!ticket) throw new AppError(404, "Ticket not found");
    return ticket;
  };

  const getTicketsByProject = async (projectId: string, filters: any = {}) => {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const { searchText, status, priority } = filters;

    let query = ticketRepo.createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.milestone", "milestone")
      .where("ticket.deleted = false")
      .andWhere("project.id = :projectId", { projectId });

    if (searchText && searchText.trim() !== "") {
      const search = `%${searchText.trim().toLowerCase()}%`;
      query = query.andWhere(
        `LOWER(ticket.title) LIKE :search OR LOWER(ticket.description) LIKE :search OR LOWER(ticket.status) LIKE :search OR LOWER(ticket.priority) LIKE :search OR LOWER(ticket.remark) LIKE :search`,
        { search }
      );
    }

    if (status && status.trim() !== "") {
      query = query.andWhere("LOWER(ticket.status) = LOWER(:status)", { status });
    }

    if (priority && priority.trim() !== "") {
      query = query.andWhere("LOWER(ticket.priority) = LOWER(:priority)", { priority });
    }

    query = query.orderBy("ticket.created_at", "DESC");
    query.skip(skip).take(limit);

    const [tickets, total] = await query.getManyAndCount();

    return {
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  const getTicketsByMilestone = async (milestoneId: string, filters: any = {}) => {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const { searchText, status, priority } = filters;

    let query = ticketRepo.createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.milestone", "milestone")
      .where("ticket.deleted = false")
      .andWhere("milestone.id = :milestoneId", { milestoneId });

    if (searchText && searchText.trim() !== "") {
      const search = `%${searchText.trim().toLowerCase()}%`;
      query = query.andWhere(
        `LOWER(ticket.title) LIKE :search OR LOWER(ticket.description) LIKE :search OR LOWER(ticket.status) LIKE :search OR LOWER(ticket.priority) LIKE :search OR LOWER(ticket.remark) LIKE :search`,
        { search }
      );
    }

    if (status && status.trim() !== "") {
      query = query.andWhere("LOWER(ticket.status) = LOWER(:status)", { status });
    }

    if (priority && priority.trim() !== "") {
      query = query.andWhere("LOWER(ticket.priority) = LOWER(:priority)", { priority });
    }

    query = query.orderBy("ticket.created_at", "DESC");
    query.skip(skip).take(limit);

    const [tickets, total] = await query.getManyAndCount();

    return {
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  const updateTicket = async (id: string, data: Partial<TicketInput>, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(Ticket) : ticketRepo;
    const projectRepository = queryRunner ? queryRunner.manager.getRepository(Project) : projectRepo;
    const milestoneRepository = queryRunner ? queryRunner.manager.getRepository(ProjectMilestones) : milestoneRepo;
    
    const ticket = await repo.findOne({ 
      where: { id, deleted: false }, 
      relations: ["project", "milestone"] 
    });
    if (!ticket) throw new AppError(404, "Ticket not found");

    if (data.project_id) {
      const project = await projectRepository.findOne({ where: { id: data.project_id } });
      if (!project) throw new AppError(404, "Project not found");
      ticket.project = project;
    }

    if (data.milestone_id) {
      const milestone = await milestoneRepository.findOne({ where: { id: data.milestone_id } });
      if (!milestone) throw new AppError(404, "Milestone not found");
      ticket.milestone = milestone;
    } else if (data.milestone_id === null) {
      // If milestone_id is explicitly set to null, auto-assign to Support milestone
      const supportMilestone = await milestoneRepository.findOne({
        where: { 
          project: { id: ticket.project.id }, 
          name: "Support", 
          deleted: false 
        }
      });
      
      if (supportMilestone) {
        ticket.milestone = supportMilestone;
      } else {
        throw new AppError(400, "Support milestone not found for this project");
      }
    }
    // If milestone_id is not provided in the update, keep the existing milestone

    if (data.title !== undefined) ticket.title = data.title;
    if (data.description !== undefined) ticket.description = data.description;
    if (data.status !== undefined) ticket.status = data.status;
    if (data.priority !== undefined) ticket.priority = data.priority;
    if (data.assigned_to !== undefined) ticket.assigned_to = data.assigned_to;
    if (data.image_url !== undefined) ticket.image_url = data.image_url;
    if (data.remark !== undefined) ticket.remark = data.remark;

    const savedTicket = await repo.save(ticket);
    
    // Return the ticket with relationships loaded using QueryBuilder
    return await repo.createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.milestone", "milestone")
      .where("ticket.id = :id", { id: savedTicket.id })
      .getOne();
  };

  const updateTicketStatus = async (id: string, status: string, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(Ticket) : ticketRepo;

    const ticket = await repo.findOne({ where: { id, deleted: false } });
    if (!ticket) throw new AppError(404, "Ticket not found");

    ticket.status = status;

    const saved = await repo.save(ticket);

    return await repo.createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.milestone", "milestone")
      .where("ticket.id = :id", { id: saved.id })
      .getOne();
  };

  const deleteTicket = async (id: string, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(Ticket) : ticketRepo;
    
    const ticket = await repo.findOne({ where: { id, deleted: false } });
    if (!ticket) throw new AppError(404, "Ticket not found");

    ticket.deleted = true;
    ticket.deleted_at = new Date();

    return await repo.save(ticket);
  };

  return {
    createTicket,
    getAllTickets,
    getTicketById,
    getTicketsByProject,
    getTicketsByMilestone,
    updateTicket,
    updateTicketStatus,
    deleteTicket,
  };
};
