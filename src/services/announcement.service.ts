import { AppDataSource } from "../utils/data-source";
import { AnnouncementJob, AnnouncementUserType } from "../entities/announcement-job.entity";
import AppError from "../utils/appError";

const jobRepo = AppDataSource.getRepository(AnnouncementJob);

export type EnqueueAnnouncementInput = {
  message: string;
  userType: AnnouncementUserType; // "staff" | "client"
};

export const AnnouncementService = () => {
  const enqueueAnnouncement = async (input: EnqueueAnnouncementInput) => {
    const { message, userType } = input;

    if (!message?.trim()) throw new AppError(400, "Message is required");
    if (userType !== "staff" && userType !== "client")
      throw new AppError(400, "Invalid userType. Use 'staff' or 'client'");

    const job = jobRepo.create({ message, userType, status: "pending" });
    const saved = await jobRepo.save(job);
    return saved;
  };

  return { enqueueAnnouncement };
};


