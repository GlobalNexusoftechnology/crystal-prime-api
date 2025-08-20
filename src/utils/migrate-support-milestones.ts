import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Project } from "../entities/projects.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";
import { ProjectTasks } from "../entities/project-task.entity";
import { MilestoneService } from "../services/project-milestone.service";
import { ProjectTaskService } from "../services/project-task.service";

export const migrateSupportMilestones = async () => {
  try {
    console.log("Starting migration for Support Milestones...");
    
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Database connected successfully!");
    }
    
    // Initialize repositories
    const projectRepo = AppDataSource.getRepository(Project);
    const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);
    const taskRepo = AppDataSource.getRepository(ProjectTasks);
    const milestoneService = MilestoneService();
    const taskService = ProjectTaskService();
    
    // Get all projects that don't have a Support milestone
    const projects = await projectRepo.find({
      where: { deleted: false },
      relations: ["milestones"]
    });

    console.log(`Found ${projects.length} projects to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const project of projects) {
      try {
        // Check if project already has a Support milestone
        const existingSupportMilestone = project.milestones?.find(
          milestone => milestone.name.toLowerCase() === "support"
        );

        if (existingSupportMilestone) {
          console.log(`Project "${project.name}" already has Support milestone, skipping...`);
          continue;
        }

        console.log(`Migrating project: ${project.name} (ID: ${project.id})`);

        // Create Support Milestone
        const supportMilestone = await milestoneService.createMilestone({
          name: "Support",
          description: "Support and maintenance milestone for ongoing project support",
          status: "Open",
          project_id: project.id,
          start_date: new Date(),
          end_date: project.end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now if no end date
        });

        // Create Tickets Task within the milestone
        await taskService.createTask({
          milestone_id: supportMilestone.id,
          title: "Tickets",
          description: "Handle tickets and maintenance requests",
          status: "Open",
          assigned_to: "Support Team",
        });

        migratedCount++;
        console.log(`✅ Successfully migrated project: ${project.name}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating project ${project.name}:`, error);
      }
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Total projects processed: ${projects.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log("Migration completed!");

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Database connection closed.");
    }
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateSupportMilestones()
    .then(() => {
      console.log("✅ Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}
