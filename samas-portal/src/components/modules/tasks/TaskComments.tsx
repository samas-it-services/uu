import { FC, useState } from 'react';
import { format } from 'date-fns';
import { Send, Trash2, Edit2, X, Check, Loader2 } from 'lucide-react';
import { TaskComment } from '@/types/task';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { useAddComment, useUpdateComment, useDeleteComment } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface TaskCommentsProps {
  taskId: string;
  comments: TaskComment[];
}

export const TaskComments: FC<TaskCommentsProps> = ({ taskId, comments }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const addComment = useAddComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    await addComment.mutateAsync({
      taskId,
      content: newComment.trim(),
    });
    setNewComment('');
  };

  const handleEdit = (comment: TaskComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !editingId) return;

    await updateComment.mutateAsync({
      taskId,
      commentId: editingId,
      content: editContent.trim(),
    });
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await deleteComment.mutateAsync({ taskId, commentId });
    }
  };

  const sortedComments = [...comments].sort(
    (a, b) => a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime()
  );

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900 dark:text-gray-100">
        Comments ({comments.length})
      </h4>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {sortedComments.map((comment) => (
          <div
            key={comment.id}
            className={cn(
              'flex gap-3 p-3 rounded-lg',
              'bg-gray-50 dark:bg-gray-800'
            )}
          >
            <Avatar
              src={comment.authorPhotoURL}
              fallback={comment.authorName}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(comment.createdAt.toDate(), 'MMM d, h:mm a')}
                  </span>
                  {comment.updatedAt.toDate().getTime() !==
                    comment.createdAt.toDate().getTime() && (
                    <span className="text-xs text-gray-400">(edited)</span>
                  )}
                </div>

                {user?.id === comment.authorId && (
                  <div className="flex items-center gap-1">
                    {editingId === comment.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={updateComment.isPending}
                        >
                          {updateComment.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(comment)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(comment.id)}
                          disabled={deleteComment.isPending}
                          className="text-red-500 hover:text-red-600"
                        >
                          {deleteComment.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full mt-2 px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  rows={2}
                  autoFocus
                />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar
          fallback={user?.displayName || 'U'}
          size="sm"
          className="shrink-0"
        />
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || addComment.isPending}
          >
            {addComment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
