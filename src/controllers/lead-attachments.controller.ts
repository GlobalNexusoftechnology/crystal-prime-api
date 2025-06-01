import { Request, Response, NextFunction } from "express"
import { LeadAttachmentService } from "../services/lead-attachments.service"
import { createLeadAttachment } from "../schemas/lead-attachments.schema"
import { AppError, uploadToCloudinary } from "../utils"

const service = LeadAttachmentService()

export const leadAttachmentController = () => {
  const createAttachment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsedData = createLeadAttachment.parse(req.body)
      const attachmentPayload = {
        lead_id: parsedData.lead_id,
        uploaded_by: res.locals.user.id,
        file_path: parsedData.file_path,
        file_type: parsedData.file_type,
        file_name: parsedData.file_name
      }
      const result = await service.createAttachment(attachmentPayload)
      res.status(201).json({
        status: "success",
        message: "Attachment created",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  //  Get All
  const getAllAttachments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await service.getAllAttachments()
      res.status(200).json({
        status: "success",
        message: "All Attachment get",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  //  Get by ID
  const getAttachmentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params
      const result = await service.getAttachmentById(id)
      res.status(200).json({
        status: "success",
        message: "Attachment get by id",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  //upload image and pdf in Cloudinary
  const uploadMultipleFilesToCloudinary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({
          status: "error",
          message: "No files found in the request",
        })
      }

      const files = req.files as Express.Multer.File[]

      if (files.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "No files provided for upload",
        })
      }

      // Upload files to Cloudinary concurrently
      const gallery = await Promise.all(
        files.map(async (file) => {
          try {
            const uploadResult = await uploadToCloudinary(
              file.buffer,
              file.originalname,
              "uploads" // or another folder name
            )
            return uploadResult.url
          } catch (uploadError) {
            return next(
              new AppError(
                500,
                `File "${file.originalname}" could not be uploaded. Please try again.`
              )
            )
          }
        })
      )

      return res.status(200).json({
        status: "success",
        message: "Files uploaded successfully",
        data: gallery,
      })
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message:
          "An error occurred while uploading files. Please try again later.",
      })
    }
  }

  const uploadSingleFileToCloudinary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const file = req.file as Express.Multer.File

      if (!file) {
        return res.status(400).json({
          status: "error",
          message: "No file provided in the request",
        })
      }

      const uploadResult = await uploadToCloudinary(
        file.buffer,
        file.originalname,
        "uploads" // or any folder name
      )

      return res.status(200).json({
        status: "success",
        message: "File uploaded successfully",
        data: {
          docUrl: uploadResult.url,
          fileType: req.file?.mimetype,
          fileName: req.file?.originalname,
        },
      })
    } catch (error) {
      console.error("Upload error:", error)
      next(
        new AppError(
          500,
          "An error occurred while uploading the file. Please try again later."
        )
      )
    }
  }

  return {
    createAttachment,
    getAllAttachments,
    getAttachmentById,
    uploadMultipleFilesToCloudinary,
    uploadSingleFileToCloudinary,
  }
}
