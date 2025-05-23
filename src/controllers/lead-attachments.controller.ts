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
 const downloadStudentPdf = async ( req: Request,
  res: Response,
  next: NextFunction) => {
  try {
    const { id } = req.params;
    console.log("dddd",id)

    if (!id) {
      return res.status(404).json({ message: 'attachment not found' });
    }

    const invoice = await service.createLeadAttachment(id);
     // Success response
     return res.status(200).json({
      status: "success",
      message: "Get Application successfully",
      data: invoice,
    });
  }
    catch (err) {
      next(err);
    }
  }

  return {
    createAttachment,
    getAllAttachments,
    getAttachmentById,
    updateAttachment,
    softDeleteAttachment,
    downloadStudentPdf
  };
};
