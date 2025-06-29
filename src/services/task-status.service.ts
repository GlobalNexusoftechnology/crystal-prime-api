import { AppDataSource } from "../utils/data-source";
import { Project, ProjectStatus } from "../entities/projects.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { ProjectTasks } from "../entities/project-task.entity";
import AppError from "../utils/appError";

const projectRepo = AppDataSource.getRepository(Project);
const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);
const taskRepo = AppDataSource.getRepository(ProjectTasks);

export const TaskStatusService = () => {
  /**
   * Update task status and cascade to milestone and project
   */
  const updateTaskStatus = async (taskId: string, newStatus: string, queryRunner?: any) => {
    const repo = queryRunner ? queryRunner.manager.getRepository(ProjectTasks) : taskRepo;

    const task = await repo.findOne({
      where: { id: taskId, deleted: false },
      relations: ["milestone", "milestone.project"]
    });

    if (!task) throw new AppError(404, "Task not found");

    const oldStatus = task.status;
    task.status = newStatus;
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
      
      // Set start date when milestone moves to "In Progress"
      if (newStatus === "In Progress" && !milestone.start_date) {
        milestone.start_date = new Date();
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
      relations: ["tasks"]
    });

    if (milestones.length === 0) {
      // No milestones, keep project as Open
      return project;
    }

    let newStatus = ProjectStatus.OPEN;
    let allMilestonesCompleted = true;
    let hasInProgressMilestone = false;
    let hasOpenMilestone = false;

    for (const milestone of milestones) {
      if (milestone.status === "In Progress") {
        hasInProgressMilestone = true;
        allMilestonesCompleted = false; // If any milestone is in progress, not all are completed
      } else if (milestone.status === "Open") {
        hasOpenMilestone = true;
        allMilestonesCompleted = false; // If any milestone is open, not all are completed
      } else if (milestone.status !== "Completed") {
        allMilestonesCompleted = false;
      }
    }

    // Determine project status based on milestone statuses
    if (hasInProgressMilestone) {
      newStatus = ProjectStatus.IN_PROGRESS;
    } else if (allMilestonesCompleted && milestones.length > 0) {
      newStatus = ProjectStatus.COMPLETED;
    } else if (hasOpenMilestone) {
      newStatus = ProjectStatus.OPEN;
    }

    // Only update if status has changed
    if (project.status !== newStatus) {
      project.status = newStatus;
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