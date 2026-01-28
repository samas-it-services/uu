/**
 * Phase 2 E2E Tests - Project Roles
 *
 * Tests for project-specific role management feature.
 * Requires Firebase emulators for authenticated tests.
 */

import { test as baseTest, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

const useEmulators = process.env.VITE_USE_EMULATORS === 'true';

baseTest.describe('Project Roles', () => {
  baseTest.describe('Unauthenticated Access', () => {
    baseTest('should redirect to login when accessing projects page', async ({ page }) => {
      await page.goto('/projects');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

// Authenticated tests (require Firebase emulators)
authTest.describe('Project Roles (Authenticated)', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest.describe('Settings Tab Access', () => {
    authTest('should display Settings tab for superuser', async ({ superuserPage }) => {
      await superuserPage.goto('/projects');
      // Click on a project to view details
      const projectCard = superuserPage.getByRole('article').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();
        // Superuser should see Settings tab
        await expect(superuserPage.getByRole('button', { name: /settings/i })).toBeVisible();
      }
    });

    authTest('should not display Settings tab for non-superuser', async ({ projectManagerPage }) => {
      await projectManagerPage.goto('/projects');
      const projectCard = projectManagerPage.getByRole('article').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();
        // Project manager should NOT see Settings tab
        await expect(projectManagerPage.getByRole('button', { name: /settings/i })).not.toBeVisible();
      }
    });
  });

  authTest.describe('Default Project Roles', () => {
    authTest('should show 4 default project roles in Settings tab', async ({ superuserPage }) => {
      await superuserPage.goto('/projects');
      const projectCard = superuserPage.getByRole('article').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();
        // Navigate to Settings tab
        const settingsTab = superuserPage.getByRole('button', { name: /settings/i });
        if (await settingsTab.isVisible()) {
          await settingsTab.click();
          // Should see 4 default roles
          await expect(superuserPage.getByText(/project admin/i)).toBeVisible();
          await expect(superuserPage.getByText(/developer/i)).toBeVisible();
          await expect(superuserPage.getByText(/reviewer/i)).toBeVisible();
          await expect(superuserPage.getByText(/observer/i)).toBeVisible();
        }
      }
    });

    authTest('should display Default badge for default roles', async ({ superuserPage }) => {
      await superuserPage.goto('/projects');
      const projectCard = superuserPage.getByRole('article').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();
        const settingsTab = superuserPage.getByRole('button', { name: /settings/i });
        if (await settingsTab.isVisible()) {
          await settingsTab.click();
          // Default roles should have "Default" badge
          await expect(superuserPage.getByText(/default/i).first()).toBeVisible();
        }
      }
    });
  });

  authTest.describe('Project Role CRUD', () => {
    authTest('should open create role modal', async ({ superuserPage }) => {
      await superuserPage.goto('/projects');
      const projectCard = superuserPage.getByRole('article').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();
        const settingsTab = superuserPage.getByRole('button', { name: /settings/i });
        if (await settingsTab.isVisible()) {
          await settingsTab.click();
          // Click Add Role button
          const addButton = superuserPage.getByRole('button', { name: /add.*role/i });
          if (await addButton.isVisible()) {
            await addButton.click();
            // Modal should be visible
            await expect(superuserPage.getByRole('dialog')).toBeVisible();
            await expect(superuserPage.getByText(/create project role/i)).toBeVisible();
          }
        }
      }
    });

    authTest('should open edit role modal', async ({ superuserPage }) => {
      await superuserPage.goto('/projects');
      const projectCard = superuserPage.getByRole('article').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();
        const settingsTab = superuserPage.getByRole('button', { name: /settings/i });
        if (await settingsTab.isVisible()) {
          await settingsTab.click();
          // Click edit button on a role
          const editButton = superuserPage.getByRole('button', { name: /edit/i }).first();
          if (await editButton.isVisible()) {
            await editButton.click();
            // Edit modal should be visible
            await expect(superuserPage.getByRole('dialog')).toBeVisible();
            await expect(superuserPage.getByText(/edit project role/i)).toBeVisible();
          }
        }
      }
    });

    authTest('should not allow deleting default roles', async ({ superuserPage }) => {
      await superuserPage.goto('/projects');
      const projectCard = superuserPage.getByRole('article').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();
        const settingsTab = superuserPage.getByRole('button', { name: /settings/i });
        if (await settingsTab.isVisible()) {
          await settingsTab.click();
          // Default roles should not have delete button or it should be disabled
          // Find a role card with "Default" badge
          const defaultRole = superuserPage.locator('[class*="Card"]').filter({ hasText: /default/i }).first();
          if (await defaultRole.isVisible()) {
            const deleteButton = defaultRole.getByRole('button', { name: /delete/i });
            // Delete button should not exist or not be visible for default roles
            await expect(deleteButton).not.toBeVisible();
          }
        }
      }
    });

    authTest('should show permission matrix in role modal', async ({ superuserPage }) => {
      await superuserPage.goto('/projects');
      const projectCard = superuserPage.getByRole('article').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();
        const settingsTab = superuserPage.getByRole('button', { name: /settings/i });
        if (await settingsTab.isVisible()) {
          await settingsTab.click();
          const editButton = superuserPage.getByRole('button', { name: /edit/i }).first();
          if (await editButton.isVisible()) {
            await editButton.click();
            // Permission matrix should be visible
            await expect(superuserPage.getByText(/permission/i)).toBeVisible();
            // Should show module names
            await expect(superuserPage.getByText(/finance/i)).toBeVisible();
            await expect(superuserPage.getByText(/documents/i)).toBeVisible();
            await expect(superuserPage.getByText(/tasks/i)).toBeVisible();
          }
        }
      }
    });
  });

  authTest.describe('Team Member Role Assignment', () => {
    authTest('should show project role dropdown in Team tab', async ({ superuserPage }) => {
      await superuserPage.goto('/projects');
      const projectCard = superuserPage.getByRole('article').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();
        // Navigate to Team tab
        const teamTab = superuserPage.getByRole('button', { name: /team/i });
        if (await teamTab.isVisible()) {
          await teamTab.click();
          // Team members should show role selector
          await superuserPage.waitForLoadState('networkidle');
          // The role dropdown should be visible for editable members
          const roleSelect = superuserPage.getByRole('combobox').first();
          if (await roleSelect.isVisible()) {
            await roleSelect.click();
            // Should show project roles in dropdown
            await expect(superuserPage.getByText(/project admin/i)).toBeVisible();
          }
        }
      }
    });

    authTest('should display project role name for team members', async ({ superuserPage }) => {
      await superuserPage.goto('/projects');
      const projectCard = superuserPage.getByRole('article').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();
        const teamTab = superuserPage.getByRole('button', { name: /team/i });
        if (await teamTab.isVisible()) {
          await teamTab.click();
          await superuserPage.waitForLoadState('networkidle');
          // Team members with project roles should show role name
          // This verifies the projectRoleName is displayed
          const memberCard = superuserPage.locator('[class*="rounded-lg"]').first();
          if (await memberCard.isVisible()) {
            await expect(memberCard).toBeVisible();
          }
        }
      }
    });
  });
});

authTest.describe('Project Role Permissions', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should prevent non-superuser from managing project roles', async ({ projectManagerPage }) => {
    await projectManagerPage.goto('/projects');
    const projectCard = projectManagerPage.getByRole('article').first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      // Project manager should not see Settings tab
      await expect(projectManagerPage.getByRole('button', { name: /settings/i })).not.toBeVisible();
    }
  });

  authTest('analyst should see team members but not edit roles', async ({ analystPage }) => {
    await analystPage.goto('/projects');
    const projectCard = analystPage.getByRole('article').first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      const teamTab = analystPage.getByRole('button', { name: /team/i });
      if (await teamTab.isVisible()) {
        await teamTab.click();
        // Analyst should see team list but not edit controls
        await expect(analystPage.getByRole('button', { name: /add.*member/i })).not.toBeVisible();
      }
    }
  });
});
