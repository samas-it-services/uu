import { FC, useState } from 'react';
import { format } from 'date-fns';
import { FileText, Search, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useAuditLogsInfinite } from '@/hooks/useAuditLogs';
import { AuditLog } from '@/services/api/auditLogs';
import { formatAuditAction, getAuditActionColor } from '@/utils/auditLog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Select, SelectItem } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';

const ACTION_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Actions' },
  { value: 'user.created', label: 'User Created' },
  { value: 'user.updated', label: 'User Updated' },
  { value: 'user.deleted', label: 'User Deleted' },
  { value: 'user.activated', label: 'User Activated' },
  { value: 'user.deactivated', label: 'User Deactivated' },
  { value: 'user.roles_assigned', label: 'Roles Assigned' },
  { value: 'user.projects_assigned', label: 'Projects Assigned' },
  { value: 'role.created', label: 'Role Created' },
  { value: 'role.updated', label: 'Role Updated' },
  { value: 'role.deleted', label: 'Role Deleted' },
  { value: 'role.permissions_updated', label: 'Permissions Updated' },
];

interface AuditLogItemProps {
  log: AuditLog;
}

const AuditLogItem: FC<AuditLogItemProps> = ({ log }) => {
  const [expanded, setExpanded] = useState(false);

  const badgeVariant = getAuditActionColor(log.action) as 'success' | 'destructive' | 'warning' | 'secondary';

  return (
    <Card>
      <CardContent className="p-4">
        <div
          className="flex items-start justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-3">
            <Avatar
              src=""
              fallback={log.performedBy.displayName.charAt(0).toUpperCase()}
              className="h-10 w-10"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{log.performedBy.displayName}</span>
                <Badge variant={badgeVariant}>{formatAuditAction(log.action)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {log.entityType}: <strong>{log.entityName}</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(log.createdAt.toDate(), 'PPpp')}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {expanded && log.changes && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Changes</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {log.changes.before && (
                <div>
                  <p className="text-muted-foreground mb-1">Before</p>
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(log.changes.before, null, 2)}
                  </pre>
                </div>
              )}
              {log.changes.after && (
                <div>
                  <p className="text-muted-foreground mb-1">After</p>
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(log.changes.after, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const AuditLogsPage: FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useAuditLogsInfinite(50);

  const allLogs = data?.pages.flatMap((page) => page.data) || [];

  const filteredLogs = allLogs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">Track all system changes and activities</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by entity or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={actionFilter}
          onValueChange={setActionFilter}
          placeholder="Filter by action"
        >
          {ACTION_FILTERS.map((filter) => (
            <SelectItem key={filter.value} value={filter.value}>
              {filter.label}
            </SelectItem>
          ))}
        </Select>
        <div className="text-sm text-muted-foreground">
          {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No audit logs found</h3>
          <p className="text-muted-foreground">
            {searchQuery || actionFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Activity will appear here as changes are made'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <AuditLogItem key={log.id} log={log} />
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                loading={isFetchingNextPage}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
