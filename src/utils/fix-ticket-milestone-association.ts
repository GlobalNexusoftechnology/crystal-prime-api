import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Ticket } from "../entities/ticket.entity";
import { ProjectMilestones } from "../entities/project-milestone.entity";

export const fixTicketMilestoneAssociation = async () => {
  try {
    console.log("Starting to fix ticket milestone associations...");
    
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Database connected successfully!");
    }
    
    // Initialize repositories
    const ticketRepo = AppDataSource.getRepository(Ticket);
    const milestoneRepo = AppDataSource.getRepository(ProjectMilestones);
    
    // Get all tickets that don't have a milestone_id
    const ticketsWithoutMilestone = await ticketRepo.find({
      where: { deleted: false },
      relations: ["project", "milestone"]
    });

    // Filter tickets that don't have a milestone
    const ticketsToFix = ticketsWithoutMilestone.filter(ticket => !ticket.milestone);

    console.log(`Found ${ticketsToFix.length} tickets without milestone association`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const ticket of ticketsToFix) {
      try {
        // Find the Support milestone for this ticket's project
        const supportMilestone = await milestoneRepo.findOne({
          where: { 
            project: { id: ticket.project.id }, 
            name: "Support", 
            deleted: false 
          }
        });

        if (supportMilestone) {
          // Update the ticket to point to the Support milestone
          ticket.milestone = supportMilestone;
          await ticketRepo.save(ticket);
          fixedCount++;
          console.log(`✅ Fixed ticket: ${ticket.title} (ID: ${ticket.id})`);
        } else {
          console.log(`⚠️  No Support milestone found for project: ${ticket.project.name} (ID: ${ticket.project.id})`);
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error fixing ticket ${ticket.id}:`, error);
      }
    }

    console.log("\n=== Fix Summary ===");
    console.log(`Total tickets processed: ${ticketsToFix.length}`);
    console.log(`Successfully fixed: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log("Ticket milestone association fix completed!");

  } catch (error) {
    console.error("Fix failed:", error);
    throw error;
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Database connection closed.");
    }
  }
};

// Run fix if this file is executed directly
if (require.main === module) {
  fixTicketMilestoneAssociation()
    .then(() => {
      console.log("✅ Ticket milestone association fix completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Ticket milestone association fix failed:", error);
      process.exit(1);
    });
}
