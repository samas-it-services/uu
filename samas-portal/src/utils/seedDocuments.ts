/**
 * Seed Default Documents Utility
 *
 * Can be called from browser console.
 * Usage in console: import('@/utils/seedDocuments').then(m => m.seedDefaultDocuments('USER_ID'))
 */

import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { Document, Folder } from '@/types/document';

const createFolder = (
  id: string,
  name: string,
  parentId: string | null,
  userId: string
): Folder => ({
  id,
  name,
  parentId,
  projectId: null,
  createdBy: userId,
  sharedWith: [],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

const createDocument = (
  id: string,
  name: string,
  folderId: string | null,
  userId: string,
  type: 'file' | 'google_doc' | 'google_sheet' = 'file'
): Document => ({
  id,
  name,
  description: `Sample ${name} for testing`,
  type,
  mimeType: type === 'file' ? 'application/pdf' : 'application/vnd.google-apps.document',
  size: 1024 * 1024 * (Math.random() * 5 + 1), // 1-6 MB
  url: 'https://example.com/sample-doc.pdf',
  storagePath: `documents/${id}/sample.pdf`,
  projectId: null,
  folderId,
  uploadedBy: userId,
  uploadedByName: 'System Admin',
  sharedWith: [],
  tags: ['sample', 'test'],
  version: 1,
  previousVersions: [],
  googleDriveId: type !== 'file' ? `gdrive_${id}` : null,
  isSensitive: false,
  visibility: 'global', // Default visibility for seeded documents
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

export const seedDefaultDocuments = async (userId: string): Promise<void> => {
  if (!userId) {
    console.error('Please provide a userId to seed documents.');
    return;
  }

  console.log('Starting document seed...');
  
  const foldersCollectionRef = collection(db, 'folders');
  const documentsCollectionRef = collection(db, 'documents');

  // Create Folders
  const folders: Folder[] = [
    createFolder('folder_finance', 'Finance', null, userId),
    createFolder('folder_hr', 'Human Resources', null, userId),
    createFolder('folder_projects', 'Projects', null, userId),
    createFolder('folder_policies', 'Policies', 'folder_hr', userId), // Nested
  ];

  for (const folder of folders) {
    await setDoc(doc(foldersCollectionRef, folder.id), folder);
    console.log(`Created folder: ${folder.name}`);
  }

  // Create Documents
  const documents: Document[] = [
    createDocument('doc_budget_2024', 'Budget 2024.pdf', 'folder_finance', userId),
    createDocument('doc_invoice_template', 'Invoice Template.pdf', 'folder_finance', userId),
    createDocument('doc_employee_handbook', 'Employee Handbook.pdf', 'folder_hr', userId),
    createDocument('doc_leave_policy', 'Leave Policy.pdf', 'folder_policies', userId),
    createDocument('doc_project_plan', 'Project Plan.gdoc', 'folder_projects', userId, 'google_doc'),
  ];

  for (const d of documents) {
    await setDoc(doc(documentsCollectionRef, d.id), d);
    console.log(`Created document: ${d.name}`);
  }

  console.log('Document seed completed successfully!');
};
