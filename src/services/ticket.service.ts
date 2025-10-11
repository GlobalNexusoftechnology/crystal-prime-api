import { AppDataSource } from "../utils/data-source";
import { Ticket } from "../entities/ticket.entity";
import { Project } from "../entities/projects.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import AppError from "../utils/appError";
import { TaskStatusService } from "./task-status.service";
import { transporter } from "../utils";
import { string } from "zod";

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
  const { updateProjectStatus } = TaskStatusService();

  const sendTicketCreatedMail = async (
    emails: string[],
    ticketTitle: string,
    projectName: string,
    clientName: string,
    clientEmail: string,
    clientPhone: string,
    description: string,
    priority: string,
    status: string
  ) => {
    const mailOptions = {
      from: `"Support System" <${process.env.EMAIL_USER}>`,
      to: emails.join(", "),
      subject: `New Ticket Created: ${ticketTitle}`,
      html: `
      <h3>New Ticket Created</h3>
      <p><strong>Ticket Title:</strong> ${ticketTitle}</p>
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Client Name:</strong> ${clientName || "N/A"}</p>
      <p><strong>Client Email:</strong> ${clientEmail || "N/A"}</p>
      <p><strong>Client Phone:</strong> ${clientPhone || "N/A"}</p>
      <p><strong>Description:</strong> ${
        description || "No description provided"
      }</p>
      <p><strong>Priority:</strong> ${priority}</p>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Created At:</strong> ${new Date().toLocaleString()}</p>
      <br/>
      <p>Please check the system for more details.</p>
    `,
    };

    await transporter.sendMail(mailOptions);
  };
  const updateSupportMilestoneAndProject = async (
    milestoneId: string | undefined,
    projectId: string | undefined,
    queryRunner?: any
  ) => {
    if (!milestoneId || !projectId) return;

    const ticketRepository = queryRunner
      ? queryRunner.manager.getRepository(Ticket)
      : ticketRepo;
    const milestoneRepository = queryRunner
      ? queryRunner.manager.getRepository(ProjectMilestones)
      : milestoneRepo;

    const milestone = await milestoneRepository.findOne({
      where: { id: milestoneId, deleted: false },
    });
    if (!milestone) return;

    // Only apply special rules for Support milestone
    if (milestone.name?.toLowerCase() !== "support") {
      // Still refresh project status because tickets changed may impact overall rules
      await updateProjectStatus(projectId, queryRunner);
      return;
    }

    const tickets = await ticketRepository.find({
      where: { milestone: { id: milestoneId }, deleted: false },
    });

    if (tickets.length === 0) {
      // No tickets under support milestone -> milestone stays Open
      if (milestone.status !== "Open") {
        milestone.status = "Open";
        await milestoneRepository.save(milestone);
      }
      await updateProjectStatus(projectId, queryRunner);
      return;
    }

    const statuses = tickets.map((t: any) => (t.status || "").toLowerCase());
    const allOpen =
      statuses.length > 0 && statuses.every((s: string) => s === "open");
    const anyInProgress = statuses.some(
      (s: string) => s === "in progress" || s === "in-progress"
    );
    const allCompleted =
      statuses.length > 0 && statuses.every((s: string) => s === "completed");

    let newStatus = milestone.status;
    if (anyInProgress) {
      newStatus = "In Progress";
    } else if (allOpen) {
      newStatus = "Open";
    } else if (allCompleted) {
      newStatus = "Completed";
    } else {
      // Mixed Open and Completed -> In Progress
      newStatus = "In Progress";
    }

    if (newStatus !== milestone.status) {
      milestone.status = newStatus;
      await milestoneRepository.save(milestone);
    }

    // Update project status based on consolidated rules
    await updateProjectStatus(projectId, queryRunner);
  };
  const createTicket = async (data: TicketInput, queryRunner?: any) => {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(Ticket)
      : ticketRepo;
    const projectRepository = queryRunner
      ? queryRunner.manager.getRepository(Project)
      : projectRepo;
    const milestoneRepository = queryRunner
      ? queryRunner.manager.getRepository(ProjectMilestones)
      : milestoneRepo;

    const project = await projectRepository.findOne({
      where: { id: data.project_id },
    });
    if (!project) throw new AppError(404, "Project not found");

    let milestone = null;
    if (data.milestone_id) {
      milestone = await milestoneRepository.findOne({
        where: { id: data.milestone_id },
      });
      if (!milestone) throw new AppError(404, "Milestone not found");
    } else {
      // Auto-assign to Support milestone
      milestone = await milestoneRepository.findOne({
        where: {
          project: { id: data.project_id },
          name: "Support",
          deleted: false,
        },
        relations: ["project"],
      });

      if (!milestone) {
        // Try to create Support milestone if it doesn't exist
        const project = await projectRepository.findOne({
          where: { id: data.project_id },
        });
        if (!project) throw new AppError(404, "Project not found");

        // Create Support milestone
        const supportMilestone = milestoneRepository.create({
          name: "Support",
          description:
            "Support and maintenance milestone for ongoing project support",
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
      // remark: data.remark,
    });

    const savedTicket = await repo.save(ticket);

    const projectWithClient = await projectRepository.findOne({
      where: { id: data.project_id },
      relations: ["client"], // ← THIS LOADS CLIENT RELATION
    });

    let clientName = "N/A";
    let clientEmail = "N/A";
    let clientPhone = "N/A";

    if (projectWithClient && projectWithClient.client) {
      clientName = projectWithClient.client.name || "N/A";
      clientEmail = projectWithClient.client.email || "N/A";
      clientPhone = projectWithClient.client.contact_number || "N/A";
    }

    try {
      const Email_NOTIFY_ONE = process.env.EMAI_TICKET_NOTIFY_ONE as string;
      const Email_NOTIFY_TWO = process.env.EMAI_TICKET_NOTIFY_TWO as string;
      await sendTicketCreatedMail(
        [Email_NOTIFY_ONE, Email_NOTIFY_TWO],
        savedTicket.title,
        project.name,
        clientName,
        clientEmail,
        clientPhone,
        savedTicket.description,
        savedTicket.priority,
        savedTicket.status
      );
    } catch (emailError) {
      console.log("Email sending failed (non-critical):", emailError);
    }
    // Cascade status for Support milestone and project after creation
    await updateSupportMilestoneAndProject(
      savedTicket.milestone?.id,
      savedTicket.project?.id,
      queryRunner
    );

    // Return the ticket with relationships loaded using QueryBuilder
    return await repo
      .createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.milestone", "milestone")
      .where("ticket.id = :id", { id: savedTicket.id })
      .getOne();
  };

  const getAllTickets = async (filters: any = {}, currentUser?: any) => {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;
  
    const { searchText, status, priority } = filters;
  
    let query = ticketRepo.createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.milestone", "milestone")
      .where("ticket.deleted = false");
  
    // Client filtering based on your entity relationships
    if (currentUser && currentUser.clientId) {
      console.log('🔒 Filtering tickets for client ID:', currentUser.clientId);
      
      // Join project -> client and filter by client ID
      // This follows: Ticket -> Project -> Client
      query = query
        .innerJoinAndSelect("project.client", "client") // Join project.client relation
        .andWhere("client.id = :clientId", { clientId: currentUser.clientId });
    } else {
      console.log('👨‍💼 No client filtering - showing all tickets');
      query = query
        .leftJoinAndSelect("project.client", "client"); // Still join client for data
    }
  
    if (searchText && searchText.trim() !== "") {
      const search = `%${searchText.trim().toLowerCase()}%`;
      query = query.andWhere(
        `LOWER(ticket.title) LIKE :search OR LOWER(ticket.description) LIKE :search OR LOWER(ticket.status) LIKE :search OR LOWER(ticket.priority) LIKE :search OR LOWER(project.name) LIKE :search`,
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
  
    console.log(`📊 Found ${total} tickets for user ${currentUser?.id} with role ${currentUser?.role}`);
  
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
    const ticket = await ticketRepo
      .createQueryBuilder("ticket")
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

    let query = ticketRepo
      .createQueryBuilder("ticket")
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
      query = query.andWhere("LOWER(ticket.status) = LOWER(:status)", {
        status,
      });
    }

    if (priority && priority.trim() !== "") {
      query = query.andWhere("LOWER(ticket.priority) = LOWER(:priority)", {
        priority,
      });
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

  const getTicketsByMilestone = async (
    milestoneId: string,
    filters: any = {}
  ) => {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const { searchText, status, priority } = filters;

    let query = ticketRepo
      .createQueryBuilder("ticket")
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
      query = query.andWhere("LOWER(ticket.status) = LOWER(:status)", {
        status,
      });
    }

    if (priority && priority.trim() !== "") {
      query = query.andWhere("LOWER(ticket.priority) = LOWER(:priority)", {
        priority,
      });
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

  const updateTicket = async (
    id: string,
    data: Partial<TicketInput>,
    queryRunner?: any
  ) => {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(Ticket)
      : ticketRepo;
    const projectRepository = queryRunner
      ? queryRunner.manager.getRepository(Project)
      : projectRepo;
    const milestoneRepository = queryRunner
      ? queryRunner.manager.getRepository(ProjectMilestones)
      : milestoneRepo;

    const ticket = await repo.findOne({
      where: { id, deleted: false },
      relations: ["project", "milestone"],
    });
    if (!ticket) throw new AppError(404, "Ticket not found");

    if (data.project_id) {
      const project = await projectRepository.findOne({
        where: { id: data.project_id },
      });
      if (!project) throw new AppError(404, "Project not found");
      ticket.project = project;
    }

    if (data.milestone_id) {
      const milestone = await milestoneRepository.findOne({
        where: { id: data.milestone_id },
      });
      if (!milestone) throw new AppError(404, "Milestone not found");
      ticket.milestone = milestone;
    } else if (data.milestone_id === null) {
      // If milestone_id is explicitly set to null, auto-assign to Support milestone
      const supportMilestone = await milestoneRepository.findOne({
        where: {
          project: { id: ticket.project.id },
          name: "Support",
          deleted: false,
        },
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
    // if (data.remark !== undefined) ticket.remark = data.remark;

    const savedTicket = await repo.save(ticket);

    // Cascade status for Support milestone and project after update
    await updateSupportMilestoneAndProject(
      savedTicket.milestone?.id,
      savedTicket.project?.id,
      queryRunner
    );

    // Return the ticket with relationships loaded using QueryBuilder
    return await repo
      .createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.milestone", "milestone")
      .where("ticket.id = :id", { id: savedTicket.id })
      .getOne();
  };

  const updateTicketStatus = async (
    id: string,
    status: string,
    queryRunner?: any
  ) => {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(Ticket)
      : ticketRepo;

    const ticket = await repo.findOne({
      where: { id, deleted: false },
      relations: ["project", "milestone"],
    });
    if (!ticket) throw new AppError(404, "Ticket not found");

    ticket.status = status;

    const saved = await repo.save(ticket);

    // Cascade status for Support milestone and project after status change
    await updateSupportMilestoneAndProject(
      saved.milestone?.id,
      saved.project?.id,
      queryRunner
    );

    return await repo
      .createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.project", "project")
      .leftJoinAndSelect("ticket.milestone", "milestone")
      .where("ticket.id = :id", { id: saved.id })
      .getOne();
  };

  const deleteTicket = async (id: string, queryRunner?: any) => {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(Ticket)
      : ticketRepo;

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
