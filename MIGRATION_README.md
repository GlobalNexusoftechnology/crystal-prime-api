# Support Milestone Migration

This migration script will add a "Support" milestone with a "Tickets" task to all existing projects that don't already have one.

## What This Migration Does

1. **Finds all existing projects** that don't have a Support milestone
2. **Creates a Support milestone** for each project with:
   - Name: "Support"
   - Description: "Support and maintenance milestone for ongoing project support"
   - Status: "Open"
   - Start date: Current date
   - End date: Project end date or 1 year from now
3. **Creates a Tickets task** within each Support milestone with:
   - Title: "Tickets"
   - Description: "Handle tickets and maintenance requests"
   - Status: "Open"
   - Assigned to: "Support Team"

## How to Run the Migration

### Option 1: Using npm script (Recommended)
```bash
npm run migrate:support
```

### Option 2: Direct execution
```bash
node scripts/migrate-support-milestones.js
```

### Option 3: Using TypeScript directly
```bash
npx ts-node src/utils/migrate-support-milestones.ts
```

## What to Expect

The migration will show output like this:

```
🚀 Starting Support Milestone Migration...
Starting migration for Support Milestones...
Found 5 projects to migrate
Migrating project: Project A (ID: uuid-1)
✅ Successfully migrated project: Project A
Migrating project: Project B (ID: uuid-2)
✅ Successfully migrated project: Project B
Project "Project C" already has Support milestone, skipping...

=== Migration Summary ===
Total projects processed: 5
Successfully migrated: 2
Errors: 0
Migration completed!
✅ Migration completed successfully!
```

## Safety Features

- **Skip existing**: Projects that already have a Support milestone will be skipped
- **Error handling**: If one project fails, others will still be processed
- **Detailed logging**: Shows progress and any errors
- **Summary report**: Shows total processed, successful, and failed migrations

## After Migration

Once the migration is complete:

1. **All existing projects** will have a Support milestone with a Tickets task
2. **New projects** will automatically get Support milestones (already implemented)
3. **Tickets can be created** and assigned to the Support task
4. **View tickets by task**: Use `GET /api/tickets/task/{task-id}`

## Rollback (If Needed)

If you need to rollback, you can manually delete the Support milestones and tasks from the database, or create a rollback script.

## Verification

After running the migration, you can verify it worked by:

1. **Check projects in database**: Look for Support milestones
2. **Check tasks**: Look for "Tickets" tasks within Support milestones
3. **Test API**: Try creating a ticket and assigning it to the Support task
4. **View tickets**: Use the ticket APIs to see tickets in the Support task

## Support

If you encounter any issues during migration, check:
- Database connection
- Permissions
- Console output for specific error messages
