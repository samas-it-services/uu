/**
 * Playwright Global Teardown
 *
 * Runs after all tests to clean up resources.
 */

import { cleanupTestFirebase } from './helpers/auth';

async function globalTeardown() {
  console.log('Running E2E global teardown...');

  try {
    await cleanupTestFirebase();
    console.log('E2E global teardown complete!');
  } catch (error) {
    console.error('Global teardown failed:', error);
    // Don't throw - teardown failures shouldn't fail the test run
  }
}

export default globalTeardown;
