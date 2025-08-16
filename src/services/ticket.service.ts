import { AppDataSource } from "../utils/data-source";
import { Ticket } from "../entities/ticket.entity";
import { Project } from "../entities/projects.entity";
import AppError from "../utils/appError";

const ticketRepo = AppDataSource.getRepository(Ticket);
const projectRepo = AppDataSource.getRepository(Project);

interface TicketInput {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  project_id: string;
  image_url?: string;
  remark?: string;
}

export const TicketService = () => {
  const createTicket = async (data: TicketInput, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(Ticket) : ticketRepo;
    const projectRepository = queryRunner ? queryRunner.manager.getRepository(Project) : projectRepo;
    
    const project = await projectRepository.findOne({ where: { id: data.project_id } });
    if (!project) throw new AppError(404, "Project not found");

    const ticket = repo.create({
      title: data.title,
      description: data.description,
      status: data.status || "Open",
      priority: data.priority || "Medium",
      project,
      image_url: data.image_url,
      remark: data.remark,
    });

    return await repo.save(ticket);
  };

  const getAllTickets = async (filters: any = {}) => {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const { searchText, status, priority } = filters;

    let query = ticketRepo.createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
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
    const ticket = await ticketRepo.findOne({ 
      where: { id, deleted: false }, 
      relations: ["project"] 
    });
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

  const updateTicket = async (id: string, data: Partial<TicketInput>, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(Ticket) : ticketRepo;
    const projectRepository = queryRunner ? queryRunner.manager.getRepository(Project) : projectRepo;
    
    const ticket = await repo.findOne({ 
      where: { id, deleted: false }, 
      relations: ["project"] 
    });
    if (!ticket) throw new AppError(404, "Ticket not found");

    if (data.project_id) {
      const project = await projectRepository.findOne({ where: { id: data.project_id } });
      if (!project) throw new AppError(404, "Project not found");
      ticket.project = project;
    }

    if (data.title !== undefined) ticket.title = data.title;
    if (data.description !== undefined) ticket.description = data.description;
    if (data.status !== undefined) ticket.status = data.status;
    if (data.priority !== undefined) ticket.priority = data.priority;
    if (data.image_url !== undefined) ticket.image_url = data.image_url;
    if (data.remark !== undefined) ticket.remark = data.remark;

    return await repo.save(ticket);
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
    updateTicket,
    deleteTicket,
  };
};
