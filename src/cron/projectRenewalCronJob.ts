import cron from "node-cron";
import { AppDataSource } from "../utils/data-source";
import { transporter } from "../utils/email"; 

export const setupProjectRenewalCron = () => {
  // Run every 10 seconds ("*/10 * * * * *"") for testing, switch to "0 0 * * *" for midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("Running project renewal reminder cron...");

      const result = await AppDataSource.query(`
        SELECT 
          p.id AS project_id,
          p.name AS project_name,
          p.renewal_date,
          c.email AS client_email,
          c.name AS client_name
        FROM "Project " p
        INNER JOIN clients c ON c.id = p.client_id
        WHERE p.deleted = false
          AND p.renewal_date IS NOT NULL
          AND p.is_renewal = true
          AND DATE(p.renewal_date) = DATE(NOW() + INTERVAL '7 days')
          AND c.email IS NOT NULL
      `);

      if (result.length === 0) {
        console.log("No project renewals found for next 7 days.");
        return;
      }

      for (const row of result) {
        const mailOptions = {
          from: `"Support" <${process.env.EMAIL_USER}>`,
          to: row.client_email,
          cc: process.env.SUPPORT_EMAIL,
          subject: `Project Renewal Reminder: ${row.project_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
              <h2 style="color: #2c3e50;">Project Renewal Reminder</h2>
              <p>Dear <strong>${row.client_name || "Client"}</strong>,</p>
              <p>
                This is a friendly reminder that your project 
                <strong>${row.project_name}</strong> is scheduled for renewal on 
                <strong>${new Date(row.renewal_date).toDateString()}</strong>.
              </p>
              <p>Please ensure all necessary actions are taken before the renewal date.</p>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <br/>
              <p>Best Regards,</p>
              <p><strong>Support Team</strong></p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Renewal reminder sent to ${row.client_email} for project ${row.project_name}`);
      }

      console.log("Project renewal reminder cron completed.");
    } catch (error) {
      console.error("Error in project renewal reminder cron:", error);
    }
  });
};
