import { pool } from './index';
import fs from 'fs';
import path from 'path';

async function runMigration(): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Read and execute the migration SQL file
    const sqlFilePath = path.join(__dirname, 'migrations/add_employee_id_column.sql');
    const sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL commands
    await client.query(sqlCommands);
    
    console.log('Successfully added employee_id column to users table');
  } catch (error) {
    console.error('Error executing migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  runMigration();
}

export { runMigration as migrate }; 