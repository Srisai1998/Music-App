import db from '../config/database';
import path from 'path';

async function run() {
  console.log('🗃️  Running database migrations...');
  await db.migrate.latest({
    directory: path.join(__dirname, '../migrations'),
    loadExtensions: ['.ts'],
  });
  console.log('✅ Migrations complete');
  await db.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
