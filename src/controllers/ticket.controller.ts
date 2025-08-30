import { Request, Response, NextFunction } from "express";
import { TicketService } from "../services/ticket.service";
import { createTicketSchema, updateTicketSchema, updateTicketStatusSchema } from "../schemas/ticket.schema";

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
      const searchText = req.query.searchText as string | undefined;
      const status = req.query.status as string | undefined;
      const priority = req.query.priority as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const filters = {
        searchText,
        status,
        priority,
        page,
        limit
      };

      const result = await service.getAllTickets(filters);
      res.status(200).json({
        status: "success",
        message: "All Tickets fetched",
        data: { list: result.data, pagination: result.pagination },
      });
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
      const searchText = req.query.searchText as string | undefined;
      const status = req.query.status as string | undefined;
      const priority = req.query.priority as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const filters = {
        searchText,
        status,
        priority,
        page,
        limit
      };

      const result = await service.getTicketsByProject(projectId, filters);
      res.status(200).json({
        status: "success",
        message: "Project Tickets fetched",
        data: { list: result.data, pagination: result.pagination },
      });
    } catch (err) {
      next(err);
    }
  };

  const getTicketsByMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { milestoneId } = req.params;
      const searchText = req.query.searchText as string | undefined;
      const status = req.query.status as string | undefined;
      const priority = req.query.priority as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const filters = {
        searchText,
        status,
        priority,
        page,
        limit
      };

      const result = await service.getTicketsByMilestone(milestoneId, filters);
      res.status(200).json({
        status: "success",
        message: "Milestone Tickets fetched",
        data: { list: result.data, pagination: result.pagination },
      });
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

  const updateTicketStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updateTicketStatusSchema.parse(req.body);
      const result = await service.updateTicketStatus(id, parsed.status);
      res.status(200).json({ status: "success", message: "Ticket status updated", data: result });
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
    getTicketsByMilestone,
    updateTicket,
    updateTicketStatus,
    deleteTicket,
  };
};
