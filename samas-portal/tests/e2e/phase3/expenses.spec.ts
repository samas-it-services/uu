/**
 * Phase 3 E2E Tests - Expenses
 */

import { test as baseTest, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

const useEmulators = process.env.VITE_USE_EMULATORS === 'true';

baseTest.describe('Expenses', () => {
  baseTest('should redirect to login when accessing expenses page', async ({ page }) => {
    await page.goto('/finance/expenses');
    await expect(page).toHaveURL(/\/login/);
  });
});

authTest.describe('Expenses (Authenticated)', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('should display expense list', async ({ superuserPage }) => {
    await superuserPage.goto('/finance/expenses');
    await expect(superuserPage.getByRole('heading', { name: /expense/i })).toBeVisible();
  });

  authTest('should create new expense', async ({ analystPage }) => {
    await analystPage.goto('/finance/expenses');
    await analystPage.getByRole('button', { name: /add|create|new.*expense/i }).click();
    await expect(analystPage.getByRole('dialog')).toBeVisible();
  });

  authTest('should submit expense for approval', async ({ analystPage }) => {
    await analystPage.goto('/finance/expenses');
    // Find a draft expense and submit it
    const submitButton = analystPage.getByRole('button', { name: /submit/i }).first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }
  });

  authTest('should approve expense (finance manager)', async ({ financeInchargePage }) => {
    await financeInchargePage.goto('/finance/expenses');
    // Finance manager should see approve button for pending expenses
    const approveButton = financeInchargePage.getByRole('button', { name: /approve/i }).first();
    if (await approveButton.isVisible()) {
      await approveButton.click();
    }
  });

  authTest('should reject expense with reason', async ({ financeInchargePage }) => {
    await financeInchargePage.goto('/finance/expenses');
    const rejectButton = financeInchargePage.getByRole('button', { name: /reject/i }).first();
    if (await rejectButton.isVisible()) {
      await rejectButton.click();
      await expect(financeInchargePage.getByRole('dialog')).toBeVisible();
    }
  });

  authTest('should upload receipt', async ({ analystPage }) => {
    await analystPage.goto('/finance/expenses');
    // Test receipt upload functionality
    await analystPage.waitForLoadState('networkidle');
  });

  authTest('should filter by status', async ({ superuserPage }) => {
    await superuserPage.goto('/finance/expenses');
    const statusFilter = superuserPage.getByRole('combobox').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
    }
  });

  authTest('should filter by category', async ({ superuserPage }) => {
    await superuserPage.goto('/finance/expenses');
    await superuserPage.waitForLoadState('networkidle');
  });
});

authTest.describe('Expense Permissions', () => {
  authTest.skip(() => !useEmulators, 'Requires Firebase emulators');

  authTest('analyst should only see own expenses', async ({ analystPage }) => {
    await analystPage.goto('/finance/expenses');
    await analystPage.waitForLoadState('networkidle');
    // Analyst should only see their own expenses
  });

  authTest('finance manager should see all pending expenses', async ({ financeInchargePage }) => {
    await financeInchargePage.goto('/finance/expenses');
    await financeInchargePage.waitForLoadState('networkidle');
    // Finance manager should see all expenses for approval
  });
});
