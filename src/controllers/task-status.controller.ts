import { Request, Response, NextFunction } from "express";
import { TaskStatusService } from "../services/task-status.service";
import { z } from "zod";

const taskStatusService = TaskStatusService();

// Validation schema for task status update
const updateTaskStatusSchema = z.object({
  status: z.enum(["Open", "In Progress", "Completed"])
});

export const TaskStatusController = () => {
  /**
   * Update task status and cascade to milestone and project
   */
  const updateTaskStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;
      const parsedData = updateTaskStatusSchema.parse(req.body);
      
      const result = await taskStatusService.updateTaskStatus(taskId, parsedData.status);
      
      // Get updated milestone and project status after the task update
      let milestoneStatus = null;
      let projectStatus = null;
      
      if (result.milestone) {
        const milestone = await taskStatusService.updateMilestoneStatus(result.milestone.id);
        milestoneStatus = milestone.status;
        
        if (milestone.project) {
          const project = await taskStatusService.updateProjectStatus(milestone.project.id);
          projectStatus = project.status;
        }
      }
      
      res.status(200).json({
        message: "Task status updated successfully",
        data: {
          task: {
            id: result.id,
            title: result.title,
            status: result.status
          },
          milestone: milestoneStatus ? {
            id: result.milestone?.id,
            status: milestoneStatus
          } : null,
          project: projectStatus ? {
            id: result.milestone?.project?.id,
            status: projectStatus
          } : null
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get project status details with milestone and task information
   */
  const getProjectStatusDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      
      const result = await taskStatusService.getProjectStatusDetails(projectId);
      
      res.status(200).json({
        message: "Project status details retrieved successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Manually update project status (for testing/debugging)
   */
  const updateProjectStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      
      const result = await taskStatusService.updateProjectStatus(projectId);
      
      res.status(200).json({
        message: "Project status updated successfully",
        data: {
          project: {
            id: result.id,
            name: result.name,
            status: result.status
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Manually update milestone status (for testing/debugging)
   */
  const updateMilestoneStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { milestoneId } = req.params;
      
      const result = await taskStatusService.updateMilestoneStatus(milestoneId);
      
      // Get updated project status after milestone update
      let projectStatus = null;
      if (result.project) {
        const project = await taskStatusService.updateProjectStatus(result.project.id);
        projectStatus = project.status;
      }
      
      res.status(200).json({
        message: "Milestone status updated successfully",
        data: {
          milestone: {
            id: result.id,
            name: result.name,
            status: result.status,
            start_date: result.start_date,
            end_date: result.end_date
          },
          project: projectStatus ? {
            id: result.project?.id,
            status: projectStatus
          } : null
        }
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    updateTaskStatus,
    getProjectStatusDetails,
    updateProjectStatus,
    updateMilestoneStatus
  };
}; 