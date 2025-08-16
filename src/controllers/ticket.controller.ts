import { Request, Response, NextFunction } from "express";
import { TicketService } from "../services/ticket.service";
import { createTicketSchema, updateTicketSchema } from "../schemas/ticket.schema";

const service = TicketService();

export const ticketController = () => {
  const createTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createTicketSchema.parse(req.body);
      const result = await service.createTicket(parsed);
      res.status(201).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  };

  const getAllTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.getAllTickets();
      res.status(200).json({ status: "success", ...result });
    } catch (err) {
      next(err);
    }
  };

  const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getTicketById(id);
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  };

  const getTicketsByProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      const result = await service.getTicketsByProject(projectId);
      res.status(200).json({ status: "success", ...result });
    } catch (err) {
      next(err);
    }
  };

  const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updateTicketSchema.parse(req.body);
      const result = await service.updateTicket(id, parsed);
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  };

  const deleteTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.deleteTicket(id);
      res.status(200).json({ status: "success", message: "Ticket deleted", data: result });
    } catch (err) {
      next(err);
    }
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
