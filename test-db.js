import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function testConnection() {
  try {
    const result = await sql`SELECT current_timestamp;`;
    console.log('Connection successful!');
    console.log('Current timestamp:', result[0].current_timestamp);
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await sql.end();
  }
}

testConnection(); 