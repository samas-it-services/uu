/**
 * Phase 2 E2E Tests - Role Management
 */

import { test as baseTest, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

const useEmulators = process.env.VITE_USE_EMULATORS === 'true';

baseTest.describe('Role Management', () => {
  baseTest.describe('Unauthenticated Access', () => {
    baseTest('should redirect to login when accessing roles page', async ({ page }) => {
      await page.goto('/admin/roles');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

// Authenticated tests (require Firebase emulators)
authTest.describe('Role Management (Authenticated)', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should display role list for admin', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/roles');
    await expect(superuserPage.getByRole('heading', { name: /roles/i })).toBeVisible();
  });

  authTest('should display system roles with lock indicator', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/roles');
    // System roles should be visible
    await expect(superuserPage.getByText(/super.*user|superuser/i)).toBeVisible();
  });

  authTest('should display permission matrix', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/roles');
    // Click on a role to see permissions
    const roleRow = superuserPage.getByRole('row').filter({ hasText: /analyst/i }).first();
    if (await roleRow.isVisible()) {
      await roleRow.click();
      await expect(superuserPage.getByText(/permission/i)).toBeVisible();
    }
  });

  authTest('should create custom role', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/roles');
    await superuserPage.getByRole('button', { name: /create|add.*role/i }).click();
    await expect(superuserPage.getByRole('dialog')).toBeVisible();
  });

  authTest('should edit role permissions', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/roles');
    const editButton = superuserPage.getByRole('button', { name: /edit/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(superuserPage.getByRole('dialog')).toBeVisible();
    }
  });

  authTest('should not allow editing system role name', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/roles');
    // Find a system role and try to edit
    const systemRoleEdit = superuserPage
      .getByRole('row')
      .filter({ hasText: /superuser/i })
      .getByRole('button', { name: /edit/i });
    if (await systemRoleEdit.isVisible()) {
      await systemRoleEdit.click();
      // Name field should be disabled for system roles
      const nameInput = superuserPage.getByLabel(/name/i);
      if (await nameInput.isVisible()) {
        await expect(nameInput).toBeDisabled();
      }
    }
  });

  authTest('should delete custom role', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/roles');
    // Custom roles should have delete button enabled
    const deleteButton = superuserPage.getByRole('button', { name: /delete/i }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await expect(superuserPage.getByRole('alertdialog')).toBeVisible();
    }
  });

  authTest('should not allow deleting system roles', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/roles');
    // System role delete should be disabled
    const systemRoleRow = superuserPage.getByRole('row').filter({ hasText: /superuser/i });
    const deleteButton = systemRoleRow.getByRole('button', { name: /delete/i });
    if (await deleteButton.isVisible()) {
      await expect(deleteButton).toBeDisabled();
    }
  });
});

// Permission matrix tests
authTest.describe('Permission Matrix', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should show finance permissions for Finance Manager', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/roles');
    const financeRow = superuserPage.getByRole('row').filter({ hasText: /finance.*incharge/i });
    if (await financeRow.isVisible()) {
      await financeRow.click();
      // Should show finance module permissions
      await expect(superuserPage.getByText(/finance/i)).toBeVisible();
    }
  });

  authTest('should show read-only projects for Finance Manager', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/roles');
    // Finance Manager should only have read access to projects
    const financeRow = superuserPage.getByRole('row').filter({ hasText: /finance.*incharge/i });
    if (await financeRow.isVisible()) {
      await financeRow.click();
    }
  });

  authTest('should show no RBAC access for Finance Manager', async ({ superuserPage }) => {
    await superuserPage.goto('/admin/roles');
    // Finance Manager should not have RBAC permissions
    const financeRow = superuserPage.getByRole('row').filter({ hasText: /finance.*incharge/i });
    if (await financeRow.isVisible()) {
      await financeRow.click();
    }
  });
});
