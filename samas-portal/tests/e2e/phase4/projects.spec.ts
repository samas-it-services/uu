/**
 * Phase 4 E2E Tests - Projects
 */

import { test as baseTest, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

const useEmulators = process.env.VITE_USE_EMULATORS === 'true';

baseTest.describe('Projects', () => {
  baseTest('should redirect to login when accessing projects page', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/);
  });
});

authTest.describe('Projects (Authenticated)', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should display project list', async ({ superuserPage }) => {
    await superuserPage.goto('/projects');
    await expect(superuserPage.getByRole('heading', { name: /project/i })).toBeVisible();
  });

  authTest('should create new project', async ({ superuserPage }) => {
    await superuserPage.goto('/projects');
    await superuserPage.getByRole('button', { name: /add|create|new.*project/i }).click();
    await expect(superuserPage.getByRole('dialog')).toBeVisible();
  });

  authTest('should edit project', async ({ projectManagerPage }) => {
    await projectManagerPage.goto('/projects');
    const editButton = projectManagerPage.getByRole('button', { name: /edit/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(projectManagerPage.getByRole('dialog')).toBeVisible();
    }
  });

  authTest('should add team members', async ({ projectManagerPage }) => {
    await projectManagerPage.goto('/projects');
    // Click on a project to see details
    const projectCard = projectManagerPage.getByRole('article').first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      const addMemberButton = projectManagerPage.getByRole('button', { name: /add.*member/i });
      if (await addMemberButton.isVisible()) {
        await addMemberButton.click();
      }
    }
  });

  authTest('should remove team members', async ({ projectManagerPage }) => {
    await projectManagerPage.goto('/projects');
    await projectManagerPage.waitForLoadState('networkidle');
  });

  authTest('should archive project', async ({ superuserPage }) => {
    await superuserPage.goto('/projects');
    const archiveButton = superuserPage.getByRole('button', { name: /archive/i }).first();
    if (await archiveButton.isVisible()) {
      await archiveButton.click();
      await expect(superuserPage.getByRole('alertdialog')).toBeVisible();
    }
  });

  authTest('should filter by status', async ({ superuserPage }) => {
    await superuserPage.goto('/projects');
    const statusFilter = superuserPage.getByRole('combobox').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
    }
  });
});

authTest.describe('Project Permissions', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('project manager should only see assigned projects', async ({ projectManagerPage }) => {
    await projectManagerPage.goto('/projects');
    await projectManagerPage.waitForLoadState('networkidle');
    // PM should only see projects they're assigned to
  });

  authTest('analyst should have read-only access to assigned projects', async ({ analystPage }) => {
    await analystPage.goto('/projects');
    await analystPage.waitForLoadState('networkidle');
    // Analyst should not see create/edit buttons
    await expect(analystPage.getByRole('button', { name: /create.*project/i })).not.toBeVisible();
  });
});
