import { AppDataSource } from "../utils/data-source";
import { Project, ProjectStatus } from "../entities/projects.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { ProjectTasks } from "../entities/project-task.entity";
import { ProjectMilestoneMaster } from "../entities/milestone-master.entity";
import { Ticket } from "../entities/ticket.entity";
import AppError from "../utils/appError";
import { User } from "../entities";
import { NotificationService } from "./notification.service";
import { NotificationType } from "../entities/notification.entity";

const projectRepo = AppDataSource.getRepository(Project);
const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);
const taskRepo = AppDataSource.getRepository(ProjectTasks);
const milestoneMasterRepo = AppDataSource.getRepository(ProjectMilestoneMaster);
const userRepo = AppDataSource.getRepository(User);
const notificationService = NotificationService();

export const TaskStatusService = () => {
  /**
   * Update task status and cascade to milestone and project
   */
  const updateTaskStatus = async (taskId: string, newStatus: string, user: User, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectTasks) : taskRepo;

    const task = await repo.findOne({
      where: { id: taskId, deleted: false },
      relations: ["milestone", "milestone.project", "milestone.project.template"]
    });

    if (!task) throw new AppError(404, "Task not found");

    const oldStatus = task.status;
    task.status = newStatus;

    // Task Due Date Logic
    if (newStatus === "In Progress") {
      // Set start_date if not already set
      if (!task.start_date) {
        task.start_date = new Date();
      }
      // Find the template task by matching title and milestone
      let estimatedDays = 0;
      if (task.milestone?.project?.template) {
        // Find the template milestone by name
        const templateMilestone = await milestoneMasterRepo.findOne({
          where: {
            template: { id: task.milestone.project.template.id },
            name: task.milestone.name
          },
          relations: ["project_task_master"]
        });
        if (templateMilestone && Array.isArray(templateMilestone.project_task_master)) {
          const templateTask = templateMilestone.project_task_master.find(
            t => t.title === task.title
          );
          if (templateTask?.estimated_days) {
            estimatedDays = templateTask.estimated_days;
          }
        }
      }
      if (estimatedDays > 0) {
        const dueDate = new Date(task.start_date);
        dueDate.setDate(dueDate.getDate() + estimatedDays);
        task.due_date = dueDate;
      }
    }

  const savedTask = await repo.save(task);

    if( (oldStatus?.toLocaleLowerCase() !== "completed") && (newStatus?.toLocaleLowerCase() === "completed")){
      const adminUsers = await userRepo.find({
        where: { role: { role: "admin" }, deleted: false },
        relations: ["role"],
      });
    
      for (const admin of adminUsers) {
        await notificationService.createNotification(
          admin.id,
          NotificationType.TASK_COMPLETED,
          `Task "${savedTask.title}" has been marked as completed by ${user.first_name} ${user.last_name}`,
          {
            taskId: savedTask.id,
            taskTitle: savedTask.title,
            completedBy: `${user.first_name} ${user.last_name}`,
            completedById: user.id,
            milestoneId: savedTask.milestone?.id,
            projectId: savedTask.milestone?.project?.id,
            completedAt: new Date().toISOString(),
          }
        );
      }
    }
    // Update milestone status if task status changed
    if (oldStatus !== newStatus && task.milestone) {
      await updateMilestoneStatus(task.milestone.id, queryRunner);
    }

    return task;
  };

  /**
   * Update milestone status
   * - Normal milestones: compute from tasks
   * - Support milestone (name === "Support"): compute from tickets; empty => Open
   */
  const updateMilestoneStatus = async (milestoneId: string, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectMilestones) : milestoneRepo;

    const milestone = await repo.findOne({
      where: { id: milestoneId, deleted: false },
      relations: ["tasks", "project", "tickets"]
    });

    if (!milestone) throw new AppError(404, "Milestone not found");

    const isSupport = (milestone.name || "").toLowerCase() === "support";

    let newStatus = milestone.status;

    if (isSupport) {
      const tickets = (milestone.tickets || []).filter((t: Ticket) => !t.deleted);
      if (tickets.length === 0) {
        // Empty support milestone => treat as Open
        newStatus = "Open";
      } else {
        // Treat "Closed" tickets as "Completed" for Support milestone status calculation
        const allCompleted = tickets.every((t: Ticket) => {
          const status = (t.status || "").toLowerCase();
          return status === "completed" || status === "closed";
        });
        const allOpen = tickets.every((t: Ticket) => (t.status || "").toLowerCase() === "open");
        const anyInProgress = tickets.some((t: Ticket) => (t.status || "").toLowerCase() === "in progress" || (t.status || "").toLowerCase() === "in-progress");
        const anyOpen = tickets.some((t: Ticket) => (t.status || "").toLowerCase() === "open");
        const anyCompleted = tickets.some((t: Ticket) => {
          const status = (t.status || "").toLowerCase();
          return status === "completed" || status === "closed";
        });

        if (anyInProgress) {
          newStatus = "In Progress";
        } else if (allCompleted) {
          newStatus = "Completed";
        } else if (allOpen) {
          newStatus = "Open";
        } else if (anyOpen && anyCompleted) {
          newStatus = "In Progress";
        }
      }
    } else {
      const tasks = (milestone.tasks || []).filter((t: ProjectTasks) => !t.deleted);

      if (tasks.length === 0) {
        // No tasks -> milestone should be Open by default
        newStatus = "Open";
      } else {
        const allTasksCompleted = tasks.every((task: ProjectTasks) => task.status === "Completed");
        const anyInProgress = tasks.some((task: ProjectTasks) => task.status === "In Progress" || task.status === "Approval");
        const allOpen = tasks.every((task: ProjectTasks) => task.status === "Open");
        const anyOpen = tasks.some((task: ProjectTasks) => task.status === "Open");
        const anyCompleted = tasks.some((task: ProjectTasks) => task.status === "Completed");

        if (anyInProgress) {
          newStatus = "In Progress";
        } else if (allTasksCompleted) {
          newStatus = "Completed";
        } else if (allOpen) {
          newStatus = "Open";
        } else if (anyOpen && anyCompleted) {
          // Mixed Open + Completed with no In Progress => In Progress
          newStatus = "In Progress";
        }
      }
    }

    // Only update if status has changed
    if (milestone.status !== newStatus) {
      milestone.status = newStatus;
      
      // Remove dates when status is Open or In Progress
      if (newStatus === "Open" || newStatus === "In Progress") {
        milestone.actual_date = null;
        milestone.estimated_date = null;
      }
      
      // Set start/end date if moving to In Progress
      if (newStatus === "In Progress" && !milestone.start_date) {
        milestone.start_date = new Date();
        // Calculate end_date from template estimatedDays
        let estimatedDays = 0;
        if (milestone.project?.template) {
          // Find the template milestone by name
          const templateMilestone = await milestoneMasterRepo.findOne({
            where: {
              template: { id: milestone.project.template.id },
              name: milestone.name
            }
          });
          if (templateMilestone?.estimated_days) {
            estimatedDays = templateMilestone.estimated_days;
          }
        }
        if (estimatedDays > 0) {
          const endDate = new Date(milestone.start_date);
          endDate.setDate(endDate.getDate() + estimatedDays);
          milestone.end_date = endDate;
        }
      }
      
      // Set actual_date when milestone is completed
      if (newStatus === "Completed") {
        milestone.actual_date = new Date();
      }

      await repo.save(milestone);

      // Update project status after milestone status change
      if (milestone.project) {
        await updateProjectStatus(milestone.project.id, queryRunner);
      }
    }

    return milestone;
  };

  /**
   * Update project status based on NORMAL milestone statuses only (exclude Support)
   */
  const updateProjectStatus = async (projectId: string, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(Project) : projectRepo;

    const project = await repo.findOne({ 
      where: { id: projectId, deleted: false },
      relations: ["milestones"]
    });
    
    if (!project) throw new AppError(404, "Project not found");

    const milestones = await milestoneRepo.find({
      where: { project: { id: projectId }, deleted: false },
      relations: ["tasks", "tickets"]
    });

    if (milestones.length === 0) {
      // No milestones, keep project as Open
      return project;
    }

    // Consider ONLY non-support milestones for project status
    const normalMilestones = milestones.filter(m => (m.name || "").toLowerCase() !== "support");

    let newStatus = ProjectStatus.OPEN;

    if (normalMilestones.length === 0) {
      // No normal milestones -> keep Open by default
      newStatus = ProjectStatus.OPEN;
    } else {
      const anyInProgress = normalMilestones.some(m => m.status === "In Progress" || m.status === "in_progress" || m.status === "Approval");
      const allOpen = normalMilestones.every(m => m.status === "Open");
      const allCompleted = normalMilestones.every(m => m.status === "Completed");

      if (anyInProgress) {
        newStatus = ProjectStatus.IN_PROGRESS;
      } else if (allOpen) {
        newStatus = ProjectStatus.OPEN;
      } else if (allCompleted) {
        newStatus = ProjectStatus.COMPLETED;
      } else {
        // Mixed states (some Completed, some Open) and none In Progress
        newStatus = ProjectStatus.IN_PROGRESS;
      }
    }

    // Only update if status has changed
    if (project.status !== newStatus) {
      project.status = newStatus;
      
      // Remove actual_start_date when project status is Open
      if (newStatus === ProjectStatus.OPEN) {
        project.actual_start_date = null;
      }
      
      // Remove actual_end_date when project status is Open or In Progress
      if (newStatus === ProjectStatus.OPEN || newStatus === ProjectStatus.IN_PROGRESS) {
        project.actual_end_date = null;
      }
      
      // Set actual_start_date when first milestone moves to In Progress
      if (newStatus === ProjectStatus.IN_PROGRESS && !project.actual_start_date) {
        project.actual_start_date = new Date();
      }
      
      // Set actual_end_date when all milestones are completed
      if (newStatus === ProjectStatus.COMPLETED && !project.actual_end_date) {
        project.actual_end_date = new Date();
      }
      
      await repo.save(project);
    }

    return project;
  };

  /**
   * Recompute all milestone statuses for a project and update project status
   */
  const recomputeProjectStatuses = async (projectId: string, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(Project) : projectRepo;

    const project = await repo.findOne({
      where: { id: projectId, deleted: false },
      relations: ["milestones"]
    });

    if (!project) throw new AppError(404, "Project not found");

    // Recompute each milestone first
    for (const m of project.milestones) {
      await updateMilestoneStatus(m.id, queryRunner);
    }

    // Then update project status based on NORMAL milestones only
    await updateProjectStatus(projectId, queryRunner);

    return await getProjectStatusDetails(projectId);
  };

  /**
   * Recompute all projects' milestone and project statuses
   * Useful for fixing existing projects after logic updates
   */
  const recomputeAllProjectStatuses = async (queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(Project) : projectRepo;

    const projects = await repo.find({
      where: { deleted: false },
      relations: ["milestones"]
    });

    const results = [];
    
    for (const project of projects) {
      try {
        // Recompute each milestone first
        for (const milestone of project.milestones) {
          await updateMilestoneStatus(milestone.id, queryRunner);
        }
        
        // Then update project status
        await updateProjectStatus(project.id, queryRunner);
        
        results.push({
          projectId: project.id,
          projectName: project.name,
          status: 'success'
        });
      } catch (error) {
        results.push({
          projectId: project.id,
          projectName: project.name,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      message: `Recomputed statuses for ${projects.length} projects`,
      results
    };
  };

  /**
   * Get project status with detailed milestone and task information
   */
  const getProjectStatusDetails = async (projectId: string) => {
    const project = await projectRepo.findOne({
      where: { id: projectId, deleted: false },
      relations: [
        "milestones",
        "milestones.tasks"
      ]
    });

    if (!project) throw new AppError(404, "Project not found");

    const statusSummary = {
      project: {
        id: project.id,
        name: project.name,
        status: project.status
      },
      milestones: project.milestones.map(milestone => ({
        id: milestone.id,
        name: milestone.name,
        status: milestone.status,
        start_date: milestone.start_date,
        end_date: milestone.end_date,
        tasks: milestone.tasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status
        }))
      }))
    };

    return statusSummary;
  };

  return {
    updateTaskStatus,
    updateMilestoneStatus,
    updateProjectStatus,
    getProjectStatusDetails,
    recomputeProjectStatuses,
    recomputeAllProjectStatuses
  };
}; 