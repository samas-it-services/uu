import { FC } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UsersPage, RolesPage, AuditLogsPage } from '@/pages/admin';
import { ExpensesPage, ApprovalsPage, ReportsPage } from '@/pages/finance';
import { DocumentsPage } from '@/pages/documents';
import { ProjectsPage, ProjectDetailPage } from '@/pages/projects';
import { KanbanPage } from '@/pages/tasks';
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

const AdminRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission('rbac', 'read')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const FinanceRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission('finance', 'read')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const DocumentsRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission('documents', 'read')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const ProjectsRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission('projects', 'read')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const TasksRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission('tasks', 'read')) {
    return <Navigate to="/dashboard" replace />;
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
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <UsersPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/roles"
                  element={
                    <AdminRoute>
                      <RolesPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/audit"
                  element={
                    <AdminRoute>
                      <AuditLogsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/finance/expenses"
                  element={
                    <FinanceRoute>
                      <ExpensesPage />
                    </FinanceRoute>
                  }
                />
                <Route
                  path="/finance/approvals"
                  element={
                    <FinanceRoute>
                      <ApprovalsPage />
                    </FinanceRoute>
                  }
                />
                <Route
                  path="/finance/reports"
                  element={
                    <FinanceRoute>
                      <ReportsPage />
                    </FinanceRoute>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <DocumentsRoute>
                      <DocumentsPage />
                    </DocumentsRoute>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <ProjectsRoute>
                      <ProjectsPage />
                    </ProjectsRoute>
                  }
                />
                <Route
                  path="/projects/:id"
                  element={
                    <ProjectsRoute>
                      <ProjectDetailPage />
                    </ProjectsRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <TasksRoute>
                      <KanbanPage />
                    </TasksRoute>
                  }
                />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
