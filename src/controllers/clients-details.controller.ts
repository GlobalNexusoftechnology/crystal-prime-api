import { Request, Response, NextFunction } from "express";
import { ClientDetailsService } from "../services/clients-details.service";
import {
  CreateClientDetailsSchema,
  UpdateClientDetailsSchema,
} from "../schemas/clients-details.schema";

const service = ClientDetailsService();

export const clientDetailsController = () => {
  //  Create Client Details
  const createClientDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsedData = CreateClientDetailsSchema.parse(req.body);
      const result = await service.createClientDetail(parsedData);
      res.status(201).json({
        status: "success",
        message: "Client details created",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  //  Get All Client Details
  const getAllClientDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await service.getAllClientDetails();
      res.status(200).json({
        status: "success",
        message: "All client details fetched",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  //  Get Client Details by ID
  const getClientDetailsById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.getClientDetailById(id);
      res.status(200).json({
        status: "success",
        message: "Client details fetched",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update Client Details
  const updateClientDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const parsedData = UpdateClientDetailsSchema.parse(req.body);
      const result = await service.updateClientDetail(id, parsedData);
      res.status(200).json({
        status: "success",
        message: "Client details updated",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Client Details
  const softDeleteClientDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.deleteClientDetail(id);
      res.status(200).json({
        status: "success",
        message: "Client details deleted",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    createClientDetails,
    getAllClientDetails,
    getClientDetailsById,
    updateClientDetails,
    softDeleteClientDetails,
  };
};
