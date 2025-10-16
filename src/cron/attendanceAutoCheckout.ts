import cron from "node-cron";
import { AppDataSource } from "../utils/data-source";
import { Attendance } from "../entities/attendance.entity";

export const setupAutoCheckoutCronJob = () => {
  // Run every day at 12:05 AM
  // */10 * * * * *
  // 5 0 * * *
  cron.schedule("5 0 * * *", async () => {
    console.log("Running auto-checkout cron job...");

    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const now = new Date();

    // Get yesterday’s date (since we are running after midnight)
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const formattedDate = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD

    try {
      // Find attendances from yesterday that have inTime but no outTime
      const incompleteAttendances = await attendanceRepo
        .createQueryBuilder("attendance")
        .where("attendance.date = :date", { date: formattedDate })
        .andWhere("attendance.inTime IS NOT NULL")
        .andWhere("attendance.outTime IS NULL")
        .getMany();

      if (incompleteAttendances.length === 0) {
        console.log("No incomplete attendances found for yesterday.");
        return;
      }

      console.log(`Found ${incompleteAttendances.length} incomplete attendances.`);

      for (const attendance of incompleteAttendances) {
        // Parse inTime and add 14 hours
        const [hours, minutes, seconds] = attendance.inTime.split(":").map(Number);
        const inDate = new Date(yesterday);
        inDate.setHours(hours, minutes, seconds || 0, 0);

        const outDate = new Date(inDate);
        outDate.setHours(inDate.getHours() + 14);

        // Format back to "HH:MM:SS"
        const formattedOutTime = outDate.toTimeString().split(" ")[0];

        // Calculate totalHours as "HH:mm"
        const totalHours = "14:00";

        attendance.outTime = formattedOutTime;
        attendance.totalHours = totalHours;

        await attendanceRepo.save(attendance);

        console.log(
          `Auto checkout done for staffId: ${attendance.staffId} on ${formattedDate} — outTime: ${formattedOutTime}`
        );
      }

      console.log("Auto-checkout cron job completed.");
    } catch (error) {
      console.error("Error in auto-checkout cron job:", error);
    }
  });
};
