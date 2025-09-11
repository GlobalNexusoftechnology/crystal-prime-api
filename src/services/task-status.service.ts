import { AppDataSource } from "../utils/data-source";
import { Project, ProjectStatus } from "../entities/projects.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { ProjectTasks } from "../entities/project-task.entity";
import { ProjectMilestoneMaster } from "../entities/milestone-master.entity";
import AppError from "../utils/appError";

const projectRepo = AppDataSource.getRepository(Project);
const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);
const taskRepo = AppDataSource.getRepository(ProjectTasks);
const milestoneMasterRepo = AppDataSource.getRepository(ProjectMilestoneMaster);

export const TaskStatusService = () => {
  /**
   * Update task status and cascade to milestone and project
   */
  const updateTaskStatus = async (taskId: string, newStatus: string, queryRunner?: any) => {
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

    await repo.save(task);

    // Update milestone status if task status changed
    if (oldStatus !== newStatus && task.milestone) {
      await updateMilestoneStatus(task.milestone.id, queryRunner);
    }

    return task;
  };

  /**
   * Update milestone status based on task completion
   */
  const updateMilestoneStatus = async (milestoneId: string, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectMilestones) : milestoneRepo;

    const milestone = await repo.findOne({
      where: { id: milestoneId, deleted: false },
      relations: ["tasks", "project"]
    });

    if (!milestone) throw new AppError(404, "Milestone not found");

    const tasks = await taskRepo.find({
      where: { milestone: { id: milestoneId }, deleted: false }
    });

    if (tasks.length === 0) {
      // No tasks, keep current status
      return milestone;
    }

    const allTasksCompleted = tasks.every((task: ProjectTasks) => task.status === "Completed");
    const hasInProgressTasks = tasks.some((task: ProjectTasks) => task.status === "In Progress");
    const hasOpenTasks = tasks.some((task: ProjectTasks) => task.status === "Open");

    let newStatus = milestone.status;

    if (allTasksCompleted) {
      newStatus = "Completed";
    } else if (hasInProgressTasks) {
      newStatus = "In Progress";
    } else if (hasOpenTasks) {
      newStatus = "Open";
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
   * Update project status based on milestone statuses
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

    // Separate support milestones from other milestones
    const supportMilestones = milestones.filter(m => (m.name || "").toLowerCase() === "support");
    const nonSupportMilestones = milestones.filter(m => (m.name || "").toLowerCase() !== "support");

    let newStatus = ProjectStatus.OPEN;

    // Build effective milestones list: ignore Support milestones that have zero tickets
    const supportTickets = supportMilestones.flatMap(m => m.tickets || []);
    const effectiveMilestones = milestones.filter(m => {
      const isSupport = (m.name || "").toLowerCase() === "support";
      if (!isSupport) return true;
      const ticketsCount = (m.tickets || []).length;
      return ticketsCount > 0; // count Support only when it actually has tickets
    });

    const anyInProgress = effectiveMilestones.some(m => m.status === "In Progress" || m.status === "in_progress");
    const allOpen = effectiveMilestones.length > 0 && effectiveMilestones.every(m => m.status === "Open");
    const allCompleted = effectiveMilestones.length > 0 && effectiveMilestones.every(m => m.status === "Completed");
    const hasOpen = effectiveMilestones.some(m => m.status === "Open");

    if (anyInProgress) {
      newStatus = ProjectStatus.IN_PROGRESS;
    } else if (allOpen) {
      newStatus = ProjectStatus.OPEN;
    } else if (allCompleted || effectiveMilestones.length === 0) {
      // All effective milestones completed or none remain -> use Support tickets rule if Support exists
      if (supportMilestones.length > 0) {
        if (supportTickets.length === 0) {
          newStatus = ProjectStatus.COMPLETED;
        } else {
          const allSupportTicketsCompleted = supportTickets.every(t => (t.status || "").toLowerCase() === "completed");
          const anySupportOpenOrInProgress = supportTickets.some(t => {
            const s = (t.status || "").toLowerCase();
            return s === "open" || s === "in progress" || s === "in-progress";
          });
          newStatus = allSupportTicketsCompleted ? ProjectStatus.COMPLETED : (anySupportOpenOrInProgress ? ProjectStatus.IN_PROGRESS : ProjectStatus.OPEN);
        }
      } else {
        newStatus = ProjectStatus.COMPLETED;
      }
    } else if (!allCompleted && !allOpen) {
      // Mixed (some Completed, some Open) without any In Progress => In Progress
      newStatus = ProjectStatus.IN_PROGRESS;
    } else {
      // Fallback
      newStatus = ProjectStatus.OPEN;
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
    getProjectStatusDetails
  };
}; 