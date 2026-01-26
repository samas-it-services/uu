# Firebase RBAC Implementation

Role-Based Access Control (RBAC) system for the SaMas Portal.

---

## 1. Resources & Actions

| Resource      | Actions                      | Scope            |
|---------------|------------------------------|------------------|
| finance       | read, create, update, delete | project / global |
| documents     | read, create, update, delete | visibility-based |
| projects      | read, create, update, delete | project          |
| assets        | read, create, update, delete | visibility-based |
| tasks         | read, create, update, delete | project          |
| announcements | read, create, update, delete | project          |
| rbac          | read, create, update, delete | global           |

---

## 2. Visibility Scopes

For documents and assets, access is controlled by visibility:

| Scope   | Description                              |
|---------|------------------------------------------|
| private | Owner only                               |
| project | All project members                      |
| global  | All authenticated users                  |
| role    | Specific roles defined in allowedRoles   |

---

## 3. Roles & Permissions

### SUPERUSER (`superuser`)
- All resources: full CRUD across all projects
- Can manage RBAC (create/edit roles, assign users)

### PROJECT_MANAGER (`project_manager`)

| Resource      | Permissions                              |
|---------------|------------------------------------------|
| projects      | read, update (own projects)              |
| documents     | full CRUD (within project)               |
| assets        | full CRUD (within project)               |
| tasks         | full CRUD (within project)               |
| announcements | full CRUD (within project)               |
| finance       | read (own project only)                  |

### QA_MANAGER (`qa_manager`)

| Resource      | Permissions                              |
|---------------|------------------------------------------|
| projects      | read                                     |
| documents     | read, update                             |
| assets        | read, update                             |
| tasks         | read, update (own tasks only)            |
| announcements | full CRUD (within project)               |
| finance       | read (own project only)                  |

### ANALYST (`analyst`)

| Resource      | Permissions                              |
|---------------|------------------------------------------|
| projects      | read                                     |
| documents     | read all, full CRUD on own               |
| assets        | read, update                             |
| tasks         | read, update (own tasks only)            |
| announcements | read                                     |
| finance       | none                                     |

### FINANCE_INCHARGE (`finance_incharge`)

| Resource      | Permissions                              |
|---------------|------------------------------------------|
| projects      | read                                     |
| documents     | read, update                             |
| assets        | read, update                             |
| tasks         | read, update (own tasks only)            |
| announcements | full CRUD (within project)               |
| finance       | full CRUD (all projects)                 |

---

## 4. Users

| Email                        | Display Name        | Role             |
|------------------------------|---------------------|------------------|

---

## 5. Firestore Collections Schema

```
users/{uid}
├── email: string
├── displayName: string
├── photoURL: string
├── role: string (superuser | project_manager | qa_manager | analyst | finance_incharge)
├── projects: string[] (array of projectIds)
├── isActive: boolean
└── createdAt: timestamp

roles/{roleId}
├── name: string
├── description: string
├── isSystem: boolean
├── permissions: map { resource: { actions: string[], scope: string } }
└── createdAt: timestamp

projects/{projectId}
├── name: string
├── code: string
├── description: string
├── status: string
├── members: string[] (array of userIds)
├── managerId: string (userId)
├── createdBy: string (userId)
└── createdAt: timestamp

tasks/{taskId}
├── projectId: string
├── title: string
├── description: string
├── assignedTo: string (userId)
├── status: string
├── priority: string
├── createdBy: string (userId)
└── createdAt: timestamp

announcements/{announcementId}
├── projectId: string
├── title: string
├── content: string
├── targetType: string (all | role | project | users)
├── createdBy: string (userId)
└── createdAt: timestamp

finance/{financeId}
├── projectId: string
├── amount: number
├── type: string (income | expense)
├── category: string
├── description: string
├── createdBy: string (userId)
└── createdAt: timestamp

documents/{documentId}
├── projectId: string
├── title: string
├── path: string
├── mimeType: string
├── visibility: string (private | project | global | role)
├── allowedRoles: string[] (used when visibility = "role")
├── createdBy: string (userId)
└── createdAt: timestamp

assets/{assetId}
├── projectId: string
├── name: string
├── type: string
├── serialNumber: string
├── visibility: string (private | project | global | role)
├── allowedRoles: string[] (used when visibility = "role")
├── assignedTo: string (userId)
├── createdBy: string (userId)
└── createdAt: timestamp
```

---

## 6. Implementation Notes

1. **User Creation Flow**: When a new user signs up, create a corresponding document in `users` collection with default role (analyst) and empty projects array.

2. **Project Assignment**: When assigning a user to a project, add the projectId to their `users/{uid}.projects` array.

3. **Visibility Logic**: When creating documents/assets, UI should allow selection of visibility scope. If "role" is selected, prompt for specific roles.

4. **Finance Access**: Finance data is project-scoped but finance_incharge can see all. Use projectId for filtering in queries.

5. **Security Rules Reads**: Note that each getUserData() call costs one read. Consider caching user role in custom claims for high-traffic apps.

---

## 7. Seeding

Run the seed script to initialize roles and users:

```bash
cd samas-portal
npx ts-node scripts/seedRolesAndUsers.ts
```

---

## 8. Deployment

Deploy security rules:

```bash
firebase deploy --only firestore:rules
```

---

## Revision History

| Date       | Version | Changes                    |
|------------|---------|----------------------------|
| 2025-01-25 | 1.0     | Initial RBAC specification |
