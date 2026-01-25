import { FC, useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
// arrayMove utility available if needed for local reordering
import { Task, TaskStatus, KanbanColumn as KanbanColumnType } from '@/types/task';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { useMoveTask } from '@/hooks/useTasks';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
  canCreate?: boolean;
}

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

export const KanbanBoard: FC<KanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onAddTask,
  canCreate = false,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const moveTask = useMoveTask();

  // Update local tasks when props change
  useMemo(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columnData: KanbanColumnType[] = useMemo(() => {
    return columns.map((col) => ({
      id: col.id,
      title: col.title,
      tasks: localTasks
        .filter((task) => task.status === col.id)
        .sort((a, b) => a.order - b.order),
    }));
  }, [localTasks]);

  const findTaskById = (id: string): Task | undefined => {
    return localTasks.find((task) => task.id === id);
  };

  const findColumnByTaskId = (taskId: string): TaskStatus | null => {
    const task = findTaskById(taskId);
    return task ? task.status : null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = findTaskById(event.active.id as string);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnByTaskId(activeId);
    const overColumn = columns.find((col) => col.id === overId)
      ? (overId as TaskStatus)
      : findColumnByTaskId(overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    setLocalTasks((prevTasks) => {
      return prevTasks.map((task) =>
        task.id === activeId ? { ...task, status: overColumn } : task
      );
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = findTaskById(activeId);
    if (!activeTask) return;

    // Determine target column
    const targetColumn = columns.find((col) => col.id === overId)
      ? (overId as TaskStatus)
      : findColumnByTaskId(overId);

    if (!targetColumn) return;

    // Get tasks in target column
    const columnTasks = localTasks
      .filter((task) => task.status === targetColumn)
      .sort((a, b) => a.order - b.order);

    // Calculate new order
    let newOrder: number;
    const overTask = findTaskById(overId);

    if (overTask && overTask.id !== activeId) {
      // Dropped on another task
      const overIndex = columnTasks.findIndex((t) => t.id === overId);
      if (overIndex === -1) {
        newOrder = columnTasks.length;
      } else {
        // Insert before or after based on position
        const overOrder = overTask.order;
        const nextTask = columnTasks[overIndex + 1];
        newOrder = nextTask
          ? (overOrder + nextTask.order) / 2
          : overOrder + 1;
      }
    } else {
      // Dropped on column itself
      newOrder = columnTasks.length > 0
        ? columnTasks[columnTasks.length - 1].order + 1
        : 1;
    }

    // Update local state
    setLocalTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === activeId
          ? { ...task, status: targetColumn, order: newOrder }
          : task
      )
    );

    // Persist to database
    if (activeTask.status !== targetColumn || activeTask.order !== newOrder) {
      await moveTask.mutateAsync({
        taskId: activeId,
        newStatus: targetColumn,
        newOrder,
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
        {columnData.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={column.tasks}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask ? () => onAddTask(column.id) : undefined}
            canCreate={canCreate}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
