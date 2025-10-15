import cron from "node-cron";
import { AppDataSource } from "../utils/data-source";
import { AnnouncementJob } from "../entities/announcement-job.entity";
import { User } from "../entities/user.entity";
import { NotificationService } from "../services/notification.service";
import { NotificationType } from "../entities/notification.entity";
import { Not } from "typeorm";

const notificationService = NotificationService();

export const setupAnnouncementCron = () => {
  // Run every minute(* * * * *)
  cron.schedule("* * * * *", async () => {
    const jobRepo = AppDataSource.getRepository(AnnouncementJob);
    const userRepo = AppDataSource.getRepository(User);

    // fetch one pending job at a time to keep it simple
    const job = await jobRepo.findOne({ where: { status: "pending" }, order: { created_at: "ASC" as any } });
    if (!job) return;

    job.status = "processing";
    await jobRepo.save(job);

    try {
      const isClient = job.userType === "client";
      const where = isClient
        ? { deleted: false, role: { role: "client" } as any }
        : { deleted: false, role: { role: Not("client") } as any };

      const users = await userRepo.find({ where, relations: ["role"], select: ["id"] as any });

      // Batch size to avoid large transactions and WS bursts
      const batchSize = 50;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        await Promise.all(
          batch.map((u) =>
            notificationService.createNotification(
              u.id,
              NotificationType.ANNOUNCEMENT,
              job.message
            )
          )
        );
        job.processedCount += batch.length;
        await jobRepo.save(job);
      }

      job.status = "completed";
      await jobRepo.save(job);
    } catch (error: any) {
      job.status = "failed";
      job.error = error?.message || String(error);
      await jobRepo.save(job);
    }
  });
};


