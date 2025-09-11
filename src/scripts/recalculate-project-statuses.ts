import "reflect-metadata";
import { AppDataSource } from "../utils/data-source";
import { Project } from "../entities/projects.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { ProjectTasks } from "../entities/project-task.entity";
import { Ticket } from "../entities/ticket.entity";
import { TaskStatusService } from "../services/task-status.service";

async function recalcAllProjectStatuses() {
  try {
    console.log("Connecting to database (AppDataSource)...");
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log("DB connected.");

    const projectRepo = AppDataSource.getRepository(Project);
    const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);
    const taskRepo = AppDataSource.getRepository(ProjectTasks);
    const { updateProjectStatus } = TaskStatusService();

    const projects = await projectRepo.find({ where: { deleted: false } });

    let success = 0;
    let failed = 0;

    for (const project of projects) {
      try {
        // Recalculate all milestone statuses based on tasks and tickets
        const milestones = await milestoneRepo.find({
          where: { project: { id: project.id }, deleted: false },
          relations: ["tickets"],
        });

        for (const ms of milestones) {
          const isSupport = (ms.name || "").toLowerCase() === "support";
          let newStatus = ms.status;

          if (isSupport) {
            // Support milestone: use ticket-based logic
            const tickets = (ms.tickets || []) as Ticket[];
            const statuses = tickets.map((t: any) => (t.status || "").toLowerCase());

            if (tickets.length === 0) {
              // No tickets under Support -> milestone should be Open
              newStatus = "Open";
            } else {
              const anyInProgress = statuses.some((s: string) => s === "in progress" || s === "in-progress");
              const allOpen = statuses.length > 0 && statuses.every((s: string) => s === "open");
              const allCompleted = statuses.length > 0 && statuses.every((s: string) => s === "completed");

              if (anyInProgress) newStatus = "In Progress";
              else if (allOpen) newStatus = "Open";
              else if (allCompleted) newStatus = "Completed";
              else newStatus = "In Progress"; // mixed open/completed
            }
          } else {
            // Non-Support milestone: use task-based logic
            const tasks = await taskRepo.find({
              where: { milestone: { id: ms.id }, deleted: false }
            });

            if (tasks.length === 0) {
              // No tasks -> milestone should be Open by default
              newStatus = "Open";
            } else {
              const allTasksCompleted = tasks.every((task: any) => task.status === "Completed");
              const anyInProgress = tasks.some((task: any) => task.status === "In Progress");
              const allOpen = tasks.every((task: any) => task.status === "Open");
              const anyOpen = tasks.some((task: any) => task.status === "Open");
              const anyCompleted = tasks.some((task: any) => task.status === "Completed");

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

          if (newStatus !== ms.status) {
            ms.status = newStatus as any;
            await milestoneRepo.save(ms);
          }
        }

        // Now recalc project status using service rules
        await updateProjectStatus(project.id);
        success++;
        console.log(`✅ Updated project ${project.name} (${project.id})`);
      } catch (err: any) {
        failed++;
        console.error(`❌ Failed project ${project.name} (${project.id})`, err?.message || err);
      }
    }

    console.log("\n=== Recalculation Summary ===");
    console.log(`Processed: ${projects.length}`);
    console.log(`Succeeded: ${success}`);
    console.log(`Failed: ${failed}`);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("DB connection closed.");
    }
  }
}

recalcAllProjectStatuses()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));


