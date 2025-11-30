require("dotenv").config();
import config from "config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import morgan from "morgan";
import nodemailer from "nodemailer";
import path from "path";

import AttendanceRoutes from "./routes/attendance.routes";
import authRouter from "./routes/auth.routes";
import clientFollowupRoutes from "./routes/clients-followups.routes";
import clientRoutes from "./routes/clients.routes";
import holidayRoutes from "./routes/holiday.routes";
import leadAttachmentsRouter from "./routes/lead-attachments.routes";
import leadFollowupsRouter from "./routes/lead-followups.routes";
import leadSourcesRouter from "./routes/lead-sources.routes";
import leadStatusHistoryRouter from "./routes/lead-status-history.routes";
import leadStatusesRouter from "./routes/lead-statuses.routes";
import leadTypesRouter from "./routes/lead-types.routes";
import leadsRouter from "./routes/leads.routes";
import LeaveRoutes from "./routes/leaves.routes";
import milestoneMasterRouter from "./routes/milestone-master.routes";
import projectAttachmentsRouter from "./routes/project-attachments.routes";
import milestoneRoutes from "./routes/project-milestone.routes";
import taskRoutes from "./routes/project-task.routes";
import projectTemplateRoutes from "./routes/project-templates.routes";
import projectRoutes from "./routes/projects.routes";
import rolesRouter from "./routes/roles.routes";
import taskCommentRoutes from "./routes/task-comment.routes";
import taskMasterRouter from "./routes/task-master.routes";
import taskStatusRoutes from "./routes/task-status.routes";
import ticketCommentRoutes from "./routes/ticket-comment.routes";
import ticketRoutes from "./routes/ticket.routes";
import userRouter from "./routes/user.routes";
import workRequestRoutes from "./routes/work-request.routes";
import AppError from "./utils/appError";
import { AppDataSource } from "./utils/data-source";
import validateEnv from "./utils/validateEnv";

import dailyTaskEntryRoutes from "./routes/daily-task.routes";

import { setupAnnouncementCron } from "./cron/announcementCron";
import { setupAutoCheckoutCronJob } from "./cron/attendanceAutoCheckout";
import { setupBirthdayCronJob } from "./cron/birthdayCronJob";
import { setupHolidayNotificationCron } from "./cron/holidayCronJob";
import { setupProjectRenewalCron } from "./cron/projectRenewalCronJob";
import { setupTicketCronJobs } from "./cron/ticketCronJobs";
import clientsDetailsRouter from "./routes/clients-details.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import eilogHeadRouter from "./routes/eilog-head.routes";
import eilogTypeRouter from "./routes/eilog-type.routes";
import eilogRouter from "./routes/eilog.routes";
import materialTypeRoutes from "./routes/material-type.routes";
import materialRoutes from "./routes/material.routes";
import notificationRouter from "./routes/notification.routes";
import reportRoutes from "./routes/report.routes";
import { initWebSocket } from "./services/websocket.service";

import materialBrandRoutes from "./routes/material-brand.routes";

(async function () {
  const credentials = await nodemailer.createTestAccount();
  console.log(credentials);
})();

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected successfully !");
    // VALIDATE ENV
    validateEnv();

    const app = express();
    const httpServer = createServer(app);

    // Initialize WebSocket service
    initWebSocket(httpServer);

    // Inside src/app.ts or main file
    app.use(
      "/exports",
      express.static(path.join(__dirname, "..", "public", "exports"))
    );

    // MIDDLEWARE

    // 1. Body parser
    app.use(express.json({ limit: "25mb" }));
    // 2. URL encoded parser
    app.use(express.urlencoded({ extended: true, limit: "25mb" }));

    // 2. Logger
    if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

    // 3. Cookie Parser
    app.use(cookieParser());

    // 4. Cors
    app.use(
      cors({
        origin: config.get<string>("origin"),
        credentials: true,
      })
    );

    // ROUTES
    app.use("/api/auth", authRouter);
    app.use("/api/users", userRouter);
    app.use("/api/lead-sources", leadSourcesRouter);
    app.use("/api/lead-types", leadTypesRouter);
    app.use("/api/lead-statuses", leadStatusesRouter);
    app.use("/api/leads", leadsRouter);
    app.use("/api/lead-followup", leadFollowupsRouter);
    app.use("/api/lead-attachments", leadAttachmentsRouter);
    app.use("/api/lead-status-history", leadStatusHistoryRouter);
    app.use("/api/roles", rolesRouter);
    app.use("/api/clients", clientRoutes);
    app.use("/api/projects", projectRoutes);
    app.use("/api/project-templates", projectTemplateRoutes);
    app.use("/api/project-milestones", milestoneRoutes);
    app.use("/api/project-task", taskRoutes);
    app.use("/api/project-attachments", projectAttachmentsRouter);
    app.use("/api/project-template-milestones", milestoneMasterRouter);
    app.use("/api/project-template-milestone-tasks", taskMasterRouter);
    app.use("/api/notifications", notificationRouter);
    app.use("/api/client-followups", clientFollowupRoutes);
    app.use("/api/clients-details", clientsDetailsRouter);
    app.use("/api/task-comments", taskCommentRoutes);
    app.use("/api/task-status", taskStatusRoutes);
    app.use("/api/tickets", ticketRoutes);
    app.use("/api/ticket-comments", ticketCommentRoutes);

    app.use("/api/daily-task", dailyTaskEntryRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/ei-log-types", eilogTypeRouter);
    app.use("/api/ei-log-heads", eilogHeadRouter);
    app.use("/api/ei-logs", eilogRouter);
    app.use("/api/reports", reportRoutes);
    app.use("/api/holidays", holidayRoutes);
    app.use("/api/leaves", LeaveRoutes);
    app.use("/api/attendances", AttendanceRoutes);
    app.use("/api/work-requests", workRequestRoutes);
    app.use("/api/materials", materialRoutes);

    app.use("/api/material-brand", materialBrandRoutes);
    app.use("/api/material-type", materialTypeRoutes);
    // HEALTH CHECKER
    app.get("/api/healthChecker", async (_, res: Response) => {
      res.status(200).json({
        status: "success",
        message: "Welcome to Node.js, we are happy to see you",
      });
    });

    // UNHANDLED ROUTE
    app.all("*", (req: Request, res: Response, next: NextFunction) => {
      next(new AppError(404, `Route ${req.originalUrl} not found`));
    });

    // GLOBAL ERROR HANDLER
    app.use(
      (error: AppError, req: Request, res: Response, next: NextFunction) => {
        error.status = error.status || "error";
        error.statusCode = error.statusCode || 500;

        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
        });
      }
    );

    setupTicketCronJobs();
    setupProjectRenewalCron();
    setupBirthdayCronJob();
    setupHolidayNotificationCron();
    setupAnnouncementCron();
    setupAutoCheckoutCronJob();

    const port = config.get<number>("port");
    app.listen(port, () => {
      console.log(`Server started with pid: ${process.pid} on port: ${port}`);
    });
  })
  .catch((error) => console.log("Connection Failed::", error));
