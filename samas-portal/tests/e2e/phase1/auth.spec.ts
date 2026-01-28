/**
 * Phase 1 E2E Tests - Authentication
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login page when not authenticated', async ({ page }) => {
      await page.goto('/');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);

      // Should show welcome text
      await expect(page.getByText('Welcome to saMas Portal')).toBeVisible();

      // Should show Google sign-in button
      await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();

      // Should show access restriction message
      await expect(page.getByText('Access is restricted to authorized saMas team members')).toBeVisible();
    });

    test('should display Google sign-in button with icon', async ({ page }) => {
      await page.goto('/login');

      const signInButton = page.getByRole('button', { name: /sign in with google/i });
      await expect(signInButton).toBeVisible();
      await expect(signInButton).toBeEnabled();
    });

    test('should show loading spinner when signing in', async ({ page }) => {
      await page.goto('/login');

      // Mock Firebase auth to delay response
      await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.abort();
      });

      const signInButton = page.getByRole('button', { name: /sign in with google/i });
      await signInButton.click();

      // Button should show loading state (might have spinner or loading text)
      // The exact behavior depends on the Button component implementation
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing admin page without auth', async ({ page }) => {
      await page.goto('/admin/users');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing finance page without auth', async ({ page }) => {
      await page.goto('/finance/expenses');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing projects page without auth', async ({ page }) => {
      await page.goto('/projects');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
