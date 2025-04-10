const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error); 