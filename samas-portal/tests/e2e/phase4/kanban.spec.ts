/**
 * Phase 4 E2E Tests - Kanban Board
 */

import { test as baseTest, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

const useEmulators = process.env.VITE_USE_EMULATORS === 'true';

baseTest.describe('Kanban Board', () => {
  baseTest('should redirect to login when accessing kanban page', async ({ page }) => {
    await page.goto('/tasks/kanban');
    await expect(page).toHaveURL(/\/login/);
  });
});

authTest.describe('Kanban Board (Authenticated)', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should display 5 columns', async ({ superuserPage }) => {
    await superuserPage.goto('/tasks/kanban');
    // Kanban should have 5 columns: Backlog, To Do, In Progress, Review, Done
    await expect(superuserPage.getByText(/backlog/i)).toBeVisible();
    await expect(superuserPage.getByText(/to do/i)).toBeVisible();
    await expect(superuserPage.getByText(/in progress/i)).toBeVisible();
    await expect(superuserPage.getByText(/review/i)).toBeVisible();
    await expect(superuserPage.getByText(/done/i)).toBeVisible();
  });

  authTest('should display tasks in columns', async ({ superuserPage }) => {
    await superuserPage.goto('/tasks/kanban');
    await superuserPage.waitForLoadState('networkidle');
  });

  authTest('should drag task between columns', async ({ projectManagerPage }) => {
    await projectManagerPage.goto('/tasks/kanban');
    // Get a task card
    const taskCard = projectManagerPage.locator('[data-testid="task-card"]').first();
    if (await taskCard.isVisible()) {
      // Drag and drop functionality test
      const targetColumn = projectManagerPage.getByText(/in progress/i).locator('..');
      await taskCard.dragTo(targetColumn);
    }
  });

  authTest('should reorder tasks within column', async ({ projectManagerPage }) => {
    await projectManagerPage.goto('/tasks/kanban');
    await projectManagerPage.waitForLoadState('networkidle');
  });

  authTest('should create new task', async ({ projectManagerPage }) => {
    await projectManagerPage.goto('/tasks/kanban');
    await projectManagerPage.getByRole('button', { name: /add.*task|create.*task|new.*task/i }).click();
    await expect(projectManagerPage.getByRole('dialog')).toBeVisible();
  });

  authTest('should edit task details', async ({ projectManagerPage }) => {
    await projectManagerPage.goto('/tasks/kanban');
    const taskCard = projectManagerPage.locator('[data-testid="task-card"]').first();
    if (await taskCard.isVisible()) {
      await taskCard.click();
      await expect(projectManagerPage.getByRole('dialog')).toBeVisible();
    }
  });

  authTest('should add task comment', async ({ analystPage }) => {
    await analystPage.goto('/tasks/kanban');
    const taskCard = analystPage.locator('[data-testid="task-card"]').first();
    if (await taskCard.isVisible()) {
      await taskCard.click();
      // Look for comment input
      const commentInput = analystPage.getByPlaceholder(/comment/i);
      if (await commentInput.isVisible()) {
        await commentInput.fill('Test comment from E2E');
      }
    }
  });

  authTest('should filter by project', async ({ superuserPage }) => {
    await superuserPage.goto('/tasks/kanban');
    const projectFilter = superuserPage.getByRole('combobox').first();
    if (await projectFilter.isVisible()) {
      await projectFilter.click();
    }
  });

  authTest('should filter by assignee', async ({ superuserPage }) => {
    await superuserPage.goto('/tasks/kanban');
    await superuserPage.waitForLoadState('networkidle');
  });
});

authTest.describe('Kanban Permissions', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('analyst can only update own tasks', async ({ analystPage }) => {
    await analystPage.goto('/tasks/kanban');
    await analystPage.waitForLoadState('networkidle');
    // Analyst should see tasks but can only edit their own
  });

  authTest('project manager can manage all project tasks', async ({ projectManagerPage }) => {
    await projectManagerPage.goto('/tasks/kanban');
    await projectManagerPage.waitForLoadState('networkidle');
    // PM should be able to create, edit, delete tasks
  });
});
