import { Request, Response, NextFunction } from "express";
import { TicketService } from "../services/ticket.service";
import {
  createTicketSchema,
  updateTicketSchema,
  updateTicketStatusSchema,
} from "../schemas/ticket.schema";
import { AppDataSource } from "../utils/data-source";
import { User } from "../entities";
import { AppError } from "../utils";

const service = TicketService();

export const ticketController = () => {
  const createTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = createTicketSchema.parse(req.body);
      const result = await service.createTicket(parsed);
      res.status(201).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  };

  const getAllTickets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {      
      const userId = req.query.userId as string;
      const userRepository = AppDataSource.getRepository(User)
      
      // Load user with client relation
      const userData = await userRepository.findOne({
        where: { id: userId, deleted: false },
        relations: ["role", "client"] // Load client relation
      });
  
      if (!userData) {
        throw new AppError(404, "User not found.");
      }
  
      const userRole = userData.role.role;
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
        limit,
        userId
      };
  
      // Determine clientId based on user role and client relation
      let clientId = null;
      
      if (userRole === 'client') {
        // If user role is 'client', they are the client themselves
        if (userData.client && userData.client.id) {
          clientId = userData.client.id;
          console.log('User is a client, using client ID:', clientId);
        } else {
          console.log('User has client role but no client record found');
        }
      } else {
        // For other roles, check if they have a client association
        if (userData.client && userData.client.id) {
          clientId = userData.client.id;
          console.log('User has client association, using client ID:', clientId);
        }
      }
  
      const currentUser = {
        id: userId,
        role: userRole,
        clientId: clientId
      };
  
      console.log('Final currentUser for filtering:', currentUser);
  
      const result = await service.getAllTickets(filters, currentUser);
      res.status(200).json({
        status: "success",
        message: "All Tickets fetched",
        data: { list: result.data, pagination: result.pagination },
      });
    } catch (err) {
      next(err);
    }
  };

  const getTicketById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.getTicketById(id);
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  };

  const getTicketsByProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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
        limit,
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

  const updateTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const parsed = updateTicketSchema.parse(req.body);
      const result = await service.updateTicket(id, parsed);
      res.status(200).json({
        status: "success",
        message: "Ticket updated successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  const updateTicketStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const parsed = updateTicketStatusSchema.parse(req.body);
      const result = await service.updateTicketStatus(id, parsed.status);
      res
        .status(200)
        .json({
          status: "success",
          message: "Ticket status updated",
          data: result,
        });
    } catch (err) {
      next(err);
    }
  };

  const deleteTicket = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.deleteTicket(id);
      res
        .status(200)
        .json({ status: "success", message: "Ticket deleted", data: result });
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
    updateTicketStatus,
    deleteTicket,
  };
};
