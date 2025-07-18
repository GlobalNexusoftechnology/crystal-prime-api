import { MigrationInterface, QueryRunner } from "typeorm";

export class addedTaskComments1703123456789 implements MigrationInterface {
    name = 'addedTaskComments1703123456789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "task_comments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted" boolean NOT NULL DEFAULT false,
                "deleted_at" TIMESTAMP,
                "task_id" uuid NOT NULL,
                "assigned_to" uuid NOT NULL,
                "remarks" text NOT NULL,
                CONSTRAINT "PK_task_comments_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "task_comments" 
            ADD CONSTRAINT "FK_task_comments_task_id" 
            FOREIGN KEY ("task_id") REFERENCES "project_tasks"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "task_comments" 
            ADD CONSTRAINT "FK_task_comments_assigned_to" 
            FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_task_comments_task_id" ON "task_comments" ("task_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_task_comments_assigned_to" ON "task_comments" ("assigned_to")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_task_comments_assigned_to"`);
        await queryRunner.query(`DROP INDEX "IDX_task_comments_task_id"`);
        await queryRunner.query(`ALTER TABLE "task_comments" DROP CONSTRAINT "FK_task_comments_assigned_to"`);
        await queryRunner.query(`ALTER TABLE "task_comments" DROP CONSTRAINT "FK_task_comments_task_id"`);
        await queryRunner.query(`DROP TABLE "task_comments"`);
    }
} 