import "reflect-metadata";
import { AppDataSource } from "../utils/data-source";
import { Project } from "../entities/projects.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { ProjectTasks } from "../entities/project-task.entity";
import { Ticket } from "../entities/ticket.entity";
import { TaskStatusService } from "../services/task-status.service";

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find(a => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

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
    const { updateProjectStatus, recomputeProjectStatuses } = TaskStatusService();

    const projectIdArg = getArg("projectId");

    // If projectId provided, only process that project; else process all
    const projects = projectIdArg
      ? await projectRepo.find({ where: { id: projectIdArg, deleted: false } })
      : await projectRepo.find({ where: { deleted: false } });

    let success = 0;
    let failed = 0;

    for (const project of projects) {
      try {
        // Delegate recomputation to service (handles support milestones, tasks, tickets, and project status)
        await recomputeProjectStatuses(project.id);
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


