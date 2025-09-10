import { AppDataSource } from "../utils/data-source";
import { TicketComment } from "../entities/ticket-comment.entity";
import { Ticket } from "../entities/ticket.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";
import { NotificationType } from "../entities/notification.entity";
import { NotificationService } from "./notification.service";

const ticketCommentRepo = AppDataSource.getRepository(TicketComment);
const ticketRepo = AppDataSource.getRepository(Ticket);
const userRepo = AppDataSource.getRepository(User);
const Notification = NotificationService();

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
        // Verify ticket exists and get last comment with user relations in one query
        const ticket = await ticketRepo.findOne({ 
            where: { id: data.ticket_id, deleted: false },
            relations: ["project", "milestone"]
        });
        if (!ticket) {
            throw new AppError(404, "Ticket not found");
        }

        // Verify user exists with role relation
        const user = await userRepo.findOne({ 
            where: { id: userId, deleted: false },
            relations: ["role"]
        });
        if (!user) {
            throw new AppError(404, "User not found");
        }

        // Get the last comment with user and role relations
        const lastComment = await ticketCommentRepo.findOne({
            where: { ticket: { id: ticket.id } },
            order: { created_at: 'DESC' },
            relations: ["user", "user.role"]
        });

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
        
        // Send notification only if there was a previous comment from different user
        if (lastComment && lastComment.user.id !== user.id) {
            await sendTicketCommentNotification(
                lastComment.user, // Notify the last commenter
                user,            // Current commenter
                ticket,
                savedComment
            );
        }

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

    const sendTicketCommentNotification = async (
        recipient: User,
        commenter: User,
        ticket: Ticket,
        comment: TicketComment
    ) => {
        try {
            // Determine user type based on role
            const commenterRole = commenter.role?.role?.toLowerCase() || '';
            const commenterType = commenterRole === 'client' ? 'Client' : 'Staff';

            const message = `${commenterType} ${commenter.first_name} ${commenter.last_name} replied to your comment on ticket "${ticket.title}"`;

            await Notification.createNotification(
                recipient.id,
                NotificationType.TICKET_COMMENT_ADDED,
                message,
                {
                    ticketId: ticket.id,
                    ticketTitle: ticket.title,
                    commentId: comment.id,
                    commenterId: commenter.id,
                    commenterName: `${commenter.first_name} ${commenter.last_name}`,
                    commenterType: commenterType,
                    commentedAt: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('Failed to send ticket comment notification:', error);
        }
    };

    return {
        sendTicketCommentNotification,
        createTicketComment,
        getAllTicketComments,
        getTicketCommentById,
        updateTicketComment,
        deleteTicketComment,
    };
};
