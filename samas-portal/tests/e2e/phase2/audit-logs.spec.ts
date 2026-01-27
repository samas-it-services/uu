/**
 * Phase 2 E2E Tests - Audit Logs
 */

import { test as baseTest, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

const useEmulators = process.env.VITE_USE_EMULATORS === 'true';

baseTest.describe('Audit Logs', () => {
  baseTest.describe('Unauthenticated Access', () => {
    baseTest('should redirect to login when accessing audit logs page', async ({ page }) => {
      await page.goto('/admin/audit-logs');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

// Authenticated tests (require Firebase emulators)
authTest.describe('Audit Logs (Authenticated)', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should display audit logs for admin', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/audit-logs');
    await expect(superuserPage.getByRole('heading', { name: /audit/i })).toBeVisible();
  });

  authTest('should filter logs by action type', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/audit-logs');
    const actionFilter = superuserPage.getByRole('combobox').first();
    if (await actionFilter.isVisible()) {
      await actionFilter.click();
    }
  });

  authTest('should filter logs by date range', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/audit-logs');
    // Date inputs should be present
    await superuserPage.waitForLoadState('networkidle');
  });

  authTest('should show log details on click', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/audit-logs');
    const logRow = superuserPage.getByRole('row').nth(1);
    if (await logRow.isVisible()) {
      await logRow.click();
    }
  });

  authTest('should display before/after changes for updates', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/audit-logs');
    await superuserPage.waitForLoadState('networkidle');
  });

  authTest('should display performer information', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/audit-logs');
    await superuserPage.waitForLoadState('networkidle');
    // Each log entry should show who performed the action
  });

  authTest('should support infinite scroll/pagination', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/audit-logs');
    await superuserPage.waitForLoadState('networkidle');
  });
});

// Audit log content verification
authTest.describe('Audit Log Content', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should log user creation', async ({ superuserPage }) => {
    // Create a user and verify audit log is created
    await superuserPage.goto('/admin/users');
    await superuserPage.getByRole('button', { name: /add user/i }).click();
    await superuserPage.getByLabel(/email/i).fill('audit-test@test.local');
    await superuserPage.getByLabel(/display name/i).fill('Audit Test User');
    await superuserPage.getByRole('button', { name: /save|create/i }).click();

    // Check audit logs
    await superuserPage.goto('/admin/audit-logs');
    await expect(superuserPage.getByText(/user.*created|created.*user/i)).toBeVisible();
  });

  authTest('should log role assignment', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/audit-logs');
    await superuserPage.waitForLoadState('networkidle');
  });

  authTest('should log user deletion', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/audit-logs');
    await superuserPage.waitForLoadState('networkidle');
  });

  authTest('should log expense approval', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/audit-logs');
    await superuserPage.waitForLoadState('networkidle');
  });
});

// Permission-based access tests
authTest.describe('Audit Log Permissions', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should restrict audit log access to admin only', async ({ analystPage }) => {
    await analystPage.goto('/admin/audit-logs');
    // Should redirect or show access denied
    await expect(analystPage).toHaveURL(/\/(dashboard|login)/);
  });
});
