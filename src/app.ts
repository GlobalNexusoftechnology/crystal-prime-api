require('dotenv').config();
import express, { NextFunction, Request, Response } from 'express';
import config from 'config';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import nodemailer from 'nodemailer';
import path from 'path';
import { createServer } from 'http';

import { AppDataSource } from './utils/data-source';
import AppError from './utils/appError';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import validateEnv from './utils/validateEnv';
import leadSourcesRouter from './routes/lead-sources.routes';
import leadStatusesRouter from './routes/lead-statuses.routes';
import leadTypesRouter from './routes/lead-types.routes';
import leadsRouter from './routes/leads.routes';
import leadFollowupsRouter from './routes/lead-followups.routes';
import leadAttachmentsRouter from './routes/lead-attachments.routes';
import leadStatusHistoryRouter from './routes/lead-status-history.routes';
import rolesRouter from './routes/roles.routes';
import clientRoutes from "./routes/clients.routes";
import projectRoutes from "./routes/projects.routes";
import projectTemplateRoutes from "./routes/project-templates.routes";
import milestoneRoutes from "./routes/project-milestone.routes";
import taskRoutes from "./routes/project-task.routes";
import projectAttachmentsRouter from './routes/project-attachments.routes';
import milestoneMasterRouter from './routes/milestone-master.routes';
import taskMasterRouter from './routes/task-master.routes';
import clientFollowupRoutes from "./routes/clients-followups.routes";

import dailyTaskEntryRoutes from "./routes/daily-task.routes";

import clientsDetailsRouter from './routes/clients-details.routes';
import notificationRouter from './routes/notification.routes';
import { WebSocketService } from './services/websocket.service';
import projectFollowupsRouter from './routes/project-followups.routes';

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
    const wsService = new WebSocketService(httpServer);

    // Inside src/app.ts or main file
    app.use('/exports', express.static(path.join(__dirname, '..', 'public', 'exports')));

    // MIDDLEWARE

    // 1. Body parser
    app.use(express.json({ limit: '10kb' }));

    // 2. Logger
    if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

    // 3. Cookie Parser
    app.use(cookieParser());

    // 4. Cors
    app.use(
      cors({
        origin: config.get<string>('origin'),
        credentials: true,
      })
    );

    // ROUTES
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
    app.use('/api/lead-sources', leadSourcesRouter);
    app.use('/api/lead-types', leadTypesRouter);
    app.use('/api/lead-statuses', leadStatusesRouter);
    app.use('/api/leads', leadsRouter);
    app.use('/api/lead-followup', leadFollowupsRouter);
    app.use('/api/lead-attachments', leadAttachmentsRouter);
    app.use('/api/lead-status-history', leadStatusHistoryRouter);
    app.use('/api/roles', rolesRouter);
    app.use("/api/clients", clientRoutes);
    app.use("/api/projects", projectRoutes);
    app.use("/api/project-templates", projectTemplateRoutes);
    app.use("/api/project-milestones", milestoneRoutes);
    app.use("/api/project-task", taskRoutes);
    app.use('/api/project-attachments', projectAttachmentsRouter);
    app.use('/api/project-template-milestone', milestoneMasterRouter);
    app.use('/api/project-template-milestone-task', taskMasterRouter);
    app.use('/api/notifications', notificationRouter);
    app.use("/api/client-followups", clientFollowupRoutes);
    app.use('/api/clients-details', clientsDetailsRouter);
    
    app.use("/api/daily-task", dailyTaskEntryRoutes);
    app.use('/api/project-followups', projectFollowupsRouter);

    // HEALTH CHECKER
    app.get('/api/healthChecker', async (_, res: Response) => {
      res.status(200).json({
        status: 'success',
        message: 'Welcome to Node.js, we are happy to see you',
      });
    });

    // UNHANDLED ROUTE
    app.all('*', (req: Request, res: Response, next: NextFunction) => {
      next(new AppError(404, `Route ${req.originalUrl} not found`));
    });

    // GLOBAL ERROR HANDLER
    app.use(
      (error: AppError, req: Request, res: Response, next: NextFunction) => {
        error.status = error.status || 'error';
        error.statusCode = error.statusCode || 500;

        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
        });
      }
    );

    const port = config.get<number>('port');
    app.listen(port, () => {
      console.log(`Server started with pid: ${process.pid} on port: ${port}`);
    });
  })
  .catch((error) => console.log("Connection Failed::", error));
