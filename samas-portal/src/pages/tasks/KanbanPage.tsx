import { FC, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { KanbanBoard } from '@/components/modules/tasks/KanbanBoard';
import { TaskModal } from '@/components/modules/tasks/TaskModal';
import { TaskComments } from '@/components/modules/tasks/TaskComments';
import { TaskAttachments } from '@/components/modules/tasks/TaskAttachments';
import { useProjectTasks, useTaskStats, useDeleteTask } from '@/hooks/useTasks';
import { useActiveProjects } from '@/hooks/useProjects';
import { usePermissions } from '@/hooks/usePermissions';
import { Avatar } from '@/components/ui/Avatar';
import { format } from 'date-fns';

const priorityConfig: Record<TaskPriority, { label: string; variant: 'default' | 'secondary' | 'warning' | 'destructive' }> = {
  low: { label: 'Low', variant: 'secondary' },
  medium: { label: 'Medium', variant: 'default' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'destructive' },
};

const statusConfig: Record<TaskStatus, { label: string }> = {
  backlog: { label: 'Backlog' },
  todo: { label: 'To Do' },
  in_progress: { label: 'In Progress' },
  review: { label: 'Review' },
  done: { label: 'Done' },
};

export const KanbanPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get('project') || '';
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('backlog');

  const { data: projects, isLoading: projectsLoading } = useActiveProjects();
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId);
  const { data: stats } = useTaskStats(projectId);
  const deleteTask = useDeleteTask();

  const canCreate = hasPermission('tasks', 'create');
  const canEdit = hasPermission('tasks', 'update');
  const canDelete = hasPermission('tasks', 'delete');

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesPriority =
        priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const handleProjectChange = (newProjectId: string) => {
    if (newProjectId === 'all') {
      searchParams.delete('project');
    } else {
      searchParams.set('project', newProjectId);
    }
    setSearchParams(searchParams);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleAddTask = (status: TaskStatus) => {
    setDefaultStatus(status);
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = () => {
    setShowTaskDetail(false);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask.mutateAsync(selectedTask.id);
      setShowTaskDetail(false);
      setSelectedTask(null);
    }
  };

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Task Board
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage tasks using the Kanban board
          </p>
        </div>
      </div>

      {/* Project Selection & Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select
          value={projectId || 'all'}
          onValueChange={handleProjectChange}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Select a project...</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {projectId && (
          <>
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={priorityFilter}
              onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'all')}
            >
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Stats */}
      {projectId && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-blue-600">To Do</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.byStatus.todo + stats.byStatus.backlog}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-yellow-600">In Progress</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.byStatus.in_progress}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-green-600">Done</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.byStatus.done}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-red-600">Overdue</div>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </Card>
        </div>
      )}

      {/* Kanban Board */}
      {!projectId ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium mb-2">Select a Project</h3>
          <p className="text-gray-500">
            Choose a project from the dropdown to view its task board
          </p>
        </Card>
      ) : tasksLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onAddTask={canCreate ? handleAddTask : undefined}
          canCreate={canCreate}
        />
      )}

      {/* Task Modal (Create/Edit) */}
      {projectId && (
        <TaskModal
          open={showTaskModal}
          onOpenChange={setShowTaskModal}
          task={selectedTask}
          projectId={projectId}
          defaultStatus={defaultStatus}
        />
      )}

      {/* Task Detail Dialog */}
      <Dialog open={showTaskDetail} onOpenChange={setShowTaskDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-xl">
                      {selectedTask.title}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={priorityConfig[selectedTask.priority].variant}>
                        {priorityConfig[selectedTask.priority].label}
                      </Badge>
                      <Badge variant="secondary">
                        {statusConfig[selectedTask.status].label}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTaskDetail(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Description */}
                {selectedTask.description && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Assignee</span>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedTask.assigneeId ? (
                        <>
                          <Avatar
                            fallback={selectedTask.assigneeName || '?'}
                            size="sm"
                          />
                          <span>{selectedTask.assigneeName}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500">Reporter</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar
                        fallback={selectedTask.reporterName}
                        size="sm"
                      />
                      <span>{selectedTask.reporterName}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500">Due Date</span>
                    <p className="mt-1 font-medium">
                      {selectedTask.dueDate
                        ? format(selectedTask.dueDate.toDate(), 'MMM d, yyyy')
                        : '-'}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">Time</span>
                    <p className="mt-1 font-medium">
                      {selectedTask.actualHours || 0}h /{' '}
                      {selectedTask.estimatedHours || '-'}h
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">Created</span>
                    <p className="mt-1 font-medium">
                      {format(selectedTask.createdAt.toDate(), 'MMM d, yyyy')}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">Updated</span>
                    <p className="mt-1 font-medium">
                      {format(selectedTask.updatedAt.toDate(), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {selectedTask.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedTask.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                <TaskAttachments
                  taskId={selectedTask.id}
                  attachments={selectedTask.attachments}
                  canEdit={canEdit}
                />

                {/* Comments */}
                <TaskComments
                  taskId={selectedTask.id}
                  comments={selectedTask.comments}
                />

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  {canEdit && (
                    <Button variant="outline" onClick={handleEditTask}>
                      Edit Task
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      onClick={handleDeleteTask}
                      className="text-red-600 hover:text-red-700"
                      disabled={deleteTask.isPending}
                    >
                      {deleteTask.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
