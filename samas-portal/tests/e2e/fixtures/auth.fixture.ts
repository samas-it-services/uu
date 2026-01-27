/**
 * Playwright Auth Fixtures
 *
 * Provides pre-authenticated page objects for different user roles.
 * Authentication is handled via Firebase Auth emulator REST API.
 */

import { test as base, Page, BrowserContext } from '@playwright/test';
import { TEST_USERS, TestUserRole } from '../helpers/auth';

// Check if running with emulators
const useEmulators = process.env.VITE_USE_EMULATORS === 'true';

/**
 * Sign in a user via Firebase Auth emulator REST API and set up browser state
 */
async function signInUser(page: Page, role: TestUserRole): Promise<void> {
  if (!useEmulators) {
    return;
  }

  const userData = TEST_USERS[role];

  // Sign in via Firebase Auth emulator REST API
  const signInResponse = await fetch(
    'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        returnSecureToken: true,
      }),
    }
  );

  if (!signInResponse.ok) {
    const error = await signInResponse.text();
    throw new Error(`Failed to sign in ${role}: ${error}`);
  }

  const authData = await signInResponse.json();

  // Inject auth state into the browser
  await page.addInitScript((data) => {
    // Firebase Auth stores state in IndexedDB, but we can also use localStorage
    const authKey = `firebase:authUser:${data.apiKey}:[DEFAULT]`;
    localStorage.setItem(authKey, JSON.stringify({
      uid: data.localId,
      email: data.email,
      displayName: data.displayName,
      emailVerified: true,
      stsTokenManager: {
        refreshToken: data.refreshToken,
        accessToken: data.idToken,
        expirationTime: Date.now() + 3600000,
      },
      createdAt: Date.now().toString(),
      lastLoginAt: Date.now().toString(),
    }));
  }, {
    apiKey: 'test-api-key',
    localId: authData.localId,
    email: authData.email,
    displayName: userData.displayName,
    refreshToken: authData.refreshToken,
    idToken: authData.idToken,
  });

  // Navigate to trigger Firebase auth initialization
  await page.goto('/');

  // Wait for auth state to be set in localStorage
  await page.waitForFunction(
    (apiKey) => {
      const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
      return localStorage.getItem(key) !== null;
    },
    'test-api-key',
    { timeout: 10000 }
  );
}

// Extend the base test with authenticated page fixtures
export const test = base.extend<{
  superuserPage: Page;
  analystPage: Page;
  projectManagerPage: Page;
  financeInchargePage: Page;
  qaManagerPage: Page;
  superuserContext: BrowserContext;
  analystContext: BrowserContext;
  projectManagerContext: BrowserContext;
  financeInchargeContext: BrowserContext;
  qaManagerContext: BrowserContext;
}>({
  // Superuser (admin) page
  superuserContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  superuserPage: async ({ superuserContext }, use) => {
    const page = await superuserContext.newPage();
    await signInUser(page, 'superuser');
    await use(page);
  },

  // Analyst page
  analystContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  analystPage: async ({ analystContext }, use) => {
    const page = await analystContext.newPage();
    await signInUser(page, 'analyst');
    await use(page);
  },

  // Project Manager page
  projectManagerContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  projectManagerPage: async ({ projectManagerContext }, use) => {
    const page = await projectManagerContext.newPage();
    await signInUser(page, 'projectManager');
    await use(page);
  },

  // Finance In-charge page
  financeInchargeContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  financeInchargePage: async ({ financeInchargeContext }, use) => {
    const page = await financeInchargeContext.newPage();
    await signInUser(page, 'financeIncharge');
    await use(page);
  },

  // QA Manager page
  qaManagerContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  qaManagerPage: async ({ qaManagerContext }, use) => {
    const page = await qaManagerContext.newPage();
    await signInUser(page, 'qaManager');
    await use(page);
  },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';
