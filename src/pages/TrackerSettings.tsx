import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { customStatusApi, trackerApi } from '../api';
import type { CustomStatus } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Separator } from '../components/ui/separator';

const STATUS_COLORS = [
  { value: 'gray', label: 'Gray', type: 'NEUTRAL' as const },
  { value: 'blue', label: 'Blue', type: 'ACTIVE' as const },
  { value: 'green', label: 'Green', type: 'SUCCESS' as const },
  { value: 'red', label: 'Red', type: 'FAILED' as const },
  { value: 'yellow', label: 'Yellow', type: 'ACTIVE' as const },
  { value: 'purple', label: 'Purple', type: 'ACTIVE' as const },
];

const TYPE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  SUCCESS: 'secondary',
  FAILED: 'destructive',
  NEUTRAL: 'outline',
};

export function TrackerSettings() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CustomStatus | null>(null);
  const [form, setForm] = useState({ statusName: '', statusType: 'NEUTRAL' as string });
  const [error, setError] = useState('');

  const { data: trackerResponse } = useQuery({
    queryKey: ['tracker', id],
    queryFn: () => trackerApi.get(id!),
    enabled: !!id,
  });

  const { data: statusesResponse, isLoading } = useQuery({
    queryKey: ['custom-statuses', id],
    queryFn: () => customStatusApi.list(id!),
    enabled: !!id,
  });

  const tracker = trackerResponse?.data;
  const statuses = statusesResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: () => customStatusApi.create(id!, {
      statusName: form.statusName,
      statusType: form.statusType,
      statusColor: STATUS_COLORS.find(c => c.type === form.statusType)?.value || 'gray',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-statuses', id] });
      setShowAdd(false);
      setForm({ statusName: '', statusType: 'NEUTRAL' });
      setError('');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to create status');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => customStatusApi.update(id!, editing!.id, {
      statusName: form.statusName,
      statusType: form.statusType as any,
      statusColor: STATUS_COLORS.find(c => c.type === form.statusType)?.value || 'gray',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-statuses', id] });
      setEditing(null);
      setForm({ statusName: '', statusType: 'NEUTRAL' });
      setError('');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to update status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (statusId: number) => customStatusApi.delete(id!, statusId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-statuses', id] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to delete status');
    },
  });

  const handleStartEdit = (status: CustomStatus) => {
    setEditing(status);
    setForm({ statusName: status.statusName, statusType: status.statusType });
    setShowAdd(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.statusName.trim()) return;
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={`/trackers/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to {tracker?.trackerName || 'Tracker'}
      </Link>

      <h1 className="text-2xl font-bold mb-6">Tracker Settings</h1>

      {/* Custom Caller Statuses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">Custom Caller Statuses</CardTitle>
            <CardDescription>
              Define statuses for caller interactions (e.g., No Answer, Interested, Meeting Scheduled)
            </CardDescription>
          </div>
          <Button
            onClick={() => { setShowAdd(true); setEditing(null); setForm({ statusName: '', statusType: 'NEUTRAL' }); }}
          >
            <Plus className="w-4 h-4" /> Add Status
          </Button>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : statuses.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No custom statuses yet. Add statuses like "No Answer", "Interested", "Meeting Scheduled", etc.
            </p>
          ) : (
            <div className="space-y-2">
              {statuses.map((status) => (
                <div key={status.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-6">#{status.statusOrder}</span>
                    <Badge variant={TYPE_BADGE_VARIANT[status.statusType] || 'outline'}>
                      {status.statusName}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{status.statusType}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStartEdit(status)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { if (confirm(`Delete "${status.statusName}"?`)) deleteMutation.mutate(status.id); }}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Form */}
          {(showAdd || editing) && (
            <>
              <Separator className="my-4" />
              <Card className="bg-muted/50 border-dashed">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">{editing ? 'Edit Status' : 'Add New Status'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="statusName">Status Name</Label>
                        <Input
                          id="statusName"
                          value={form.statusName}
                          onChange={(e) => setForm({ ...form, statusName: e.target.value })}
                          placeholder="e.g., No Answer"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="statusType">Type</Label>
                        <select
                          id="statusType"
                          value={form.statusType}
                          onChange={(e) => setForm({ ...form, statusType: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="NEUTRAL">Neutral (Gray)</option>
                          <option value="ACTIVE">Active (Blue)</option>
                          <option value="SUCCESS">Success (Green)</option>
                          <option value="FAILED">Failed (Red)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={!form.statusName.trim()}>
                        {editing ? 'Update' : 'Add'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => { setShowAdd(false); setEditing(null); setError(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
