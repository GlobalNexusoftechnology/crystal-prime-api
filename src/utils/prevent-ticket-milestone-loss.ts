import "reflect-metadata";
import { AppDataSource } from "./data-source";

export const addTicketMilestoneConstraint = async () => {
  try {
    console.log("Adding constraint to prevent tickets from losing milestone association...");
    
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Database connected successfully!");
    }
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Add a check constraint to ensure milestone_id is not null for non-deleted tickets
      await queryRunner.query(`
        ALTER TABLE "tickets" 
        ADD CONSTRAINT "check_ticket_milestone_not_null" 
        CHECK (
          ("deleted" = true) OR 
          ("deleted" = false AND "milestone_id" IS NOT NULL)
        )
      `);
      
      await queryRunner.commitTransaction();
      console.log("✅ Successfully added constraint to prevent tickets from losing milestone association");
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log("⚠️  Constraint already exists, skipping...");
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error("Failed to add constraint:", error);
    throw error;
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Database connection closed.");
    }
  }
};

// Run if this file is executed directly
if (require.main === module) {
  addTicketMilestoneConstraint()
    .then(() => {
      console.log("✅ Constraint addition completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Constraint addition failed:", error);
      process.exit(1);
    });
}
