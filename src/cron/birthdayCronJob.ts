import cron from "node-cron";
import { AppDataSource } from "../utils/data-source";
import { User } from "../entities";
import { NotificationService } from "../services/notification.service";
import { NotificationType } from "../entities/notification.entity";
const notificationService = NotificationService();
// Run every day at midnight (00:00)
export const setupBirthdayCronJob = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("Running birthday notification cron job...");

    const userRepo = AppDataSource.getRepository(User);
    const today = new Date();
    const month = today.getMonth() + 1; // getMonth() is 0-based
    const day = today.getDate();

    try {
      // Find users with today's birthday (ignore year)
      const birthdayUsers = await userRepo
        .createQueryBuilder("user")
        .where("EXTRACT(MONTH FROM user.dob) = :month", { month })
        .andWhere("EXTRACT(DAY FROM user.dob) = :day", { day })
        .getMany();

      if (!birthdayUsers.length) {
        console.log("No birthdays today.");
        return;
      }

      console.log(`Found ${birthdayUsers.length} birthdays today.`);

      for (const user of birthdayUsers) {
        try {
          await notificationService.createNotification(
            user.id,
            NotificationType.BIRTHDAY,
            `🎉 Happy Birthday, ${
              user.first_name || "there"
            }! May your day be filled with joy, laughter, and success. Wishing you another year of great achievements ahead!`,
            { email: user.email }
          );

          console.log(`Birthday notification sent to ${user.first_name}`);
        } catch (innerError) {
          console.error(
            `Failed to send notification for user ${user.id}:`,
            innerError
          );
        }
      }

      console.log("Birthday notification cron job completed.");
    } catch (error) {
      console.error("Error in birthday notification cron job:", error);
    }
  });
};
