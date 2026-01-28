/**
 * Fix Superuser Roles Script (Admin SDK)
 *
 * This script sets `role: 'superuser'` for designated admin users.
 * It queries users by email and updates their role field.
 *
 * Prerequisites (one of the following):
 * Option A: Service Account Key
 *   1. Go to Firebase Console > Project Settings > Service Accounts
 *   2. Click "Generate New Private Key"
 *   3. Save as: samas-portal/serviceAccountKey.json (gitignored)
 *
 * Option B: Application Default Credentials (ADC)
 *   1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
 *   2. Run: gcloud auth application-default login
 *   3. Set env var: export GOOGLE_CLOUD_PROJECT=uu-portal-60426
 *
 * Usage:
 *   cd samas-portal
 *   npx ts-node scripts/fixSuperuserRoles.ts
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import type { ServiceAccount } from 'firebase-admin/app';

// ES Module support for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

// Emails that should have superuser role
const SUPERUSER_EMAILS = [
  'bilgrami@gmail.com',
  'bill@samas.tech',
];

const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');
const projectId = 'uu-portal-60426';

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

function initializeFirebaseAdmin() {
  // Method 1: Check for service account key file
  if (existsSync(serviceAccountPath)) {
    console.log('Using service account key from: serviceAccountKey.json\n');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;
    initializeApp({
      credential: cert(serviceAccount),
    });
    return;
  }

  // Method 2: Check GOOGLE_APPLICATION_CREDENTIALS env var
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Using GOOGLE_APPLICATION_CREDENTIALS env var\n');
    initializeApp({
      credential: applicationDefault(),
      projectId: projectId,
    });
    return;
  }

  // Method 3: Try Application Default Credentials (ADC)
  try {
    console.log('Attempting to use Application Default Credentials (ADC)...');
    console.log('(Run "gcloud auth application-default login" if this fails)\n');
    initializeApp({
      credential: applicationDefault(),
      projectId: projectId,
    });
    return;
  } catch {
    console.error('========================================');
    console.error('ERROR: No valid credentials found!');
    console.error('========================================\n');
    console.error('To fix this, use one of these options:\n');
    console.error('Option A: Service Account Key');
    console.error('  1. Go to Firebase Console > Project Settings > Service Accounts');
    console.error('  2. Click "Generate New Private Key"');
    console.error('  3. Save as: samas-portal/serviceAccountKey.json\n');
    console.error('Option B: Application Default Credentials');
    console.error('  1. Install gcloud: https://cloud.google.com/sdk/docs/install');
    console.error('  2. Run: gcloud auth application-default login');
    console.error('  3. Run: export GOOGLE_CLOUD_PROJECT=uu-portal-60426\n');
    process.exit(1);
  }
}

initializeFirebaseAdmin();
const db = getFirestore();

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function fixSuperuserRoles() {
  console.log('========================================');
  console.log('Fix Superuser Roles Script');
  console.log('========================================\n');
  console.log('Target emails:', SUPERUSER_EMAILS.join(', '));
  console.log('');

  let updatedCount = 0;
  let notFoundCount = 0;
  let alreadyCorrectCount = 0;

  for (const email of SUPERUSER_EMAILS) {
    console.log(`\nProcessing: ${email}`);

    // Query users collection by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      console.log(`  NOT FOUND - No user document with this email`);
      notFoundCount++;
      continue;
    }

    // Should be exactly one user per email
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    console.log(`  Found user: ${userDoc.id}`);
    console.log(`  Current role: ${userData.role || '(not set)'}`);

    if (userData.role === 'superuser') {
      console.log(`  ALREADY CORRECT - No update needed`);
      alreadyCorrectCount++;
      continue;
    }

    // Update role to superuser
    await userDoc.ref.update({
      role: 'superuser',
      updatedAt: Timestamp.now(),
    });

    console.log(`  UPDATED - Role set to 'superuser'`);
    updatedCount++;
  }

  // Summary
  console.log('\n========================================');
  console.log('Summary');
  console.log('========================================');
  console.log(`Updated:         ${updatedCount}`);
  console.log(`Already correct: ${alreadyCorrectCount}`);
  console.log(`Not found:       ${notFoundCount}`);
  console.log('========================================\n');

  if (updatedCount > 0) {
    console.log('Users should now see projects, tasks, and finance data.');
    console.log('Have them log out and log back in, or refresh the page.');
  }
}

// ============================================================================
// RUN
// ============================================================================

fixSuperuserRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
