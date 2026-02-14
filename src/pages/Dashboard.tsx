import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FolderKanban, Users, FileText, Plus, ArrowRight, TrendingUp } from 'lucide-react';
import { trackerApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { displayRole } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';

export function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { data: trackersResponse, isLoading } = useQuery({
    queryKey: ['trackers'],
    queryFn: () => trackerApi.list(),
  });

  const trackers = trackersResponse?.data || [];
  const totalLeads = trackers.reduce((acc: number, t: any) => acc + (t.leadCount || 0), 0);
  const managedCount = trackers.filter((t: any) => t.role === 'OWNER' || t.role === 'ADMIN').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-muted-foreground text-sm">
            Here's an overview of your trackers and leads
          </p>
        </div>
        <Button asChild>
          <Link to="/trackers/new">
            <Plus className="w-4 h-4 mr-2" />
            New Tracker
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FolderKanban className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trackers</p>
                <p className="text-3xl font-bold tracking-tight">{trackers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-bold tracking-tight">{totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Managed by You</p>
                <p className="text-3xl font-bold tracking-tight">{managedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trackers */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Trackers</CardTitle>
              <CardDescription>Quick access to your recent trackers</CardDescription>
            </div>
            {trackers.length > 5 && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/trackers">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {trackers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <FolderKanban className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No trackers yet. Create your first tracker to get started.</p>
              <Button asChild>
                <Link to="/trackers/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tracker
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {trackers.slice(0, 5).map((tracker: any) => (
                <Link
                  key={tracker.trackerId}
                  to={`/trackers/${tracker.trackerId}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{tracker.trackerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{tracker.businessName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary">{tracker.leadCount || 0} leads</Badge>
                    <Badge variant="outline">
                      {tracker.trackerMode === 'SINGULAR' ? 'Singular' : 'Team'}
                    </Badge>
                    <Badge variant="outline" className="hidden sm:inline-flex">
                      {displayRole(tracker.role || '')}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
