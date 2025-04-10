const { pool } = require('./index');
const fs = require('fs');
const path = require('path');

async function runMigration() {
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
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate: runMigration }; 