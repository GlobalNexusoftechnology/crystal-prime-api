import { AppDataSource } from "../utils/data-source";
import { LeadAttachments } from "../entities/lead-attachments.entity";
import { Leads } from "../entities/leads.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import { DeepPartial } from "typeorm";

interface IAttachmentInput {
  lead_id: string;
  uploaded_by: DeepPartial<User> | undefined;
  file_path: string;
  file_type: string;
  file_name: string;
}

const attachmentRepo = AppDataSource.getRepository(LeadAttachments);
const leadRepo = AppDataSource.getRepository(Leads);

export const LeadAttachmentService = () => {

  // Create
  const createAttachment = async (data: IAttachmentInput) => {
    const { lead_id, uploaded_by, file_path, file_type, file_name } = data;

    const lead = await leadRepo.findOne({ where: { id: lead_id, deleted: false } });
    if (!lead) {
      throw new AppError(404, "Lead not found");
    } 

    const attachment = attachmentRepo.create({
      lead,
      uploaded_by,
      file_path,
      file_type,
      file_name
    });

    return await attachmentRepo.save(attachment);
  };

  //  Get All
  const getAllAttachments = async (leadId?: string) => {
    if (leadId) {
      return await attachmentRepo.find({
        where: { deleted: false, lead: { id: leadId } },
        relations: ["lead", "uploaded_by"],
        order: { created_at: "DESC" },
      });
    }
    return await attachmentRepo.find({
      where: { deleted: false },
      relations: ["lead", "uploaded_by"],
      order: { created_at: "DESC" },
    });
  };

  // Get by Lead ID
  const getAttachmentsByLeadId = async (leadId: string) => {
    const lead = await leadRepo.findOne({ where: { id: leadId, deleted: false } });
    if (!lead) throw new AppError(404, "Lead not found");

    return await attachmentRepo.find({
      where: { deleted: false, lead: { id: leadId } },
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

  // Return all actions as an object
  return {
    createAttachment,
    getAllAttachments,
    getAttachmentById,
    getAttachmentsByLeadId,
  };
}



