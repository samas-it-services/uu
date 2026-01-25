/**
 * Phase 1 E2E Tests - Dashboard
 *
 * Note: These tests require authentication setup.
 * For full E2E testing, Firebase emulators should be running
 * and test users should be pre-seeded.
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  // Skip tests that require authentication for now
  // These will be enabled once Firebase emulators are configured

  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Dashboard Elements', () => {
    // These tests would run with mocked authentication
    // For now, we test the login page elements that lead to dashboard

    test('should have working login flow UI', async ({ page }) => {
      await page.goto('/login');

      // Verify login page has all expected elements
      await expect(page.getByText('Welcome to SaMas Portal')).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
    });
  });
});

// Test fixtures for authenticated tests
// These would be used once we set up proper auth mocking

test.describe('Dashboard (Authenticated)', () => {
  test.skip('should display welcome message with user name', async ({ page: _page }) => {
    // TODO: Implement with Firebase emulator auth
    // await authenticateUser(page, 'bill@samas.tech');
    // await page.goto('/dashboard');
    // await expect(page.getByText(/Welcome back/)).toBeVisible();
  });

  test.skip('should display stat cards', async ({ page: _page }) => {
    // TODO: Implement with Firebase emulator auth
    // await authenticateUser(page, 'bill@samas.tech');
    // await page.goto('/dashboard');
    // await expect(page.getByText('My Tasks')).toBeVisible();
    // await expect(page.getByText('Projects')).toBeVisible();
    // await expect(page.getByText('Documents')).toBeVisible();
  });

  test.skip('should show admin dashboard for super admin', async ({ page: _page }) => {
    // TODO: Implement with Firebase emulator auth
    // await authenticateUser(page, 'bill@samas.tech');
    // await page.goto('/dashboard');
    // await expect(page.getByText('System Overview')).toBeVisible();
    // await expect(page.getByText('Quick Actions')).toBeVisible();
  });

  test.skip('should show pending approvals for finance manager', async ({ page: _page }) => {
    // TODO: Implement with Firebase emulator auth
    // await authenticateUser(page, 'finance@samas.tech');
    // await page.goto('/dashboard');
    // await expect(page.getByText('Pending Approvals')).toBeVisible();
  });

  test.skip('should display active users count', async ({ page: _page }) => {
    // TODO: This tests the "logged-in users" bug fix
    // await authenticateUser(page, 'bill@samas.tech');
    // await page.goto('/dashboard');
    // const activeUsersText = await page.getByText(/Active Users/).textContent();
    // expect(activeUsersText).not.toContain('12 Online'); // Should not be hardcoded
  });
});
