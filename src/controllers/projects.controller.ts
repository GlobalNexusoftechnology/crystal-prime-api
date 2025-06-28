import { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/projects.service";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/projects.schema";
import { MilestoneService } from "../services/project-milestone.service";
import { ProjectTaskService } from "../services/project-task.service";
import { ProjectAttachmentService } from "../services/project-attachments.service";

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
      const { milestones, attachments, template_id, description, ...projectData } = parsedData;
      const project = await service.createProject({ ...projectData, description: description ?? "", template_id: template_id ?? undefined }, queryRunner);
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
        ...project,
        template_id: typeof project.template?.id === 'string' ? project.template.id : undefined,
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
          ...result,
          template_id: typeof result.template?.id === 'string' ? result.template.id : undefined,
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
      const { milestones, attachments, template_id, ...projectData } = parsedData;
      const project = await service.updateProject(id, { ...projectData, template_id: template_id ?? undefined }, queryRunner);
      let updatedMilestones = [];
      if (Array.isArray(milestones)) {
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
      let updatedAttachments = [];
      if (Array.isArray(attachments)) {
        for (const attachment of attachments) {
          let attachmentResult;
          if (attachment.id) {
            // Optionally implement updateAttachment if needed
            attachmentResult = await attachmentService.createAttachment({ ...attachment, Project_id: project.id }, queryRunner);
          } else {
            attachmentResult = await attachmentService.createAttachment({ ...attachment, Project_id: project.id }, queryRunner);
          }
          updatedAttachments.push(attachmentResult);
        }
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
