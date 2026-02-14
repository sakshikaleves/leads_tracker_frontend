import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Copy, FolderKanban, Users, FileText, ArrowRight } from 'lucide-react';
import { trackerApi } from '../api';
import { formatDate, displayRole } from '../lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

export function Trackers() {
  const [search, setSearch] = useState('');
  const [joinTrackerId, setJoinTrackerId] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: trackersResponse, isLoading } = useQuery({
    queryKey: ['trackers'],
    queryFn: () => trackerApi.list(),
  });

  const requestAccessMutation = useMutation({
    mutationFn: (trackerId: string) => trackerApi.requestAccess(trackerId),
    onSuccess: () => {
      setShowJoinModal(false);
      setJoinTrackerId('');
      alert('Access request sent!');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      alert(err.response?.data?.message || 'Failed to request access');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (trackerId: string) => trackerApi.duplicate(trackerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackers'] });
    },
  });

  const trackers = trackersResponse?.data || [];
  const filteredTrackers = trackers.filter(
    (t: any) =>
      t.trackerName.toLowerCase().includes(search.toLowerCase()) ||
      t.businessName.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trackers</h1>
          <p className="text-muted-foreground text-sm">{trackers.length} tracker{trackers.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowJoinModal(true)}>
            Join Tracker
          </Button>
          <Button asChild>
            <Link to="/trackers/new">
              <Plus className="w-4 h-4 mr-2" />
              New Tracker
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search trackers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Trackers Grid */}
      {filteredTrackers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <FolderKanban className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {search ? 'No trackers match your search' : 'No trackers yet. Create your first tracker to get started.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrackers.map((tracker: any) => (
            <Card key={tracker.trackerId} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">
                      <Link
                        to={`/trackers/${tracker.trackerId}`}
                        className="hover:text-primary transition-colors"
                      >
                        {tracker.trackerName}
                      </Link>
                    </CardTitle>
                    <CardDescription className="truncate">{tracker.businessName}</CardDescription>
                  </div>
                  {(tracker.role === 'ADMIN' || tracker.role === 'OWNER') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground"
                      onClick={() => duplicateMutation.mutate(tracker.trackerId)}
                      title="Duplicate tracker"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-3 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={tracker.trackerMode === 'SINGULAR' ? 'secondary' : 'default'}>
                    {tracker.trackerMode === 'SINGULAR' ? 'Singular' : 'Team'}
                  </Badge>
                  <Badge variant="outline">{displayRole(tracker.role || '')}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {tracker.leadCount || 0} leads
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {tracker.memberCount || 0} members
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Created {formatDate(tracker.createdAt)}
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="secondary" className="w-full" asChild>
                  <Link to={`/trackers/${tracker.trackerId}`}>
                    View Leads
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Join Dialog */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join a Tracker</DialogTitle>
            <DialogDescription>
              Enter the Tracker ID to request access from the tracker owner.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Tracker ID"
            value={joinTrackerId}
            onChange={(e) => setJoinTrackerId(e.target.value)}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowJoinModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => requestAccessMutation.mutate(joinTrackerId)}
              disabled={!joinTrackerId || requestAccessMutation.isPending}
            >
              {requestAccessMutation.isPending ? 'Sending...' : 'Request Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
