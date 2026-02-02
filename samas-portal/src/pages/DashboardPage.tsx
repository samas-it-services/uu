import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, FolderPlus, Shield, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useActiveUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const DashboardPage: FC = () => {
  const { user } = useAuth();
  const { isSuperAdmin, isFinanceManager, isProjectManager } = usePermissions();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user.displayName?.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your workspace today.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Tasks"
          value="12"
          description="3 due today"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
        <StatCard
          title="Projects"
          value={isSuperAdmin || isFinanceManager ? '8' : '3'}
          description={isSuperAdmin ? 'Total active' : 'You\'re assigned to'}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        {(isSuperAdmin || isFinanceManager) && (
          <StatCard
            title="Pending Approvals"
            value="5"
            description="Expenses to review"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        )}
        <StatCard
          title="Documents"
          value="24"
          description="Shared with you"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      {/* Role-specific content */}
      {isSuperAdmin && <AdminDashboard />}
      {isFinanceManager && !isSuperAdmin && <FinanceDashboard />}
      {isProjectManager && !isSuperAdmin && !isFinanceManager && <PMDashboard />}
      {!isSuperAdmin && !isFinanceManager && !isProjectManager && <EmployeeDashboard />}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

const StatCard: FC<StatCardProps> = ({ title, value, description, icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const AdminDashboard: FC = () => {
  const { data: activeUsers, isLoading: usersLoading } = useActiveUsers();
  const activeUserCount = activeUsers?.length ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Key metrics across all projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Users</span>
              <Badge variant="success">
                {usersLoading ? '...' : `${activeUserCount} Active`}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Budget</span>
              <span className="font-medium">$125,000</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending Tasks</span>
              <span className="font-medium">47</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Overdue Items</span>
              <Badge variant="destructive">3</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

    <Card data-testid="quick-actions">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <ActionButton icon="user-plus" label="Add New User" to="/admin/users" />
          <ActionButton icon="folder-plus" label="Create Project" to="/projects" />
          <ActionButton icon="shield" label="Manage Roles" to="/admin/roles" />
          <ActionButton icon="file-text" label="View Audit Logs" to="/admin/audit" />
        </div>
      </CardContent>
    </Card>
  </div>
  );
};

const FinanceDashboard: FC = () => (
  <div className="grid gap-4 lg:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
        <CardDescription>Financial summary across projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Budget</span>
            <span className="font-medium">$125,000</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Spent</span>
            <span className="font-medium text-destructive">$87,500</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Remaining</span>
            <span className="font-medium text-green-500">$37,500</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary" style={{ width: '70%' }} />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Pending Approvals</CardTitle>
        <CardDescription>Expense requests awaiting review</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <ExpenseItem
            description="Software licenses"
            amount="$2,500"
            requester="John D."
            status="pending"
          />
          <ExpenseItem
            description="Travel expenses"
            amount="$850"
            requester="Sarah M."
            status="pending"
          />
          <ExpenseItem
            description="Hardware upgrade"
            amount="$1,200"
            requester="Mike R."
            status="pending"
          />
        </div>
      </CardContent>
    </Card>
  </div>
);

const PMDashboard: FC = () => (
  <div className="grid gap-4 lg:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>My Projects</CardTitle>
        <CardDescription>Projects you're managing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <ProjectItem name="Website Redesign" progress={75} status="on-track" />
          <ProjectItem name="Mobile App v2" progress={45} status="at-risk" />
          <ProjectItem name="API Integration" progress={90} status="on-track" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Team Workload</CardTitle>
        <CardDescription>Task distribution across your team</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <TeamMemberItem name="Alice Johnson" tasks={8} capacity={10} />
          <TeamMemberItem name="Bob Smith" tasks={6} capacity={10} />
          <TeamMemberItem name="Carol White" tasks={10} capacity={10} />
        </div>
      </CardContent>
    </Card>
  </div>
);

const EmployeeDashboard: FC = () => (
  <div className="grid gap-4 lg:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
        <CardDescription>Tasks assigned to you</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <TaskItem title="Review design mockups" due="Today" priority="high" />
          <TaskItem title="Update documentation" due="Tomorrow" priority="medium" />
          <TaskItem title="Fix login bug" due="In 3 days" priority="high" />
          <TaskItem title="Team standup preparation" due="Friday" priority="low" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Recent Announcements</CardTitle>
        <CardDescription>Latest company updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnnouncementItem
            title="Office Closure"
            date="Jan 20"
            preview="The office will be closed on Monday for maintenance..."
          />
          <AnnouncementItem
            title="New Benefits"
            date="Jan 15"
            preview="We're excited to announce new health benefits..."
          />
        </div>
      </CardContent>
    </Card>
  </div>
);

// Helper components
const iconMap = {
  'user-plus': UserPlus,
  'folder-plus': FolderPlus,
  'shield': Shield,
  'file-text': FileText,
};

const ActionButton: FC<{ icon: keyof typeof iconMap; label: string; to: string }> = ({ icon, label, to }) => {
  const navigate = useNavigate();
  const Icon = iconMap[icon];

  return (
    <button
      onClick={() => navigate(to)}
      className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
};

const ExpenseItem: FC<{
  description: string;
  amount: string;
  requester: string;
  status: string;
}> = ({ description, amount, requester }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium">{description}</p>
      <p className="text-xs text-muted-foreground">By {requester}</p>
    </div>
    <div className="text-right">
      <p className="font-medium">{amount}</p>
      <Badge variant="warning" className="text-xs">Pending</Badge>
    </div>
  </div>
);

const ProjectItem: FC<{
  name: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'delayed';
}> = ({ name, progress, status }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm font-medium">{name}</span>
      <Badge
        variant={status === 'on-track' ? 'success' : status === 'at-risk' ? 'warning' : 'destructive'}
      >
        {status.replace('-', ' ')}
      </Badge>
    </div>
    <div className="h-2 w-full rounded-full bg-secondary">
      <div
        className="h-2 rounded-full bg-primary"
        style={{ width: `${progress}%` }}
      />
    </div>
    <p className="mt-1 text-xs text-muted-foreground">{progress}% complete</p>
  </div>
);

const TeamMemberItem: FC<{
  name: string;
  tasks: number;
  capacity: number;
}> = ({ name, tasks, capacity }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm">{name}</span>
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-secondary">
        <div
          className={`h-2 rounded-full ${tasks >= capacity ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${(tasks / capacity) * 100}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{tasks}/{capacity}</span>
    </div>
  </div>
);

const TaskItem: FC<{
  title: string;
  due: string;
  priority: 'high' | 'medium' | 'low';
}> = ({ title, due, priority }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
      <span className="text-sm">{title}</span>
    </div>
    <div className="flex items-center gap-2">
      <Badge
        variant={priority === 'high' ? 'destructive' : priority === 'medium' ? 'warning' : 'secondary'}
      >
        {priority}
      </Badge>
      <span className="text-xs text-muted-foreground">{due}</span>
    </div>
  </div>
);

const AnnouncementItem: FC<{
  title: string;
  date: string;
  preview: string;
}> = ({ title, date, preview }) => (
  <div className="border-l-2 border-primary pl-3">
    <div className="flex items-center justify-between">
      <p className="font-medium">{title}</p>
      <span className="text-xs text-muted-foreground">{date}</span>
    </div>
    <p className="text-sm text-muted-foreground">{preview}</p>
  </div>
);
