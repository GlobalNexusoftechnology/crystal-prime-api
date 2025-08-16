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

  const getAllTickets = async () => {
    const data = await ticketRepo.find({
      where: { deleted: false },
      relations: ["project"],
    });
    return { data, total: data.length };
  };

  const getTicketById = async (id: string) => {
    const ticket = await ticketRepo.findOne({ 
      where: { id, deleted: false }, 
      relations: ["project"] 
    });
    if (!ticket) throw new AppError(404, "Ticket not found");
    return ticket;
  };

  const getTicketsByProject = async (projectId: string) => {
    const data = await ticketRepo.find({
      where: { 
        project: { id: projectId },
        deleted: false 
      },
      relations: ["project"],
    });
    return { data, total: data.length };
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
