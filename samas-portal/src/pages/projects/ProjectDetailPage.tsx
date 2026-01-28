import { FC, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Archive,
  Trash2,
  Calendar,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  ListTodo,
  FileText,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ProjectModal } from '@/components/modules/projects/ProjectModal';
import { MilestoneTimeline, Milestone } from '@/components/modules/projects/MilestoneTimeline';
import { TeamMemberSelect } from '@/components/modules/projects/TeamMemberSelect';
import { ProjectRolesSettings } from '@/components/modules/projects/ProjectRolesSettings';
import {
  useProject,
  useProjectStats,
  useDeleteProject,
  useArchiveProject,
  useAddTeamMember,
  useRemoveTeamMember,
  useUpdateTeamMemberRole,
  useUpdateTeamMemberProjectRole,
} from '@/hooks/useProjects';
import { useProjectRoles } from '@/hooks/useProjectRoles';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { ProjectStatus, ProjectPriority, TeamMember } from '@/types/project';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  ProjectStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }
> = {
  planning: { label: 'Planning', variant: 'secondary' },
  active: { label: 'Active', variant: 'success' },
  on_hold: { label: 'On Hold', variant: 'warning' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const priorityConfig: Record<ProjectPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'text-gray-500' },
  medium: { label: 'Medium', className: 'text-blue-500' },
  high: { label: 'High', className: 'text-orange-500' },
  critical: { label: 'Critical', className: 'text-red-500' },
};

export const ProjectDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'tasks' | 'documents' | 'settings'>('overview');

  const { data: project, isLoading } = useProject(id || '');
  const { data: stats } = useProjectStats(id || '');
  const { data: projectRoles } = useProjectRoles(id);
  const deleteProject = useDeleteProject();
  const archiveProject = useArchiveProject();
  const addTeamMember = useAddTeamMember();
  const removeTeamMember = useRemoveTeamMember();
  const updateTeamMemberRole = useUpdateTeamMemberRole();
  const updateTeamMemberProjectRole = useUpdateTeamMemberProjectRole();

  const canEdit = hasPermission('projects', 'update');
  const canDelete = hasPermission('projects', 'delete');

  // Mock milestones for now (would come from project data)
  const [milestones] = useState<Milestone[]>([]);

  // Mock available users for team (would come from users API)
  const availableUsers = [
    { id: '1', displayName: 'John Doe', email: 'john@example.com' },
    { id: '2', displayName: 'Jane Smith', email: 'jane@example.com' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-gray-500 mb-4">
            The project you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Card>
      </div>
    );
  }

  const statusInfo = statusConfig[project.status];
  const priorityInfo = priorityConfig[project.priority];

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject.mutateAsync(project.id);
      navigate('/projects');
    }
  };

  const handleArchive = async () => {
    if (confirm('Are you sure you want to archive this project?')) {
      await archiveProject.mutateAsync(project.id);
    }
  };

  const handleAddMember = async (member: TeamMember) => {
    await addTeamMember.mutateAsync({ projectId: project.id, member });
  };

  const handleRemoveMember = async (userId: string) => {
    const member = project.teamMembers.find((m) => m.userId === userId);
    await removeTeamMember.mutateAsync({
      projectId: project.id,
      userId,
      userName: member?.userName || '',
    });
  };

  const handleRoleChange = async (userId: string, role: TeamMember['role']) => {
    await updateTeamMemberRole.mutateAsync({ projectId: project.id, userId, role });
  };

  const handleProjectRoleChange = async (userId: string, projectRoleId: string, projectRoleName: string) => {
    await updateTeamMemberProjectRole.mutateAsync({
      projectId: project.id,
      userId,
      projectRoleId,
      projectRoleName,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Projects
            </Button>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-500 font-mono">{project.code}</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {project.name}
            </h1>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {project.priority !== 'medium' && (
              <span className={cn('text-sm font-medium', priorityInfo.className)}>
                {priorityInfo.label}
              </span>
            )}
            {project.isArchived && <Badge variant="secondary">Archived</Badge>}
          </div>
          {project.description && (
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button variant="outline" onClick={() => setShowEditModal(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            </>
          )}
          {canDelete && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Tasks</div>
              <div className="text-lg font-bold">
                {stats?.completedTasks || 0}/{stats?.totalTasks || 0}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-sm text-gray-500">Team</div>
              <div className="text-lg font-bold">{project.teamMembers.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            <div>
              <div className="text-sm text-gray-500">Deadline</div>
              <div className="text-lg font-bold">
                {project.deadline
                  ? format(project.deadline.toDate(), 'MMM d')
                  : '-'}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-sm text-gray-500">Budget</div>
              <div className="text-lg font-bold">
                {project.budget
                  ? `${Math.round((project.budget.spent / project.budget.total) * 100)}%`
                  : '-'}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <div className="text-sm text-gray-500">Overdue</div>
              <div className="text-lg font-bold text-red-500">
                {stats?.overdueTasks || 0}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'team', label: 'Team', icon: Users },
            { id: 'tasks', label: 'Tasks', icon: ListTodo },
            { id: 'documents', label: 'Documents', icon: FileText },
            ...(isSuperAdmin ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Details */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-400" />
              Project Details
            </h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Manager</dt>
                <dd className="font-medium">{project.managerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Start Date</dt>
                <dd className="font-medium">
                  {project.startDate
                    ? format(project.startDate.toDate(), 'MMM d, yyyy')
                    : '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">End Date</dt>
                <dd className="font-medium">
                  {project.endDate
                    ? format(project.endDate.toDate(), 'MMM d, yyyy')
                    : '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium">
                  {format(project.createdAt.toDate(), 'MMM d, yyyy')}
                </dd>
              </div>
              {project.tags.length > 0 && (
                <div className="pt-2">
                  <dt className="text-gray-500 mb-2">Tags</dt>
                  <dd className="flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Milestones */}
          <MilestoneTimeline
            milestones={milestones}
            canEdit={canEdit}
          />

          {/* Budget */}
          {project.budget && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-400" />
                Budget
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Budget</span>
                  <span className="font-bold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: project.budget.currency,
                    }).format(project.budget.total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Spent</span>
                  <span className="font-bold text-green-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: project.budget.currency,
                    }).format(project.budget.spent)}
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      (project.budget.spent / project.budget.total) * 100 >= 100
                        ? 'bg-red-500'
                        : (project.budget.spent / project.budget.total) * 100 >= 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    )}
                    style={{
                      width: `${Math.min(
                        (project.budget.spent / project.budget.total) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Remaining</span>
                  <span className="font-bold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: project.budget.currency,
                    }).format(project.budget.total - project.budget.spent)}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'team' && (
        <TeamMemberSelect
          teamMembers={project.teamMembers}
          availableUsers={availableUsers}
          onAdd={handleAddMember}
          onRemove={handleRemoveMember}
          onRoleChange={handleRoleChange}
          onProjectRoleChange={handleProjectRoleChange}
          managerId={project.managerId}
          canEdit={canEdit}
          projectRoles={projectRoles}
        />
      )}

      {activeTab === 'tasks' && (
        <Card className="p-8 text-center">
          <ListTodo className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Task Board</h3>
          <p className="text-gray-500 mb-4">
            View and manage tasks for this project on the Kanban board.
          </p>
          <Link to={`/tasks?project=${project.id}`}>
            <Button>
              Open Kanban Board
            </Button>
          </Link>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Project Documents</h3>
          <p className="text-gray-500 mb-4">
            View documents associated with this project.
          </p>
          <Link to={`/documents?project=${project.id}`}>
            <Button>
              View Documents
            </Button>
          </Link>
        </Card>
      )}

      {activeTab === 'settings' && isSuperAdmin && (
        <ProjectRolesSettings projectId={project.id} />
      )}

      {/* Edit Modal */}
      <ProjectModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        project={project}
      />
    </div>
  );
};
