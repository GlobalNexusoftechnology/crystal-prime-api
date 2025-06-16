import { Request, Response, NextFunction } from "express"
import { projectAttachments } from "../entities/project-attachments.entity"
import { createProjectAttachment } from "../schemas/project-attachments.schema";
import { AppError, uploadToCloudinary } from "../utils"
import { ProjectAttachmentService } from "../services/project-attachments.service";

const service = ProjectAttachmentService()

export const ProjectAttachmentController = () => {
    // create attachment
    const createAttachment = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const parsedData = createProjectAttachment.parse(req.body)
            const attachmentPayload = {
                Project_id: parsedData.project_id,
                uploaded_by: res.locals?.user?.id || null, // optional
                file_path: parsedData.file_path,
                file_type: parsedData.file_type,
                file_name: parsedData.file_name,
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
            const { ProjectId } = req.query;
            let result;

            if (ProjectId) {
                result = await service.getAllAttachments(ProjectId as string);
            } else {
                result = await service.getAllAttachments();
            }

            res.status(200).json({
                status: "success",
                message: "Attachments fetched",
                data: result,
            });
        } catch (error) {
            next(error);
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