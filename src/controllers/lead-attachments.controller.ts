import { Request, Response, NextFunction } from "express";
import { LeadAttachmentService } from "../services/lead-attachments.service";
import { createLeadAttachment, updateLeadAttachment } from "../schemas/lead-attachments.schema";

const service = LeadAttachmentService();

export const leadAttachmentController = () => {

  //  Create
  const createAttachment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = createLeadAttachment.parse(req.body);
      const result = await service.createAttachment(parsedData);
      res.status(201).json({ status: "success", message: "Attachment created", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Get All
  const getAllAttachments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.getAllAttachments();
      res.status(200).json({ status: "success", message: "All Attachment get", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Get by ID
  const getAttachmentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getAttachmentById(id);
      res.status(200).json({ status: "success", message: "Attachment get by id", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Update
  const updateAttachment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsedData = updateLeadAttachment.parse(req.body);
      const result = await service.updateAttachment(id, parsedData);
      res.status(200).json({ status: "success", message: "Attachment updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Soft Delete
  const softDeleteAttachment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteAttachment(id);
      res.status(200).json({ status: "success", message: "Attachment deleted", data: result });
    } catch (error) {
      next(error);
    }
  };

 //download student application form pdf
  const uploadAttachmentHandler = async (req: Request, res: Response) => {
    try {
      const { leadId, link, userId } = req.body;
      const file = req.file;

      if (!leadId) {
        return res.status(400).json({ message: "leadId is required" });
      }

      const attachment = await service.uploadLeadAttachment(leadId, file, link, userId);

      res.status(201).json({
        message: "Attachment uploaded successfully",
        attachment,
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({
        message: err.message || "Error uploading attachment",
        error: err,
      });
    }
  };

  return {
    createAttachment,
    getAllAttachments,
    getAttachmentById,
    updateAttachment,
    softDeleteAttachment,
    uploadAttachmentHandler
  };
};
