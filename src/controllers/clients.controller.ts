import { Request, Response, NextFunction } from "express";
import { ClientService } from "../services/clients.service";
import {
  createClientSchema,
  updateClientSchema,
} from "../schemas/clients.schema";
import { findUserById } from "../services/user.service";

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


  const exportClientsExcelController = async (req: Request, res: Response) => {
    try {
      const userId = res.locals.user.id;
      const userData = await findUserById(userId);
      const userRole = userData.role.role;

      const workbook = await service.exportClientsToExcel(userId, userRole);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=clients_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error exporting clients:", error);
      res.status(500).json({ message: "Failed to export clients" });
    }
  };

  // controllers/clients.controller.ts
  const downloadClientTemplate = async (req: Request, res: Response) => {
    try {
      const workbook = await service.generateClientTemplate();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=clients_template.xlsx"
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error generating client template:", error);
      res.status(500).json({ message: "Failed to download client template" });
    }
  };



  // Return all controller methods
  return {
    createClient,
    getAllClients,
    getClientById,
    updateClient,
    softDeleteClient,
    exportClientsExcelController,
    downloadClientTemplate
  };
};