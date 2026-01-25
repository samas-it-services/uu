#!/bin/bash

# =============================================================================
# SaMas IT Services Portal - Complete Project Setup Script
# =============================================================================
# This script creates the entire project structure with all documentation,
# configurations, and boilerplate code for the SaMas Portal.
#
# Usage:
#   chmod +x setup-samas-portal.sh
#   ./setup-samas-portal.sh
#
# After running:
#   cd samas-portal
#   npm install
#   firebase login
#   cp .env.example .env.local (then edit with your Firebase config)
#   npm run dev
# =============================================================================

set -e

echo "🚀 Creating SaMas IT Services Portal..."
echo "============================================"

# Create project directory
PROJECT_DIR="samas-portal"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# =============================================================================
# DIRECTORY STRUCTURE
# =============================================================================

echo "📁 Creating directory structure..."

mkdir -p .claude
mkdir -p .github/workflows
mkdir -p docs/agents
mkdir -p functions/src
mkdir -p public/icons
mkdir -p src/{components/{ui,layout,auth,modules/{finance,documents,projects,tasks,assets,announcements,admin,presence}},contexts,hooks,pages/{auth,finance,documents,projects,tasks,assets,announcements,admin},services/{api,firebase,google},styles,types,utils}
mkdir -p tests/{unit,integration,e2e}
mkdir -p src/test-utils/{mocks,factories}

# =============================================================================
# ROOT CONFIG FILES
# =============================================================================

echo "📝 Creating configuration files..."

# package.json
cat > package.json << 'PACKAGE_JSON'
{
  "name": "samas-portal",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "firebase:emulators": "firebase emulators:start",
    "firebase:deploy": "firebase deploy",
    "firebase:deploy:rules": "firebase deploy --only firestore:rules,storage:rules",
    "firebase:deploy:functions": "firebase deploy --only functions"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^3.3.4",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@tanstack/react-query": "^5.17.19",
    "@tiptap/react": "^2.2.1",
    "@tiptap/starter-kit": "^2.2.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.3.1",
    "firebase": "^10.8.0",
    "jspdf": "^2.5.1",
    "lucide-react": "^0.321.0",
    "qrcode": "^1.5.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.50.0",
    "react-router-dom": "^6.22.0",
    "recharts": "^2.12.0",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "xlsx": "^0.18.5",
    "zod": "^3.22.4",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.41.2",
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^14.2.1",
    "@types/node": "^20.11.16",
    "@types/qrcode": "^1.5.5",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "@vitejs/plugin-react": "^4.2.1",
    "@vitest/coverage-v8": "^1.2.2",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "jsdom": "^24.0.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.0",
    "vite-plugin-pwa": "^0.17.5",
    "vitest": "^1.2.2"
  }
}
PACKAGE_JSON

# tsconfig.json
cat > tsconfig.json << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
TSCONFIG

# tsconfig.node.json
cat > tsconfig.node.json << 'TSCONFIG_NODE'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
TSCONFIG_NODE

# vite.config.ts
cat > vite.config.ts << 'VITE_CONFIG'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'SaMas IT Services Portal',
        short_name: 'SaMas Portal',
        description: 'Company portal for SaMas IT Services',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: { cacheName: 'firestore-cache', expiration: { maxEntries: 100, maxAgeSeconds: 3600 } }
          },
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'storage-cache', expiration: { maxEntries: 200, maxAgeSeconds: 604800 } }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
VITE_CONFIG

# tailwind.config.js
cat > tailwind.config.js << 'TAILWIND_CONFIG'
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
        },
        secondary: {
          50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
          400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
          800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
TAILWIND_CONFIG

# postcss.config.js
cat > postcss.config.js << 'POSTCSS'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
POSTCSS

# vitest.config.ts
cat > vitest.config.ts << 'VITEST_CONFIG'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test-utils/', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
VITEST_CONFIG

# playwright.config.ts
cat > playwright.config.ts << 'PLAYWRIGHT_CONFIG'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
PLAYWRIGHT_CONFIG

# .env.example
cat > .env.example << 'ENV_EXAMPLE'
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Firebase Cloud Messaging (for push notifications)
VITE_FIREBASE_VAPID_KEY=your-vapid-key

# Google APIs (for Drive, Calendar, Meet integration)
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# App Configuration
VITE_APP_URL=http://localhost:5173
ENV_EXAMPLE

# .gitignore
cat > .gitignore << 'GITIGNORE'
# Dependencies
node_modules
.pnp
.pnp.js

# Build
dist
dist-ssr
*.local
build

# Env files
.env
.env.local
.env.*.local

# IDE
.vscode/*
!.vscode/extensions.json
.idea
*.swp
*.swo

# Testing
coverage
playwright-report
test-results

# Firebase
.firebase
firebase-debug.log
firestore-debug.log
ui-debug.log

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
*.tsbuildinfo
GITIGNORE

# .eslintrc.cjs
cat > .eslintrc.cjs << 'ESLINT'
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
ESLINT

# .prettierrc
cat > .prettierrc << 'PRETTIER'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
PRETTIER

# index.html
cat > index.html << 'INDEX_HTML'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="SaMas IT Services Portal - Company portal for managing projects, tasks, expenses, and more" />
    <meta name="theme-color" content="#2563eb" />
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>SaMas Portal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
INDEX_HTML

# =============================================================================
# FIREBASE CONFIGURATION
# =============================================================================

echo "🔥 Creating Firebase configuration..."

# firebase.json
cat > firebase.json << 'FIREBASE_JSON'
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      }
    ]
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true },
    "singleProjectMode": true
  }
}
FIREBASE_JSON

# .firebaserc
cat > .firebaserc << 'FIREBASERC'
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
FIREBASERC

# firestore.rules (comprehensive security rules)
cat > firestore.rules << 'FIRESTORE_RULES'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========== Helper Functions ==========
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && getUserData().roles.hasAny(['super_admin']);
    }
    
    function isFinanceManager() {
      return isAuthenticated() && getUserData().roles.hasAny(['finance_manager', 'super_admin']);
    }
    
    function isProjectManager() {
      return isAuthenticated() && getUserData().roles.hasAny(['project_manager', 'super_admin']);
    }
    
    function canAccessProject(projectId) {
      let userData = getUserData();
      return isSuperAdmin() ||
             userData.roles.hasAny(['finance_manager']) ||
             userData.managedProjects.hasAny([projectId]) ||
             userData.memberProjects.hasAny([projectId]);
    }
    
    function isProjectMember(projectId) {
      let userData = getUserData();
      return userData.managedProjects.hasAny([projectId]) ||
             userData.memberProjects.hasAny([projectId]);
    }
    
    function isProjectOwner(projectId) {
      let userData = getUserData();
      return isSuperAdmin() || userData.managedProjects.hasAny([projectId]);
    }
    
    // ========== Users Collection ==========
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isSuperAdmin() || 
                       (request.auth.uid == userId && 
                        !request.resource.data.diff(resource.data).affectedKeys()
                          .hasAny(['roles', 'managedProjects', 'memberProjects']));
      allow delete: if isSuperAdmin();
    }
    
    // ========== Roles Collection ==========
    match /roles/{roleId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }
    
    // ========== Projects Collection ==========
    match /projects/{projectId} {
      allow read: if canAccessProject(projectId);
      allow create: if isProjectManager();
      allow update: if isProjectOwner(projectId);
      allow delete: if isSuperAdmin();
      
      // SENSITIVE DATA - RESTRICTED (Project managers CANNOT access)
      match /sensitiveData/{docId} {
        allow read: if isSuperAdmin() || isFinanceManager();
        allow write: if isSuperAdmin() || isFinanceManager();
      }
      
      // Project assets subcollection
      match /assets/{assetId} {
        allow read: if canAccessProject(projectId);
        allow write: if isProjectOwner(projectId);
      }
      
      // Project activities subcollection
      match /activities/{activityId} {
        allow read: if canAccessProject(projectId);
        allow create: if isProjectMember(projectId);
        allow update, delete: if false;
      }
    }
    
    // ========== Tasks Collection ==========
    match /tasks/{taskId} {
      allow read: if isAuthenticated() && 
                    (isSuperAdmin() || canAccessProject(resource.data.projectId));
      allow create: if isAuthenticated() && 
                       canAccessProject(request.resource.data.projectId) &&
                       isProjectOwner(request.resource.data.projectId);
      allow update: if isAuthenticated() && 
                       canAccessProject(resource.data.projectId) &&
                       (isProjectOwner(resource.data.projectId) ||
                        resource.data.assignedTo.hasAny([request.auth.uid]));
      allow delete: if isProjectOwner(resource.data.projectId);
      
      match /comments/{commentId} {
        allow read: if canAccessProject(get(/databases/$(database)/documents/tasks/$(taskId)).data.projectId);
        allow create: if canAccessProject(get(/databases/$(database)/documents/tasks/$(taskId)).data.projectId);
        allow update: if request.auth.uid == resource.data.userId;
        allow delete: if isSuperAdmin() || request.auth.uid == resource.data.userId;
      }
    }
    
    // ========== Expenses Collection ==========
    match /expenses/{expenseId} {
      allow read: if isAuthenticated() && 
                    (isFinanceManager() || 
                     resource.data.userId == request.auth.uid ||
                     (resource.data.projectId != null && isProjectOwner(resource.data.projectId)));
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && 
                       (isFinanceManager() ||
                        (resource.data.userId == request.auth.uid && 
                         resource.data.status in ['draft', 'needs_info']));
      allow delete: if isFinanceManager();
    }
    
    // ========== Documents Collection ==========
    match /documents/{documentId} {
      allow read: if isAuthenticated() && 
                    (isSuperAdmin() ||
                     resource.data.accessLevel == 'company' ||
                     (resource.data.projectId != null && canAccessProject(resource.data.projectId)) ||
                     resource.data.accessList.hasAny([request.auth.uid])) &&
                    (!resource.data.isSensitive || isSuperAdmin() || isFinanceManager());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                       (isSuperAdmin() ||
                        resource.data.uploadedBy == request.auth.uid ||
                        (resource.data.projectId != null && isProjectOwner(resource.data.projectId)));
      allow delete: if isSuperAdmin() || resource.data.uploadedBy == request.auth.uid;
    }
    
    // ========== Assets Collection ==========
    match /assets/{assetId} {
      allow read: if isAuthenticated() &&
                    (isSuperAdmin() || isFinanceManager() ||
                     (resource.data.assignedToProject != null && 
                      canAccessProject(resource.data.assignedToProject)) ||
                     resource.data.assignedTo == request.auth.uid);
      allow create: if isSuperAdmin();
      allow update: if isSuperAdmin() || 
                       (isProjectManager() && 
                        resource.data.assignedToProject != null &&
                        isProjectOwner(resource.data.assignedToProject));
      allow delete: if isSuperAdmin();
    }
    
    // ========== Announcements Collection ==========
    match /announcements/{announcementId} {
      allow read: if isAuthenticated() && 
                    (resource.data.targetType == 'all' ||
                     resource.data.targetRoles.hasAny(getUserData().roles) ||
                     resource.data.targetUsers.hasAny([request.auth.uid]) ||
                     resource.data.targetProjects.hasAny(getUserData().managedProjects) ||
                     resource.data.targetProjects.hasAny(getUserData().memberProjects));
      allow create: if isSuperAdmin() || isProjectManager();
      allow update: if isSuperAdmin() || 
                       resource.data.createdBy == request.auth.uid ||
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readBy', 'readCount']);
      allow delete: if isSuperAdmin();
    }
    
    // ========== Presence Collection ==========
    match /presence/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // ========== Audit Logs Collection ==========
    match /auditLogs/{logId} {
      allow read: if isSuperAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false;
    }
  }
}
FIRESTORE_RULES

# storage.rules
cat > storage.rules << 'STORAGE_RULES'
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isValidFile() {
      return request.resource.size < 50 * 1024 * 1024; // 50MB max
    }
    
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isPDF() {
      return request.resource.contentType == 'application/pdf';
    }
    
    // Receipts - users can upload their own
    match /receipts/{userId}/{expenseId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isOwner(userId) && isValidFile() && (isImage() || isPDF());
    }
    
    // Documents - project-scoped and company-wide
    match /documents/{category}/{documentId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isValidFile();
    }
    
    // Project attachments
    match /projects/{projectId}/attachments/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isValidFile();
    }
    
    // Asset images and QR codes
    match /assets/{assetId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isValidFile();
    }
    
    // Announcement images
    match /announcements/{announcementId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isValidFile() && isImage();
    }
    
    // User avatars
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId) && isImage() && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
STORAGE_RULES

# firestore.indexes.json
cat > firestore.indexes.json << 'FIRESTORE_INDEXES'
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "statusOrder", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedTo", "arrayConfig": "CONTAINS" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "folderId", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "announcements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isPinned", "order": "DESCENDING" },
        { "fieldPath": "publishedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "auditLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "module", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "presence",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "heartbeat", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
FIRESTORE_INDEXES

# =============================================================================
# CLOUD FUNCTIONS
# =============================================================================

echo "⚡ Creating Cloud Functions..."

# functions/package.json
cat > functions/package.json << 'FUNCTIONS_PACKAGE'
{
  "name": "samas-portal-functions",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": { "node": "18" },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^11.11.1",
    "firebase-functions": "^4.6.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  },
  "private": true
}
FUNCTIONS_PACKAGE

# functions/tsconfig.json
cat > functions/tsconfig.json << 'FUNCTIONS_TSCONFIG'
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017"
  },
  "compileOnSave": true,
  "include": ["src"]
}
FUNCTIONS_TSCONFIG

# functions/src/index.ts
cat > functions/src/index.ts << 'FUNCTIONS_INDEX'
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Super admin emails - auto-assigned on first login
const SUPER_ADMINS = ['bill@samas.tech', 'bilgrami@gmail.com'];

// Default users with specific roles
const DEFAULT_USERS: Record<string, string[]> = {
  'saminas.samas@gmail.com': ['finance_manager'],
  'shahneela.samas@gmail.com': ['project_manager'],
};

/**
 * Trigger: When a new user signs up via Firebase Auth
 * Creates user document with appropriate roles
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const email = user.email || '';
  const isSuperAdmin = SUPER_ADMINS.includes(email);
  const predefinedRoles = DEFAULT_USERS[email];
  
  let roles: string[];
  if (isSuperAdmin) {
    roles = ['super_admin'];
  } else if (predefinedRoles) {
    roles = predefinedRoles;
  } else {
    roles = ['employee'];
  }
  
  const userData = {
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    roles,
    managedProjects: [],
    memberProjects: [],
    isActive: true,
    status: 'offline',
    statusMessage: '',
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    preferences: {
      theme: 'system',
      notifications: { email: true, push: true, desktop: true },
      emailDigest: 'daily',
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLogin: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  await db.collection('users').doc(user.uid).set(userData);
  
  functions.logger.info(`User created: ${email} with roles: ${roles.join(', ')}`);
});

/**
 * HTTP Function: Seed default roles
 * Call once after initial deployment
 */
export const seedRoles = functions.https.onRequest(async (req, res) => {
  const roles = [
    {
      id: 'super_admin',
      name: 'Super Admin',
      description: 'Full system access',
      isSystem: true,
      permissions: {
        finance: { create: true, read: true, update: true, delete: true },
        documents: { create: true, read: true, update: true, delete: true },
        projects: { create: true, read: true, update: true, delete: true },
        assets: { create: true, read: true, update: true, delete: true },
        tasks: { create: true, read: true, update: true, delete: true },
        announcements: { create: true, read: true, update: true, delete: true },
        rbac: { create: true, read: true, update: true, delete: true },
      },
      dataAccess: { allProjects: true, sensitiveFinancials: true, globalAssets: true },
    },
    {
      id: 'finance_manager',
      name: 'Finance Manager',
      description: 'Manage finances and view sensitive data',
      isSystem: true,
      permissions: {
        finance: { create: true, read: true, update: true, delete: true },
        documents: { create: true, read: true, update: false, delete: false },
        projects: { create: false, read: true, update: false, delete: false },
        assets: { create: false, read: true, update: false, delete: false },
        tasks: { create: false, read: true, update: false, delete: false },
        announcements: { create: true, read: true, update: true, delete: false },
        rbac: { create: false, read: false, update: false, delete: false },
      },
      dataAccess: { allProjects: true, sensitiveFinancials: true, globalAssets: true },
    },
    {
      id: 'project_manager',
      name: 'Project Manager',
      description: 'Manage assigned projects and teams',
      isSystem: true,
      permissions: {
        finance: { create: true, read: true, update: false, delete: false },
        documents: { create: true, read: true, update: true, delete: true },
        projects: { create: true, read: true, update: true, delete: false },
        assets: { create: true, read: true, update: true, delete: false },
        tasks: { create: true, read: true, update: true, delete: true },
        announcements: { create: true, read: true, update: true, delete: false },
        rbac: { create: false, read: false, update: false, delete: false },
      },
      dataAccess: { allProjects: false, sensitiveFinancials: false, globalAssets: false },
    },
    {
      id: 'employee',
      name: 'Employee',
      description: 'Standard employee access',
      isSystem: true,
      permissions: {
        finance: { create: true, read: true, update: true, delete: false },
        documents: { create: true, read: true, update: false, delete: false },
        projects: { create: false, read: true, update: false, delete: false },
        assets: { create: false, read: true, update: false, delete: false },
        tasks: { create: false, read: true, update: true, delete: false },
        announcements: { create: false, read: true, update: false, delete: false },
        rbac: { create: false, read: false, update: false, delete: false },
      },
      dataAccess: { allProjects: false, sensitiveFinancials: false, globalAssets: false },
    },
    {
      id: 'external',
      name: 'External Viewer',
      description: 'Read-only access to shared projects',
      isSystem: true,
      permissions: {
        finance: { create: false, read: false, update: false, delete: false },
        documents: { create: false, read: true, update: false, delete: false },
        projects: { create: false, read: true, update: false, delete: false },
        assets: { create: false, read: false, update: false, delete: false },
        tasks: { create: false, read: true, update: false, delete: false },
        announcements: { create: false, read: true, update: false, delete: false },
        rbac: { create: false, read: false, update: false, delete: false },
      },
      dataAccess: { allProjects: false, sensitiveFinancials: false, globalAssets: false },
    },
  ];
  
  const batch = db.batch();
  
  for (const role of roles) {
    const ref = db.collection('roles').doc(role.id);
    batch.set(ref, {
      ...role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  
  await batch.commit();
  
  res.json({ success: true, message: `Seeded ${roles.length} roles` });
});

/**
 * Trigger: Create audit log on user changes
 */
export const onUserUpdated = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Log role changes
    if (JSON.stringify(before.roles) !== JSON.stringify(after.roles)) {
      await db.collection('auditLogs').add({
        userId: context.params.userId,
        userEmail: after.email,
        action: 'user.roles_changed',
        module: 'rbac',
        resourceType: 'user',
        resourceId: context.params.userId,
        before: { roles: before.roles },
        after: { roles: after.roles },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
FUNCTIONS_INDEX

# =============================================================================
# GITHUB ACTIONS
# =============================================================================

echo "🔄 Creating CI/CD pipeline..."

cat > .github/workflows/ci.yml << 'CI_WORKFLOW'
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: false

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist

  deploy-preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: '${{ secrets.FIREBASE_PROJECT_ID }}'

  deploy-production:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: '${{ secrets.FIREBASE_PROJECT_ID }}'
          channelId: live
CI_WORKFLOW

# =============================================================================
# CLAUDE CODE INSTRUCTIONS
# =============================================================================

echo "🤖 Creating Claude Code instructions..."

cat > .claude/claude.md << 'CLAUDE_MD'
# Claude Code Instructions - SaMas Portal

## Critical Rules

1. **Never mention AI names** (Claude, ChatGPT, etc.) in any generated content
2. **Always read PRD.md and TDD.md** before implementing any feature
3. **Update CHANGELOG.md** after completing any feature
4. **Run tests** before committing: `npm test`
5. **Follow the security model** - project managers cannot access sensitive data

## Project Overview

SaMas IT Services Portal - A comprehensive company portal with:
- Role-based access control (RBAC)
- Project-scoped security (PMs only see their projects)
- Sensitive data protection (only admin/finance see financials)
- Trello-style Kanban board
- Google Workspace integration (Drive, Calendar, Meet)
- Real-time presence and activity

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **State**: React Query + Zustand
- **Forms**: React Hook Form + Zod
- **DnD**: @dnd-kit
- **Testing**: Vitest + Playwright

## File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (useAuth.ts)
- Services: `camelCase.ts`
- Types: `camelCase.ts`
- Utils: `camelCase.ts`

## Component Template

```tsx
import { FC } from 'react';
import { cn } from '@/utils/cn';

interface ComponentNameProps {
  className?: string;
}

export const ComponentName: FC<ComponentNameProps> = ({ className }) => {
  return (
    <div className={cn('', className)}>
      {/* content */}
    </div>
  );
};
```

## RBAC Rules

| Role | Projects | Sensitive Data | Assets |
|------|----------|----------------|--------|
| Super Admin | All | Yes | All |
| Finance Manager | All (read) | Yes | All (read) |
| Project Manager | **Own only** | **No** | **Own project only** |
| Employee | Assigned | No | Assigned |

## Super Admins

- bill@samas.tech
- bilgrami@gmail.com

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Lint code
npm run typecheck    # Check types
firebase emulators:start  # Start Firebase emulators
```

## Git Commits

Format: `type(scope): description`

Types: feat, fix, docs, style, refactor, test, chore

Examples:
- `feat(tasks): add Kanban drag-drop`
- `fix(auth): handle token refresh`
- `docs(readme): update setup instructions`
CLAUDE_MD

# =============================================================================
# SOURCE FILES SCAFFOLDING
# =============================================================================

echo "📦 Creating source files..."

# src/main.tsx
cat > src/main.tsx << 'MAIN_TSX'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { App } from './App';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
MAIN_TSX

# src/App.tsx
cat > src/App.tsx << 'APP_TSX'
import { FC } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { Spinner } from '@/components/ui/Spinner';

const ProtectedRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export const App: FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                {/* Add more routes as modules are implemented */}
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
APP_TSX

# src/styles/globals.css
cat > src/styles/globals.css << 'GLOBALS_CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
GLOBALS_CSS

# src/types/index.ts
cat > src/types/index.ts << 'TYPES_INDEX'
export * from './user';
export * from './role';
export * from './project';
export * from './task';
export * from './expense';
export * from './document';
export * from './asset';
export * from './announcement';
export * from './presence';
TYPES_INDEX

# src/types/user.ts
cat > src/types/user.ts << 'TYPES_USER'
import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  roles: string[];
  managedProjects: string[];
  memberProjects: string[];
  isActive: boolean;
  status: PresenceStatus;
  statusMessage: string;
  lastSeen: Timestamp;
  googleTokens?: GoogleTokens;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin: Timestamp;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Timestamp;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  emailDigest: 'none' | 'daily' | 'weekly';
}

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
TYPES_USER

# src/types/role.ts
cat > src/types/role.ts << 'TYPES_ROLE'
import { Timestamp } from 'firebase/firestore';

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: RolePermissions;
  dataAccess: DataAccess;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RolePermissions {
  finance: Permission;
  documents: Permission;
  projects: Permission;
  assets: Permission;
  tasks: Permission;
  announcements: Permission;
  rbac: Permission;
}

export interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface DataAccess {
  allProjects: boolean;
  sensitiveFinancials: boolean;
  globalAssets: boolean;
}

export type Module = keyof RolePermissions;
export type Action = keyof Permission;
TYPES_ROLE

# Create placeholder type files
for TYPE in project task expense document asset announcement presence; do
  cat > "src/types/${TYPE}.ts" << EOF
import { Timestamp } from 'firebase/firestore';

// TODO: Implement ${TYPE} types
export interface ${TYPE^} {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
EOF
done

# src/utils/cn.ts
cat > src/utils/cn.ts << 'UTILS_CN'
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
UTILS_CN

# src/test-utils/setup.ts
cat > src/test-utils/setup.ts << 'TEST_SETUP'
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
}));
TEST_SETUP

# Create placeholder context, hook, service, component files
echo "📝 Creating placeholder files..."

# Contexts
for CTX in Auth Theme Toast; do
  cat > "src/contexts/${CTX}Context.tsx" << EOF
import { createContext, useContext, FC, PropsWithChildren } from 'react';

interface ${CTX}ContextValue {
  // TODO: Define context value
}

const ${CTX}Context = createContext<${CTX}ContextValue | null>(null);

export const ${CTX}Provider: FC<PropsWithChildren> = ({ children }) => {
  // TODO: Implement provider
  return (
    <${CTX}Context.Provider value={{} as ${CTX}ContextValue}>
      {children}
    </${CTX}Context.Provider>
  );
};

export const use${CTX} = () => {
  const context = useContext(${CTX}Context);
  if (!context) throw new Error('use${CTX} must be used within ${CTX}Provider');
  return context;
};
EOF
done

# Hooks
for HOOK in useAuth usePermissions; do
  cat > "src/hooks/${HOOK}.ts" << EOF
// TODO: Implement ${HOOK} hook
export const ${HOOK} = () => {
  return {
    // TODO: Return hook values
  };
};
EOF
done

# Components
cat > src/components/ui/Spinner.tsx << 'SPINNER'
import { FC } from 'react';
import { cn } from '@/utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent text-primary-600',
        sizeClasses[size],
        className
      )}
    />
  );
};
SPINNER

cat > src/components/layout/MainLayout.tsx << 'MAIN_LAYOUT'
import { FC, PropsWithChildren } from 'react';

export const MainLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            SaMas Portal
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
MAIN_LAYOUT

# Pages
cat > src/pages/auth/LoginPage.tsx << 'LOGIN_PAGE'
import { FC } from 'react';

export const LoginPage: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            SaMas Portal
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>
        <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            Sign in with Google
          </span>
        </button>
      </div>
    </div>
  );
};
LOGIN_PAGE

cat > src/pages/DashboardPage.tsx << 'DASHBOARD_PAGE'
import { FC } from 'react';

export const DashboardPage: FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* TODO: Add dashboard widgets */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Active Projects
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            0
          </p>
        </div>
      </div>
    </div>
  );
};
DASHBOARD_PAGE

# Firebase service
cat > src/services/firebase/config.ts << 'FIREBASE_CONFIG'
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
FIREBASE_CONFIG

# =============================================================================
# README & CHANGELOG
# =============================================================================

echo "📚 Creating documentation..."

cat > README.md << 'README_MD'
# SaMas IT Services Portal

[![Build Status](https://github.com/your-org/samas-portal/workflows/CI/CD/badge.svg)](https://github.com/your-org/samas-portal/actions)
[![Coverage](https://codecov.io/gh/your-org/samas-portal/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/samas-portal)

A comprehensive company portal for SaMas IT Services with role-based access control, project management, expense tracking, and more.

## Features

- 🔐 **Role-Based Access Control** - Granular permissions with project-scoped security
- 📊 **Finance Module** - Expense submission, approval workflow, reports
- 📁 **Document Management** - Upload, organize, version control, Google Drive integration
- 📋 **Project Management** - Projects, milestones, team management
- ✅ **Task Management** - Trello-style Kanban board with drag-and-drop
- 🖥️ **Asset Management** - Inventory tracking with QR codes
- 📢 **Announcements** - Rich text, targeting, read receipts
- 👥 **Online Presence** - Real-time activity and status sharing
- 📅 **Google Integration** - Drive, Calendar, Meet
- 📱 **PWA** - Installable, offline support, push notifications

## Quick Start

```bash
# Install dependencies
npm install

# Configure Firebase
firebase login
cp .env.example .env.local
# Edit .env.local with your Firebase config

# Start development server
npm run dev

# Run tests
npm test
```

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Technical Design (TDD)](docs/TDD.md)
- [Implementation Checklist](docs/implementation-checklist.md)
- [Agent Checklists](docs/agents/)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **State**: React Query, Zustand
- **Testing**: Vitest, Playwright

## License

Private - SaMas IT Services
README_MD

cat > CHANGELOG.md << 'CHANGELOG_MD'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Firebase configuration
- Basic authentication flow
- Project documentation (PRD, TDD)
- CI/CD pipeline

### Changed
- N/A

### Fixed
- N/A

## [0.1.0] - TBD

### Added
- Phase 1: Foundation & Firebase Setup
- Phase 2: RBAC Management System

[Unreleased]: https://github.com/your-org/samas-portal/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/samas-portal/releases/tag/v0.1.0
CHANGELOG_MD

# =============================================================================
# COMPLETION
# =============================================================================

echo ""
echo "✅ SaMas Portal project created successfully!"
echo "============================================"
echo ""
echo "📁 Project location: $(pwd)"
echo ""
echo "📋 Next steps:"
echo "   1. npm install"
echo "   2. firebase login"
echo "   3. Update .firebaserc with your project ID"
echo "   4. cp .env.example .env.local"
echo "   5. Edit .env.local with your Firebase config"
echo "   6. npm run dev"
echo ""
echo "📚 Documentation:"
echo "   - docs/PRD.md - Product Requirements"
echo "   - docs/TDD.md - Technical Design"
echo "   - docs/implementation-checklist.md - Full checklist"
echo "   - docs/agents/ - Per-agent checklists"
echo ""
echo "🔥 Firebase setup:"
echo "   firebase deploy --only firestore:rules,storage:rules"
echo "   firebase deploy --only functions"
echo "   curl https://us-central1-YOUR-PROJECT.cloudfunctions.net/seedRoles"
echo ""
echo "Happy coding! 🚀"
