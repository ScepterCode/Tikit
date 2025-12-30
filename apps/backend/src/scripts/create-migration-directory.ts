import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

function createMigrationDirectory() {
  const migrationDir = join(process.cwd(), 'migration-data');
  
  if (!existsSync(migrationDir)) {
    mkdirSync(migrationDir, { recursive: true });
    console.log('✅ Created migration-data directory');
  } else {
    console.log('📁 migration-data directory already exists');
  }
}

createMigrationDirectory();