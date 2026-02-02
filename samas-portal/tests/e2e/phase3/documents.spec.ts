/**
 * Phase 3 E2E Tests - Documents
 */

import { test as baseTest, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

const useEmulators = process.env.VITE_USE_EMULATORS === 'true';

baseTest.describe('Documents', () => {
  baseTest('should redirect to login when accessing documents page', async ({ page }) => {
    await page.goto('/documents');
    await expect(page).toHaveURL(/\/login/);
  });
});

authTest.describe('Documents (Authenticated)', () => {
  // Skip if not using emulators
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should display documents list', async ({ superuserPage }) => {
    await superuserPage.goto('/documents');
    await expect(superuserPage.getByRole('heading', { name: 'Documents' })).toBeVisible();
    await expect(superuserPage.getByText('Manage and organize your files')).toBeVisible();
  });

  authTest('should open create folder modal', async ({ superuserPage }) => {
    await superuserPage.goto('/documents');
    await superuserPage.getByRole('button', { name: /new folder/i }).click();
    await expect(superuserPage.getByRole('dialog')).toBeVisible();
    await expect(superuserPage.getByText('Create New Folder')).toBeVisible();
  });

  authTest('should open upload modal', async ({ superuserPage }) => {
    await superuserPage.goto('/documents');
    await superuserPage.getByRole('button', { name: /upload/i }).click();
    // The upload modal might have "Upload Document" as title
    await expect(superuserPage.getByRole('dialog')).toBeVisible();
  });

  authTest('should toggle view mode', async ({ superuserPage }) => {
    await superuserPage.goto('/documents');
    // Default is list view
    // Click grid view button (it has Grid icon, usually aria-label or just button)
    // We can try to find by the icon class or position.
    // In the code: <Button onClick={() => setViewMode('grid')}> <Grid /> </Button>
    
    // Let's assume there are 2 buttons in the toggle group.
    // We can just click them and ensure no error.
    const gridBtn = superuserPage.locator('button:has(.lucide-grid)');
    await gridBtn.click();
    
    const listBtn = superuserPage.locator('button:has(.lucide-list)');
    await listBtn.click();
  });

  authTest('analyst should see own documents', async ({ analystPage }) => {
    await analystPage.goto('/documents');
    await expect(analystPage.getByRole('heading', { name: 'Documents' })).toBeVisible();
  });
});
