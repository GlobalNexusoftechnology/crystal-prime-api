import { Request, Response, NextFunction } from "express";
import { TicketCommentService } from "../services/ticket-comment.service";
import { createTicketCommentSchema, updateTicketCommentSchema, getTicketCommentsSchema } from "../schemas/ticket-comment.schema";

const service = TicketCommentService();

export const ticketCommentController = () => {
    const createTicketComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = createTicketCommentSchema.parse(req);
            const userId = res.locals.user.id;
            
            if (!userId) {
                return res.status(401).json({ 
                    status: "error", 
                    message: "User not authenticated" 
                });
            }

            const result = await service.createTicketComment(parsed.body, userId);
            res.status(201).json({ 
                status: "success", 
                message: "Ticket comment created successfully",
                data: result 
            });
        } catch (err) {
            next(err);
        }
    };

    const getAllTicketComments = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = getTicketCommentsSchema.parse(req);
            const result = await service.getAllTicketComments(parsed.params.ticket_id);
            res.status(200).json({
                status: "success",
                message: "Ticket comments fetched successfully",
                data: { list: result.data, total: result.total },
            });
        } catch (err) {
            next(err);
        }
    };

    const getTicketCommentById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await service.getTicketCommentById(id);
            res.status(200).json({ 
                status: "success", 
                message: "Ticket comment fetched successfully",
                data: result 
            });
        } catch (err) {
            next(err);
        }
    };

    const updateTicketComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const parsed = updateTicketCommentSchema.parse(req);
            const result = await service.updateTicketComment(id, parsed.body);
            res.status(200).json({ 
                status: "success", 
                message: "Ticket comment updated successfully",
                data: result 
            });
        } catch (err) {
            next(err);
        }
    };

    const deleteTicketComment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await service.deleteTicketComment(id);
            res.status(200).json({ 
                status: "success", 
                message: "Ticket comment deleted successfully",
                data: result 
            });
        } catch (err) {
            next(err);
        }
    };

    return {
        createTicketComment,
        getAllTicketComments,
        getTicketCommentById,
        updateTicketComment,
        deleteTicketComment,
    };
};
