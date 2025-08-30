import { AppDataSource } from "../utils/data-source";
import { TicketComment } from "../entities/ticket-comment.entity";
import { Ticket } from "../entities/ticket.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";

const ticketCommentRepo = AppDataSource.getRepository(TicketComment);
const ticketRepo = AppDataSource.getRepository(Ticket);
const userRepo = AppDataSource.getRepository(User);

interface TicketCommentInput {
    ticket_id: string;
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    remark?: string;
}

export const TicketCommentService = () => {
    const createTicketComment = async (data: TicketCommentInput, userId: string) => {
        // Verify ticket exists
        const ticket = await ticketRepo.findOne({ 
            where: { id: data.ticket_id, deleted: false },
            relations: ["project", "milestone"]
        });
        if (!ticket) {
            throw new AppError(404, "Ticket not found");
        }

        // Verify user exists
        const user = await userRepo.findOne({ where: { id: userId, deleted: false } });
        if (!user) {
            throw new AppError(404, "User not found");
        }

        // Auto-populate title and description from ticket if not provided
        const title = data.title || ticket.title;
        const description = data.description || ticket.description;

        const ticketComment = ticketCommentRepo.create({
            ticket,
            user,
            title,
            description,
            status: data.status || ticket.status,
            priority: data.priority || ticket.priority,
            remark: data.remark,
        });

        const savedComment = await ticketCommentRepo.save(ticketComment);
        
        // Return the comment with relationships loaded
        return await ticketCommentRepo.createQueryBuilder("comment")
            .leftJoinAndSelect("comment.ticket", "ticket")
            .leftJoinAndSelect("comment.user", "user")
            .leftJoinAndSelect("ticket.project", "project")
            .leftJoinAndSelect("ticket.milestone", "milestone")
            .where("comment.id = :id", { id: savedComment.id })
            .getOne();
    };

    const getAllTicketComments = async (ticketId: string) => {
        const ticket = await ticketRepo.findOne({ where: { id: ticketId, deleted: false } });
        if (!ticket) {
            throw new AppError(404, "Ticket not found");
        }

        const comments = await ticketCommentRepo.createQueryBuilder("comment")
            .leftJoinAndSelect("comment.ticket", "ticket")
            .leftJoinAndSelect("comment.user", "user")
            .leftJoinAndSelect("ticket.project", "project")
            .leftJoinAndSelect("ticket.milestone", "milestone")
            .where("ticket.id = :ticketId", { ticketId })
            .andWhere("comment.deleted = false")
            .orderBy("comment.created_at", "DESC")
            .getMany();

        return { data: comments, total: comments.length };
    };

    const getTicketCommentById = async (id: string) => {
        const comment = await ticketCommentRepo.createQueryBuilder("comment")
            .leftJoinAndSelect("comment.ticket", "ticket")
            .leftJoinAndSelect("comment.user", "user")
            .leftJoinAndSelect("ticket.project", "project")
            .leftJoinAndSelect("ticket.milestone", "milestone")
            .where("comment.id = :id", { id })
            .andWhere("comment.deleted = false")
            .getOne();
            
        if (!comment) {
            throw new AppError(404, "Ticket comment not found");
        }
        return comment;
    };

    const updateTicketComment = async (id: string, data: Partial<TicketCommentInput>) => {
        const comment = await ticketCommentRepo.findOne({
            where: { id, deleted: false },
            relations: ["ticket", "user"],
        });
        if (!comment) {
            throw new AppError(404, "Ticket comment not found");
        }

        if (data.title !== undefined) comment.title = data.title;
        if (data.description !== undefined) comment.description = data.description;
        if (data.status !== undefined) comment.status = data.status;
        if (data.priority !== undefined) comment.priority = data.priority;
        if (data.remark !== undefined) comment.remark = data.remark;

        const savedComment = await ticketCommentRepo.save(comment);
        
        // Return the updated comment with relationships loaded
        return await ticketCommentRepo.createQueryBuilder("comment")
            .leftJoinAndSelect("comment.ticket", "ticket")
            .leftJoinAndSelect("comment.user", "user")
            .leftJoinAndSelect("ticket.project", "project")
            .leftJoinAndSelect("ticket.milestone", "milestone")
            .where("comment.id = :id", { id: savedComment.id })
            .getOne();
    };

    const deleteTicketComment = async (id: string) => {
        const comment = await ticketCommentRepo.findOne({
            where: { id, deleted: false },
        });
        if (!comment) {
            throw new AppError(404, "Ticket comment not found");
        }

        comment.deleted = true;
        comment.deleted_at = new Date();
        return await ticketCommentRepo.save(comment);
    };

    return {
        createTicketComment,
        getAllTicketComments,
        getTicketCommentById,
        updateTicketComment,
        deleteTicketComment,
    };
};
