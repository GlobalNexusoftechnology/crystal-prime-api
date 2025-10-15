import cron from "node-cron";
import { AppDataSource } from "../utils/data-source";
import { Holiday, User } from "../entities";
import { NotificationService } from "../services/notification.service";
import { NotificationType } from "../entities/notification.entity";

const notificationService = NotificationService();

export const setupHolidayNotificationCron = () => {
  // Runs every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("Running holiday notification cron job...");

    const userRepo = AppDataSource.getRepository(User);
    const holidayRepo = AppDataSource.getRepository(Holiday);

    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // Find holidays that match tomorrow’s date
      const holidaysTomorrow = await holidayRepo.find({
        where: { date: tomorrowStr as unknown as Date },
      });

      if (!holidaysTomorrow.length) {
        console.log("No holidays tomorrow.");
        return;
      }

      console.log(`Found ${holidaysTomorrow.length} holidays tomorrow.`);

      const users = await userRepo.find();

      for (const holiday of holidaysTomorrow) {
        // Convert date string to Date safely
        const holidayDate =
          holiday.date instanceof Date ? holiday.date : new Date(holiday.date as any);

        for (const user of users) {
          try {
            await notificationService.createNotification(
              user.id,
              NotificationType.HOLIDAY_REMINDER,
              `🎉 Reminder: Tomorrow (${holidayDate.toDateString()}) is ${holiday.holidayName}! Enjoy your day off and plan ahead.`,
              { holidayName: holiday.holidayName, date: holidayDate }
            );
          } catch (innerError) {
            console.error(`Failed to send holiday reminder to ${user.id}:`, innerError);
          }
        }
      }

      console.log("Holiday notification cron job completed successfully.");
    } catch (error) {
      console.error("Error in holiday notification cron job:", error);
    }
  });
};
