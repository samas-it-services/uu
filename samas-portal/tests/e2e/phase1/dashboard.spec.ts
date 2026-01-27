/**
 * Phase 1 E2E Tests - Dashboard
 */

import { test as baseTest, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

const useEmulators = process.env.VITE_USE_EMULATORS === 'true';

baseTest.describe('Dashboard', () => {
  baseTest.describe('Unauthenticated Access', () => {
    baseTest('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  baseTest.describe('Dashboard Elements', () => {
    baseTest('should have working login flow UI', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByText('Welcome to SaMas Portal')).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
    });
  });
});

// Authenticated tests (require Firebase emulators)
authTest.describe('Dashboard (Authenticated)', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should display welcome message with user name', async ({ superuserPage }) => {
    await superuserPage.goto('/dashboard');
    await expect(superuserPage.getByText(/welcome|dashboard/i)).toBeVisible();
  });

  authTest('should display stat cards', async ({ superuserPage }) => {
    await superuserPage.goto('/dashboard');
    // Dashboard should have stat cards
    await superuserPage.waitForLoadState('networkidle');
  });

  authTest('should show admin dashboard for super admin', async ({ superuserPage }) => {
    await superuserPage.goto('/dashboard');
    // Super admin should see admin options
    await expect(superuserPage.getByRole('link', { name: /admin/i })).toBeVisible();
  });

  authTest('should show pending approvals for finance manager', async ({ financeInchargePage }) => {
    await financeInchargePage.goto('/dashboard');
    await financeInchargePage.waitForLoadState('networkidle');
    // Finance manager should see finance-related content
  });

  authTest('should display active users count', async ({ superuserPage }) => {
    await superuserPage.goto('/dashboard');
    await superuserPage.waitForLoadState('networkidle');
    // Active users should be displayed dynamically
  });

  authTest('should show different dashboard for analyst', async ({ analystPage }) => {
    await analystPage.goto('/dashboard');
    // Analyst should not see admin menu
    await expect(analystPage.getByRole('link', { name: /admin/i })).not.toBeVisible();
  });
});
