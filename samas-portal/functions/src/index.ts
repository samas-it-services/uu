import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Super admin emails - auto-assigned on first login
const SUPER_ADMINS = ['bill@samas.tech', 'bilgrami@gmail.com'];

// Default users with specific roles
const DEFAULT_USERS: Record<string, string[]> = {
  'saminas.samas@gmail.com': ['finance_incharge'],
  'shahneela.samas@gmail.com': ['project_manager'],
  'hinas.samas@gmail.com': ['analyst'],
  'asmaaslam.samas@gmail.com': ['analyst'],
  'shamsa.samas0@gmail.com': ['analyst'],
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
    roles = ['superuser'];
  } else if (predefinedRoles) {
    roles = predefinedRoles;
  } else {
    roles = ['analyst'];
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
      id: 'superuser',
      name: 'Super Admin',
      description: 'Full system access',
      isSystem: true,
      permissions: {
        finance: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
        documents: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
        projects: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
        assets: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
        tasks: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
        announcements: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
        rbac: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
      },
      dataAccess: { allProjects: true, sensitiveFinancials: true, globalAssets: true },
    },
    {
      id: 'finance_incharge',
      name: 'Finance In-Charge',
      description: 'Manage finances and view sensitive data',
      isSystem: true,
      permissions: {
        finance: { actions: ['create', 'read', 'update', 'delete'], scope: 'global' },
        documents: { actions: ['create', 'read'], scope: 'global' },
        projects: { actions: ['read'], scope: 'global' },
        assets: { actions: ['read'], scope: 'global' },
        tasks: { actions: ['read'], scope: 'global' },
        announcements: { actions: ['create', 'read', 'update'], scope: 'global' },
        rbac: { actions: [], scope: 'none' },
      },
      dataAccess: { allProjects: true, sensitiveFinancials: true, globalAssets: true },
    },
    {
      id: 'project_manager',
      name: 'Project Manager',
      description: 'Manage assigned projects and teams',
      isSystem: true,
      permissions: {
        finance: { actions: ['create', 'read'], scope: 'project' },
        documents: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
        projects: { actions: ['create', 'read', 'update'], scope: 'project' },
        assets: { actions: ['create', 'read', 'update'], scope: 'project' },
        tasks: { actions: ['create', 'read', 'update', 'delete'], scope: 'project' },
        announcements: { actions: ['create', 'read', 'update'], scope: 'project' },
        rbac: { actions: [], scope: 'none' },
      },
      dataAccess: { allProjects: false, sensitiveFinancials: false, globalAssets: false },
    },
    {
      id: 'qa_manager',
      name: 'QA Manager',
      description: 'Quality assurance lead',
      isSystem: true,
      permissions: {
        finance: { actions: ['read'], scope: 'project' },
        documents: { actions: ['create', 'read', 'update'], scope: 'project' },
        projects: { actions: ['read'], scope: 'project' },
        assets: { actions: ['read', 'update'], scope: 'project' },
        tasks: { actions: ['create', 'read', 'update'], scope: 'project' },
        announcements: { actions: ['create', 'read'], scope: 'project' },
        rbac: { actions: [], scope: 'none' },
      },
      dataAccess: { allProjects: false, sensitiveFinancials: false, globalAssets: false },
    },
    {
      id: 'analyst',
      name: 'Analyst',
      description: 'Standard employee access',
      isSystem: true,
      permissions: {
        finance: { actions: ['create', 'read', 'update'], scope: 'own' },
        documents: { actions: ['create', 'read'], scope: 'project' },
        projects: { actions: ['read'], scope: 'project' },
        assets: { actions: ['read'], scope: 'project' },
        tasks: { actions: ['read', 'update'], scope: 'own' },
        announcements: { actions: ['read'], scope: 'global' },
        rbac: { actions: [], scope: 'none' },
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

/**
 * HTTP Function: Fix imported projects with missing fields
 * Call once to migrate system-imported projects to the correct schema
 *
 * Usage: curl https://us-central1-uu-portal-60426.cloudfunctions.net/fixImportedProjects
 */
export const fixImportedProjects = functions.https.onRequest(async (req, res) => {
  const projectsRef = db.collection('projects');
  const snapshot = await projectsRef.get();

  if (snapshot.empty) {
    res.json({ success: true, message: 'No projects found', fixed: 0 });
    return;
  }

  const batch = db.batch();
  let fixedCount = 0;
  const fixedProjects: string[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates: Record<string, unknown> = {};
    let needsUpdate = false;

    // Fix missing priority
    if (!data.priority) {
      updates.priority = 'medium';
      needsUpdate = true;
    }

    // Fix missing tags
    if (!data.tags || !Array.isArray(data.tags)) {
      updates.tags = [];
      needsUpdate = true;
    }

    // Fix missing color
    if (!data.color) {
      updates.color = '#3B82F6';
      needsUpdate = true;
    }

    // Fix missing icon
    if (!data.icon) {
      updates.icon = 'folder';
      needsUpdate = true;
    }

    // Fix missing isArchived
    if (data.isArchived === undefined) {
      updates.isArchived = false;
      needsUpdate = true;
    }

    // Fix missing managerName
    if (!data.managerName) {
      updates.managerName = data.managerId === 'system-import' ? 'System Import' : 'Unknown';
      needsUpdate = true;
    }

    // Fix teamMembers - convert string array to TeamMember array
    if (data.teamMembers && Array.isArray(data.teamMembers)) {
      const firstMember = data.teamMembers[0];
      if (typeof firstMember === 'string') {
        updates.teamMembers = data.teamMembers.map((member: string) => ({
          userId: member,
          userName: member === 'system-import' ? 'System Import' : member,
          userPhotoURL: '',
          role: 'manager',
          joinedAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        }));
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      batch.update(doc.ref, updates);
      fixedCount++;
      fixedProjects.push(`${doc.id} (${data.name || 'unnamed'})`);
    }
  }

  if (fixedCount > 0) {
    await batch.commit();
  }

  functions.logger.info(`Fixed ${fixedCount} projects: ${fixedProjects.join(', ')}`);

  res.json({
    success: true,
    message: `Fixed ${fixedCount} projects with missing fields`,
    fixed: fixedCount,
    projects: fixedProjects,
  });
});
