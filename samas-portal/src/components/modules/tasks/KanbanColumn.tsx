import { FC } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask?: () => void;
  canCreate?: boolean;
}

const columnColors: Record<TaskStatus, string> = {
  backlog: 'border-t-gray-400',
  todo: 'border-t-blue-500',
  in_progress: 'border-t-yellow-500',
  review: 'border-t-purple-500',
  done: 'border-t-green-500',
};

export const KanbanColumn: FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  onTaskClick,
  onAddTask,
  canCreate = false,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const taskIds = tasks.map((task) => task.id);

  return (
    <div
      className={cn(
        'flex flex-col w-72 min-w-[288px] bg-gray-100 dark:bg-gray-800 rounded-lg border-t-4',
        columnColors[id]
      )}
    >
      <div className="p-3 flex items-center justify-between border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        {canCreate && onAddTask && (
          <Button variant="ghost" size="sm" onClick={onAddTask}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] transition-colors',
          isOver && 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-full flex items-center justify-center py-8">
            <p className="text-sm text-gray-400">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};
