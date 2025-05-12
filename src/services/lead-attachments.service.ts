import { AppDataSource } from "../utils/data-source";
import { LeadAttachments } from "../entities/lead-attachments.entity";
import { Leads } from "../entities/leads.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";

interface AttachmentInput {
  lead_id: string;
  uploaded_by?: string | null;
  file_path: string;
  file_type: string;
}

const attachmentRepo = AppDataSource.getRepository(LeadAttachments);
const leadRepo = AppDataSource.getRepository(Leads);
const userRepo = AppDataSource.getRepository(User);

export const LeadAttachmentService = () => {

  // Create
  const createAttachment = async (data: AttachmentInput) => {
    const { lead_id, uploaded_by, file_path, file_type } = data;

    const lead = await leadRepo.findOne({ where: { id: lead_id, deleted: false } });
    if (!lead) throw new AppError(404, "Lead not found");

    let uploader = null;
    if (uploaded_by) {
      uploader = await userRepo.findOne({ where: { id: uploaded_by } });
      if (!uploader) throw new AppError(404, "Uploader not found");
    }

    const attachment = attachmentRepo.create({
      lead,
      uploaded_by: uploader,
      file_path,
      file_type,
    });

    return await attachmentRepo.save(attachment);
  };

  //  Get All
  const getAllAttachments = async () => {
    return await attachmentRepo.find({
      where: { deleted: false },
      relations: ["lead", "uploaded_by"],
      order: { created_at: "DESC" },
    });
  };

  //  Get by ID
  const getAttachmentById = async (id: string) => {
    const attachment = await attachmentRepo.findOne({
      where: { id, deleted: false },
      relations: ["lead", "uploaded_by"],
    });

    if (!attachment) throw new AppError(404, "Attachment not found");
    return attachment;
  };

  //  Update
  const updateAttachment = async (id: string, data: Partial<AttachmentInput>) => {
    const attachment = await attachmentRepo.findOne({
      where: { id, deleted: false },
      relations: ["lead", "uploaded_by"],
    });

    if (!attachment) throw new AppError(404, "Attachment not found");

    const { lead_id, uploaded_by, file_path, file_type } = data;

    if (lead_id) {
      const lead = await leadRepo.findOne({ where: { id: lead_id, deleted: false } });
      if (!lead) throw new AppError(404, "Lead not found");
      attachment.lead = lead;
    }

    if (uploaded_by) {
      const uploader = await userRepo.findOne({ where: { id: uploaded_by } });
      if (!uploader) throw new AppError(404, "Uploader not found");
      attachment.uploaded_by = uploader;
    }

    if (file_path !== undefined) attachment.file_path = file_path;
    if (file_type !== undefined) attachment.file_type = file_type;

    return await attachmentRepo.save(attachment);
  };

  //  Soft Delete
  const softDeleteAttachment = async (id: string) => {
    const attachment = await attachmentRepo.findOne({ where: { id, deleted: false } });

    if (!attachment) throw new AppError(404, "Attachment not found");

    attachment.deleted = true;
    attachment.deleted_at = new Date();

    return await attachmentRepo.save(attachment);
  };

  // Return all actions as an object
  return {
    createAttachment,
    getAllAttachments,
    getAttachmentById,
    updateAttachment,
    softDeleteAttachment,
  };
}



