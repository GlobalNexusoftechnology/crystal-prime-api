import { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/projects.service";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/projects.schema";
import { MilestoneService } from "../services/project-milestone.service";
import { ProjectTaskService } from "../services/project-task.service";
import { ProjectAttachmentService } from "../services/project-attachments.service";
import { ProjectMilestones } from "../entities/project-milestone.entity";

const service = ProjectService();
const milestoneService = MilestoneService();
const taskService = ProjectTaskService();
const attachmentService = ProjectAttachmentService();

export const ProjectController = () => {
  // Create Project
  const createProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const queryRunner = service.getQueryRunner();
    await queryRunner.startTransaction();
    try {
      const parsedData = createProjectSchema.parse(req.body); // Zod validation
      const { milestones, attachments, description, ...projectData } = parsedData;
      const project = await service.createProject({ ...projectData, description: description ?? "" }, queryRunner);
      let createdMilestones = [];
      if (Array.isArray(milestones)) {
        for (const milestone of milestones) {
          const milestoneData = { ...milestone, project_id: project.id, description: milestone.description ?? "" };
          const createdMilestone = await milestoneService.createMilestone(milestoneData, queryRunner);
          let createdTasks = [];
          if (Array.isArray(milestone.tasks)) {
            for (const task of milestone.tasks) {
              const taskData = { ...task, milestone_id: createdMilestone.id };
              const createdTask = await taskService.createTask(taskData, queryRunner);
              createdTasks.push(createdTask);
            }
          }
          createdMilestones.push({ ...createdMilestone, tasks: createdTasks });
        }
      }
      let createdAttachments = [];
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
        data: { project, milestones: createdMilestones, attachments: createdAttachments },
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
      const result = await service.getAllProject();
      const projectsWithTemplateId = result.map(project => ({
        ...project
      }));
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
      const result = await service.getProjectById(id);
      res.status(200).json({
        status: "success",
        message: "Project project fetched by id",
        data: {
          ...result
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
    try {
      const { id } = req.params;
      const parsedData = updateProjectSchema.parse(req.body);
      const { milestones, attachments, description, ...projectData } = parsedData;
      const project = await service.updateProject(id, { ...projectData }, queryRunner);
      
      let updatedMilestones = [];
      if (Array.isArray(milestones)) {
        // Get existing milestones for this project
        const existingMilestones = await milestoneService.getMilestonesByProjectId(project.id, queryRunner);
        const existingMilestoneIds = existingMilestones.map((ms: ProjectMilestones) => ms.id);
        const incomingMilestoneIds = milestones.filter(ms => ms.id).map(ms => ms.id);

        // Delete milestones that are no longer in the list
        const milestonesToDelete = existingMilestoneIds.filter((id: string) => !incomingMilestoneIds.includes(id));
        for (const milestoneId of milestonesToDelete) {
          await milestoneService.deleteMilestone(milestoneId, queryRunner);
        }
        
        for (const milestone of milestones) {
          let milestoneResult;
          if (milestone.id) {
            milestoneResult = await milestoneService.updateMilestone(milestone.id, milestone, queryRunner);
          } else {
            milestoneResult = await milestoneService.createMilestone({ ...milestone, project_id: project.id, description: milestone.description ?? "" }, queryRunner);
          }
          let updatedTasks = [];
          if (Array.isArray(milestone.tasks)) {
            for (const task of milestone.tasks) {
              let taskResult;
              if (task.id) {
                taskResult = await taskService.updateTask(task.id, task, queryRunner);
              } else {
                taskResult = await taskService.createTask({ ...task, milestone_id: milestoneResult.id }, queryRunner);
              }
              updatedTasks.push(taskResult);
            }
          }
          updatedMilestones.push({ ...milestoneResult, tasks: updatedTasks });
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
        data: { project, milestones: updatedMilestones, attachments: updatedAttachments },
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
