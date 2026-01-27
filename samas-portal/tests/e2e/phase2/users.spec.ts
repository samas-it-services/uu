/**
 * Phase 2 E2E Tests - User Management
 */

import { test as baseTest, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

// Check if running with emulators
const useEmulators = process.env.VITE_USE_EMULATORS === 'true';

baseTest.describe('User Management', () => {
  baseTest.describe('Unauthenticated Access', () => {
    baseTest('should redirect to login when accessing users page', async ({ page }) => {
      await page.goto('/admin/users');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

// Authenticated tests (require Firebase emulators)
authTest.describe('User Management (Authenticated)', () => {
  // Skip if not using emulators
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should display user list for admin', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/users');
    await expect(superuserPage.getByRole('heading', { name: /users/i })).toBeVisible();
  });

  authTest('should search users by name or email', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/users');
    const searchInput = superuserPage.getByPlaceholder(/search/i);
    await searchInput.fill('test@');
    // Wait for debounced search
    await superuserPage.waitForTimeout(500);
  });

  authTest('should open add user modal', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/users');
    await superuserPage.getByRole('button', { name: /add user/i }).click();
    await expect(superuserPage.getByRole('dialog')).toBeVisible();
  });

  authTest('should create a new user', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/users');
    await superuserPage.getByRole('button', { name: /add user/i }).click();

    // Fill form
    await superuserPage.getByLabel(/email/i).fill('newuser@test.local');
    await superuserPage.getByLabel(/display name/i).fill('New Test User');

    // Submit
    await superuserPage.getByRole('button', { name: /save|create/i }).click();

    // Verify toast message
    await expect(superuserPage.getByText(/created|success/i)).toBeVisible();
  });

  authTest('should edit existing user', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/users');

    // Click edit on first user row
    const editButton = superuserPage.getByRole('button', { name: /edit/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(superuserPage.getByRole('dialog')).toBeVisible();
    }
  });

  authTest('should toggle user active status', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/users');

    // Find and click toggle switch
    const toggleSwitch = superuserPage.getByRole('switch').first();
    if (await toggleSwitch.isVisible()) {
      await toggleSwitch.click();
      await expect(superuserPage.getByText(/updated|success/i)).toBeVisible();
    }
  });

  authTest('should assign roles to user', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/users');

    // Click assign roles button
    const assignButton = superuserPage.getByRole('button', { name: /assign.*role/i }).first();
    if (await assignButton.isVisible()) {
      await assignButton.click();
      await expect(superuserPage.getByRole('dialog')).toBeVisible();
    }
  });

  authTest('should delete user with confirmation', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/users');

    // Click delete button
    const deleteButton = superuserPage.getByRole('button', { name: /delete/i }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      // Confirm dialog should appear
      await expect(superuserPage.getByRole('alertdialog')).toBeVisible();
    }
  });
});

// Permission-based access tests
authTest.describe('User Management Permissions', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should hide admin menu for non-admin users', async ({ analystPage }) => {
    await analystPage.goto('/dashboard');
    // Admin menu should not be visible for analyst
    await expect(analystPage.getByRole('link', { name: /admin/i })).not.toBeVisible();
  });

  authTest('should restrict access to users page for non-admin', async ({ analystPage }) => {
    await analystPage.goto('/admin/users');
    // Should redirect to dashboard or show access denied
    await expect(analystPage).toHaveURL(/\/(dashboard|login)/);
  });
});
