import { pool } from './index';
import fs from 'fs';
import path from 'path';

export async function resetSequence(): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../migrations/reset_id_sequence.sql');
    const sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL commands
    await client.query(sqlCommands);
    
    console.log('Successfully reset all ID sequences');
  } catch (error) {
    console.error('Error resetting sequences:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  resetSequence();
} 