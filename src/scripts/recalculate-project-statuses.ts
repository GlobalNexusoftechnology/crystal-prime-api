import "reflect-metadata";
import { AppDataSource } from "../utils/data-source";
import { Project } from "../entities/projects.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
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
    const { updateProjectStatus } = TaskStatusService();

    const projects = await projectRepo.find({ where: { deleted: false } });

    let success = 0;
    let failed = 0;

    for (const project of projects) {
      try {
        // Recalculate Support milestone status based on tickets
        const milestones = await milestoneRepo.find({
          where: { project: { id: project.id }, deleted: false },
          relations: ["tickets"],
        });

        for (const ms of milestones) {
          const isSupport = (ms.name || "").toLowerCase() === "support";
          if (!isSupport) continue;

          const tickets = (ms.tickets || []) as Ticket[];
          const statuses = tickets.map(t => (t.status || "").toLowerCase());

          let newStatus = ms.status;
          if (tickets.length === 0) {
            // No tickets under Support -> keep/mark Completed per new rule
            newStatus = "Completed";
          } else {
            const anyInProgress = statuses.some(s => s === "in progress" || s === "in-progress");
            const allOpen = statuses.length > 0 && statuses.every(s => s === "open");
            const allCompleted = statuses.length > 0 && statuses.every(s => s === "completed");

            if (anyInProgress) newStatus = "In Progress";
            else if (allOpen) newStatus = "Open";
            else if (allCompleted) newStatus = "Completed";
            else newStatus = "In Progress"; // mixed open/completed
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


