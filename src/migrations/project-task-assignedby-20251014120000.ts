import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectTaskAssignedBy20251014120000 implements MigrationInterface {
  name = 'ProjectTaskAssignedBy20251014120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Ensure column exists and is of type uuid (robust handling if it existed as varchar)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'project_tasks' 
            AND column_name = 'assigned_by'
            AND data_type <> 'uuid'
        ) THEN
          BEGIN
            -- Try to convert existing column to uuid in-place
            BEGIN
              ALTER TABLE "project_tasks" 
              ALTER COLUMN "assigned_by" TYPE uuid 
              USING NULLIF("assigned_by", '')::uuid;
            EXCEPTION WHEN OTHERS THEN
              -- Fallback: create temp uuid column, copy, drop old, rename
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'project_tasks' AND column_name = 'assigned_by_uuid'
              ) THEN
                ALTER TABLE "project_tasks" ADD COLUMN "assigned_by_uuid" uuid;
              END IF;
              UPDATE "project_tasks" 
              SET "assigned_by_uuid" = NULLIF("assigned_by", '')::uuid 
              WHERE "assigned_by" IS NOT NULL AND "assigned_by" <> '';
              ALTER TABLE "project_tasks" DROP COLUMN "assigned_by";
              ALTER TABLE "project_tasks" RENAME COLUMN "assigned_by_uuid" TO "assigned_by";
            END;
          END;
        ELSIF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'project_tasks' AND column_name = 'assigned_by'
        ) THEN
          ALTER TABLE "project_tasks" ADD COLUMN "assigned_by" uuid;
        END IF;
      END$$;
    `);

    // 2) Create index if not exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c 
          JOIN pg_namespace n ON n.oid = c.relnamespace 
          WHERE c.relkind = 'i' 
            AND c.relname = 'IDX_project_tasks_assigned_by'
        ) THEN
          CREATE INDEX "IDX_project_tasks_assigned_by" ON "project_tasks" ("assigned_by");
        END IF;
      END$$;
    `);

    // 3) Add foreign key constraint if not exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = 'project_tasks'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND tc.constraint_name = 'FK_project_tasks_assigned_by_users'
        ) THEN
          ALTER TABLE "project_tasks"
          ADD CONSTRAINT "FK_project_tasks_assigned_by_users"
          FOREIGN KEY ("assigned_by") REFERENCES "users"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key if exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 
          FROM information_schema.table_constraints 
          WHERE table_name = 'project_tasks' 
            AND constraint_name = 'FK_project_tasks_assigned_by_users'
        ) THEN
          ALTER TABLE "project_tasks" DROP CONSTRAINT "FK_project_tasks_assigned_by_users";
        END IF;
      END$$;
    `);

    // Drop index if exists
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_project_tasks_assigned_by";`);

    // Drop column if exists
    await queryRunner.query(`ALTER TABLE "project_tasks" DROP COLUMN IF EXISTS "assigned_by";`);
  }
}


