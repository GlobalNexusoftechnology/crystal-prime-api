require('dotenv').config();
require('ts-node/register');

const { migrateSupportMilestones } = require('../src/utils/migrate-support-milestones.ts');

async function runMigration() {
  try {
    console.log('🚀 Starting Support Milestone Migration...');
    await migrateSupportMilestones();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
