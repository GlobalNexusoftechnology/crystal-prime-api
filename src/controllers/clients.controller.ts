import { Request, Response, NextFunction } from "express";
import { ClientService } from "../services/clients.service";
import {
  createClientSchema,
  updateClientSchema,
} from "../schemas/clients.schema";

const service = ClientService();

export const clientController = () => {
  // Create Client
  const createClient = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsedData = createClientSchema.parse(req.body); // Validate input
      const result = await service.createClient(parsedData);
      res.status(201).json({
        status: "success",
        message: "clients created",
        data: result,
      });
    } catch (error) {
      next(error); 
    }
  };

  
  // Get All Clients
  const getAllClients = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await service.getAllClients();
      res.status(200).json({
       status: "success",
        message: "All Client fetched",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Client by ID
  const getClientById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.getClientById(id);
      res.status(200).json({
        status: "success",
        message: "Client fetched by id",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  
  // Update Client
  const updateClient = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const parsedData = updateClientSchema.parse(req.body); // Validate input
      const result = await service.updateClient(id, parsedData);
      res.status(200).json({
        status: "success",
        message: "client updated",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Client
  const softDeleteClient = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteClient(id);
      res.status(200).json({
        status: "success",
        message: "Client deleted",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Return all controller methods
  return {
    createClient,
    getAllClients,
    getClientById,
    updateClient,
    softDeleteClient
  };
};