import { resetSequence } from '../db/reset_sequence';

async function main() {
  try {
    await resetSequence();
    process.exit(0);
  } catch (error) {
    console.error('Failed to reset sequence:', error);
    process.exit(1);
  }
}

main(); 