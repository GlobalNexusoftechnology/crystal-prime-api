import { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/projects.service";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/projects.schema";
import { MilestoneService } from "../services/project-milestone.service";
import { ProjectTaskService } from "../services/project-task.service";
import { ProjectAttachmentService } from "../services/project-attachments.service";
import { TicketService } from "../services/ticket.service";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { findUserById } from "../services/user.service";

const service = ProjectService();
const milestoneService = MilestoneService();
const taskService = ProjectTaskService();
const attachmentService = ProjectAttachmentService();
const ticketService = TicketService();

export const ProjectController = () => {
  const sanitizeProjectForRole = (project: any, role?: string) => {
    if (!role || role.toLowerCase() === 'admin' || !project) return project;
    const { budget, cost_of_labour, overhead_cost, extra_cost, ...rest } = project;
    return rest;
  };

  const sanitizeProjectsArrayForRole = (projects: any[], role?: string) =>
    projects.map((p) => sanitizeProjectForRole(p, role));

  // Create Project
  const createProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const queryRunner = service.getQueryRunner();
    await queryRunner.startTransaction();
    const user = res.locals.user;
    try {
      const parsedData = createProjectSchema.parse(req.body); // Zod validation
      const role = res?.locals?.user?.role?.role as string | undefined;
      // Non-admins cannot set financial fields
      if (!role || role.toLowerCase() !== 'admin') {
        delete (parsedData as any).budget;
        delete (parsedData as any).cost_of_labour;
        delete (parsedData as any).overhead_cost;
        delete (parsedData as any).extra_cost;
      }
      const { milestones, attachments, description, ...projectData } = parsedData;
      const project = await service.createProject({ ...projectData, description: description ?? "" }, queryRunner);
      // Create user-provided milestones (Support is auto-created in service; update it if provided)
      let createdMilestones: any[] = [];
      if (Array.isArray(milestones)) {
        // Fetch existing milestones (will include auto-created Support)
        const existingMilestones = await milestoneService.getMilestonesByProjectId(project.id, queryRunner);
        const existingSupport = existingMilestones.find((ms: ProjectMilestones) => (ms.name || "").toLowerCase() === "support");

        for (const milestone of milestones) {
          let milestoneResult: any;
          const isSupport = milestone.name && milestone.name.toLowerCase() === "support";
          if (isSupport) {
            if (existingSupport) {
              milestoneResult = await milestoneService.updateMilestone(existingSupport.id, { ...milestone, project_id: project.id, description: milestone.description ?? "" }, queryRunner);
            } else {
              milestoneResult = await milestoneService.createMilestone({ ...milestone, project_id: project.id, description: milestone.description ?? "" }, queryRunner);
            }
          } else {
            milestoneResult = await milestoneService.createMilestone({ ...milestone, project_id: project.id, description: milestone.description ?? "" }, queryRunner);
          }

          // Create tasks under this milestone if provided
          let createdTasks: any[] = [];
          if (Array.isArray(milestone.tasks)) {
            for (const task of milestone.tasks) {
              const taskResult = await taskService.createTask({ ...task, milestone_id: milestoneResult.id },user, queryRunner);
              createdTasks.push(taskResult);
            }
          }

          createdMilestones.push({ ...milestoneResult, tasks: createdTasks });
        }
      } else {
        // If no milestones provided, return existing milestones (includes Support)
        createdMilestones = await milestoneService.getMilestonesByProjectId(project.id, queryRunner);
      }

      let createdAttachments: any[] = [];
      if (Array.isArray(attachments)) {
        for (const attachment of attachments) {
          const attachmentData = { ...attachment, Project_id: project.id };
          const createdAttachment = await attachmentService.createAttachment(attachmentData, queryRunner);
          createdAttachments.push(createdAttachment);
        }
      }
      await queryRunner.commitTransaction();
      res.status(201).json({
        status: "success",
        message: "Project created",
        data: {
          project: sanitizeProjectForRole(project as any, role),
          milestones: createdMilestones,
          attachments: createdAttachments
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      next(error);
    } finally {
      await queryRunner.release();
    }
  };

  // Get All Project Projects
  const getAllProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {

      const userId = res.locals.user.id;
      const userData = await findUserById(userId);
      const userRole = userData.role.role;
      const result = await service.getAllProject(userId, userRole, userData);
      const projectsWithTemplateId = sanitizeProjectsArrayForRole(result as any[], userRole);
      res.status(200).json({
        status: "success",
        message: "All Project projects fetched",
        data: projectsWithTemplateId,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Project by ID
  const getProjectById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const role = res?.locals?.user?.role?.role as string | undefined;
      const result = await service.getProjectById(id);
      res.status(200).json({
        status: "success",
        message: "Project project fetched by id",
        data: {
          ...(sanitizeProjectForRole(result as any, role))
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Update Project
  const updateProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const queryRunner = service.getQueryRunner();
    await queryRunner.startTransaction();
    const user = res.locals.user;
    try {
      const { id } = req.params;
      const parsedData = updateProjectSchema.parse(req.body);
      const role = res?.locals?.user?.role?.role as string | undefined;
      // Non-admins cannot update financial fields
      if (!role || role.toLowerCase() !== 'admin') {
        delete (parsedData as any).budget;
        delete (parsedData as any).cost_of_labour;
        delete (parsedData as any).overhead_cost;
        delete (parsedData as any).extra_cost;
      }
      const { milestones, attachments, description, ...projectData } = parsedData;
      const project = await service.updateProject(id, { ...projectData, description }, queryRunner);
      
      let updatedMilestones = [];
      if (Array.isArray(milestones)) {
        // Get existing milestones for this project
        const existingMilestones = await milestoneService.getMilestonesByProjectId(project.id, queryRunner);
        const existingMilestoneIds = existingMilestones.map((ms: ProjectMilestones) => ms.id);
        const incomingMilestoneIds = milestones.filter(ms => ms.id).map(ms => ms.id);

        // Delete milestones that are no longer in the list, but preserve Support milestones
        const milestonesToDelete = existingMilestoneIds.filter((id: string) => {
          // Don't delete Support milestones
          const milestone = existingMilestones.find((ms: ProjectMilestones) => ms.id === id);
          if (milestone && milestone.name.toLowerCase() === "support") {
            return false;
          }
          return !incomingMilestoneIds.includes(id);
        });
        
        for (const milestoneId of milestonesToDelete) {
          await milestoneService.deleteMilestoneWithCascade(milestoneId, queryRunner); // Use cascade delete
        }
        
        for (const milestone of milestones) {
          let milestoneResult;
          if (milestone.id) {
            milestoneResult = await milestoneService.updateMilestone(milestone.id, milestone, queryRunner);
          } else {
            // Check if this is a Support milestone and if one already exists
            if (milestone.name && milestone.name.toLowerCase() === "support") {
              const existingSupport = await milestoneService.getMilestonesByProjectId(project.id, queryRunner);
              const supportMilestone = existingSupport.find((ms: ProjectMilestones) => ms.name.toLowerCase() === "support");
              
              if (supportMilestone) {
                // Update existing Support milestone instead of creating new one
                milestoneResult = await milestoneService.updateMilestone(supportMilestone.id, milestone, queryRunner);
              } else {
                // Create new Support milestone only if none exists
                milestoneResult = await milestoneService.createMilestone({ ...milestone, project_id: project.id, description: milestone.description ?? "" }, queryRunner);
              }
            } else {
              milestoneResult = await milestoneService.createMilestone({ ...milestone, project_id: project.id, description: milestone.description ?? "" }, queryRunner);
            }
          }
          
          // Handle tasks
          let updatedTasks = [];
          if (Array.isArray(milestone.tasks)) {
            for (const task of milestone.tasks) {
              let taskResult;
              if (task.id) {
                taskResult = await taskService.updateTask(task.id, task, user, queryRunner);
              } else {
                taskResult = await taskService.createTask({ ...task, milestone_id: milestoneResult.id }, user, queryRunner);
              }
              updatedTasks.push(taskResult);
            }
          }
          
          // Preserve existing tickets for this milestone
          const existingTickets = await ticketService.getTicketsByMilestone(milestoneResult.id, {});
          const updatedTickets = existingTickets.data || [];
          
          updatedMilestones.push({ 
            ...milestoneResult, 
            tasks: updatedTasks,
            tickets: updatedTickets
          });
        }
      }

      // Handle attachments with proper update logic
      let updatedAttachments = [];
      if (Array.isArray(attachments)) {
        // Get existing attachments for this project
        const existingAttachments = await attachmentService.getAttachmentsByProjectId(project.id);
        const existingAttachmentIds = existingAttachments.map(att => att.id);
        const newAttachmentIds = attachments.filter(att => att.id).map(att => att.id);
        
        // Delete attachments that are no longer in the list
        const attachmentsToDelete = existingAttachmentIds.filter(id => !newAttachmentIds.includes(id));
        for (const attachmentId of attachmentsToDelete) {
          await attachmentService.deleteAttachment(attachmentId, queryRunner);
        }

        // Process new and updated attachments
        for (const attachment of attachments) {
          let attachmentResult;
          if (attachment.id) {
            // Update existing attachment
            attachmentResult = await attachmentService.updateAttachment({
              id: attachment.id,
              file_path: attachment.file_path,
              file_type: attachment.file_type,
              file_name: attachment.file_name,
            }, queryRunner);
          } else {
            // Create new attachment
            attachmentResult = await attachmentService.createAttachment({ 
              ...attachment, 
              Project_id: project.id 
            }, queryRunner);
          }
          updatedAttachments.push(attachmentResult);
        }
      } else if (attachments === undefined) {
        // attachments is not provided, do nothing to attachments
      } else {
        // If attachments is null or an empty array, delete all existing attachments
        await attachmentService.deleteAllAttachmentsForProject(project.id, queryRunner);
      }

      await queryRunner.commitTransaction();
      res.status(200).json({
        status: "success",
        message: "Project updated",
        data: {
          project: sanitizeProjectForRole(project as any, role),
          milestones: updatedMilestones,
          attachments: updatedAttachments
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      next(error);
    } finally {
      await queryRunner.release();
    }
  };

  // Soft Delete Project
  const softDeleteProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteProject(id);
      res.status(200).json({
        status: "success",
        message: "Project project deleted",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    createProject,
    getAllProject,
    getProjectById,
    updateProject,
    softDeleteProject,
  };
};
