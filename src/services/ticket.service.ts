import { AppDataSource } from "../utils/data-source";
import { Ticket } from "../entities/ticket.entity";
import { Project } from "../entities/projects.entity";
import { ProjectTasks } from "../entities/project-task.entity";
import AppError from "../utils/appError";

const ticketRepo = AppDataSource.getRepository(Ticket);
const projectRepo = AppDataSource.getRepository(Project);
const taskRepo = AppDataSource.getRepository(ProjectTasks);

interface TicketInput {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  project_id: string;
  task_id?: string;
  image_url?: string;
  remark?: string;
}

export const TicketService = () => {
  const createTicket = async (data: TicketInput, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(Ticket) : ticketRepo;
    const projectRepository = queryRunner ? queryRunner.manager.getRepository(Project) : projectRepo;
    const taskRepository = queryRunner ? queryRunner.manager.getRepository(ProjectTasks) : taskRepo;
    
    const project = await projectRepository.findOne({ where: { id: data.project_id } });
    if (!project) throw new AppError(404, "Project not found");

    let task = null;
    if (data.task_id) {
      task = await taskRepository.findOne({ where: { id: data.task_id } });
      if (!task) throw new AppError(404, "Task not found");
    }

    const ticket = repo.create({
      title: data.title,
      description: data.description,
      status: data.status || "Open",
      priority: data.priority || "Medium",
      project,
      task,
      image_url: data.image_url,
      remark: data.remark,
    });

    const savedTicket = await repo.save(ticket);
    
    // Return the ticket with relationships loaded using QueryBuilder
    return await repo.createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.task", "task")
      .leftJoinAndSelect("task.milestone", "milestone")
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
      .leftJoinAndSelect("ticket.task", "task")
      .leftJoinAndSelect("task.milestone", "milestone")
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
      .leftJoinAndSelect("ticket.task", "task")
      .leftJoinAndSelect("task.milestone", "milestone")
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
      .leftJoinAndSelect("ticket.task", "task")
      .leftJoinAndSelect("task.milestone", "milestone")
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

  const getTicketsByTask = async (taskId: string, filters: any = {}) => {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const { searchText, status, priority } = filters;

    let query = ticketRepo.createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.task", "task")
      .leftJoinAndSelect("task.milestone", "milestone")
      .where("ticket.deleted = false")
      .andWhere("task.id = :taskId", { taskId });

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
    const taskRepository = queryRunner ? queryRunner.manager.getRepository(ProjectTasks) : taskRepo;
    
    const ticket = await repo.findOne({ 
      where: { id, deleted: false }, 
      relations: ["project", "task"] 
    });
    if (!ticket) throw new AppError(404, "Ticket not found");

    if (data.project_id) {
      const project = await projectRepository.findOne({ where: { id: data.project_id } });
      if (!project) throw new AppError(404, "Project not found");
      ticket.project = project;
    }

    if (data.task_id) {
      const task = await taskRepository.findOne({ where: { id: data.task_id } });
      if (!task) throw new AppError(404, "Task not found");
      ticket.task = task;
    }

    if (data.title !== undefined) ticket.title = data.title;
    if (data.description !== undefined) ticket.description = data.description;
    if (data.status !== undefined) ticket.status = data.status;
    if (data.priority !== undefined) ticket.priority = data.priority;
    if (data.image_url !== undefined) ticket.image_url = data.image_url;
    if (data.remark !== undefined) ticket.remark = data.remark;

    const savedTicket = await repo.save(ticket);
    
    // Return the ticket with relationships loaded using QueryBuilder
    return await repo.createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.task", "task")
      .leftJoinAndSelect("task.milestone", "milestone")
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
      .leftJoinAndSelect("ticket.task", "task")
      .leftJoinAndSelect("task.milestone", "milestone")
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
    getTicketsByTask,
    updateTicket,
    updateTicketStatus,
    deleteTicket,
  };
};
