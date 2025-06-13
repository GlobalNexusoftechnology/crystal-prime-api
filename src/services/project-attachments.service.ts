import { AppDataSource } from "../utils/data-source";
import { projectAttachments } from "../entities/project-attachments.entity";
import { Project } from "../entities/Project.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";

interface IAttachmentInput {
    Project_id: string;
    uploaded_by?: string | null; // optional & nullable
    file_path: string;
    file_type: string;
    file_name: string;
}

const attachmentRepo = AppDataSource.getRepository(projectAttachments);
const ProjectRepo = AppDataSource.getRepository(Project);
const UserRepo = AppDataSource.getRepository(User);

export const ProjectAttachmentService = () => {
    // Create
    const createAttachment = async (data: IAttachmentInput) => {
        const { Project_id, uploaded_by, file_path, file_type, file_name } = data;

        const Project = await ProjectRepo.findOne({ where: { id: Project_id, deleted: false } });
        if (!Project) {
            throw new AppError(404, "Project not found");
        }

        let user = null;
        if (uploaded_by) {
            user = await UserRepo.findOne({ where: { id: uploaded_by, deleted: false } });
            if (!user) {
                throw new AppError(404, "User not found");
            }
        }

        const attachment = attachmentRepo.create({
            Project,
            uploaded_by: user,
            file_path,
            file_type,
            file_name
        });

        return await attachmentRepo.save(attachment);
    };

    // Get All Attachments (with optional filter by Project ID)
    const getAllAttachments = async (projectId?: string) => {
        if (projectId) {
            return await attachmentRepo.find({
                where: { deleted: false, Project: { id: projectId } },
                relations: ["Project", "uploaded_by"],
                order: { created_at: "DESC" },
            });
        }

        return await attachmentRepo.find({
            where: { deleted: false },
            relations: ["Project", "uploaded_by"],
            order: { created_at: "DESC" },
        });
    };

    // get by id
    const getAttachmentsByProjectId = async (ProjectId: string) => {
        const Project = await ProjectRepo.findOne({ where: { id: ProjectId, deleted: false } });
        if (!Project) throw new AppError(404, "Project not found");

        return await attachmentRepo.find({
            where: { deleted: false, Project: { id: ProjectId } },
            relations: ["Project", "uploaded_by"],
            order: { created_at: "DESC" },
        });
    };

    const getAttachmentById = async (id: string) => {
        const attachment = await attachmentRepo.findOne({
            where: { id, deleted: false },
            relations: ["Project", "uploaded_by"],
        });

        if (!attachment) throw new AppError(404, "Attachment not found");
        return attachment;
    };

    return {
        createAttachment,
        getAllAttachments,
        getAttachmentById,
        getAttachmentsByProjectId,
    };
};
