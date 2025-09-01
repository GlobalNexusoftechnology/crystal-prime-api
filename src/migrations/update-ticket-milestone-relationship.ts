import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTicketMilestoneRelationship1700000000000 implements MigrationInterface {
    name = 'UpdateTicketMilestoneRelationship1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add milestone_id column
        await queryRunner.query(`ALTER TABLE "tickets" ADD "milestone_id" uuid`);
        
        // Add foreign key constraint
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_milestone" FOREIGN KEY ("milestone_id") REFERENCES "project_milestones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        // Update existing tickets to point to Support milestone
        await queryRunner.query(`
            UPDATE "tickets" 
            SET "milestone_id" = (
                SELECT pm.id 
                FROM "project_milestones" pm 
                WHERE pm."project_id" = "tickets"."project_id" 
                AND pm.name = 'Support' 
                AND pm.deleted = false
            )
            WHERE "milestone_id" IS NULL
        `);
        
        // Drop task_id column and its foreign key
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "FK_tickets_task"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN IF EXISTS "task_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate task_id column
        await queryRunner.query(`ALTER TABLE "tickets" ADD "task_id" uuid`);
        
        // Add foreign key constraint back
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_task" FOREIGN KEY ("task_id") REFERENCES "project_tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        // Drop milestone_id column and its foreign key
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_tickets_milestone"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "milestone_id"`);
    }
}
