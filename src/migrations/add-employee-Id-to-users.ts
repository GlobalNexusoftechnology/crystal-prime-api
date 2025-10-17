import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmployeeIdToUsers1708152000000 implements MigrationInterface {
    name = 'AddEmployeeIdToUsers1708152000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add employee_id column if it doesn't exist
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "employee_id" character varying(50)
        `);

        // Ensure unique constraint only if not already defined
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'UQ_users_employee_id'
                ) THEN
                    ALTER TABLE "users"
                    ADD CONSTRAINT "UQ_users_employee_id" UNIQUE ("employee_id");
                END IF;
            END
            $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop unique constraint if exists
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP CONSTRAINT IF EXISTS "UQ_users_employee_id";
        `);

        // Drop employee_id column if exists
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "employee_id";
        `);
    }
}
