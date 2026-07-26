import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users, FolderKanban, Mail, Clock, Activity,
  Plus, ArrowRight, User, Shield,
} from 'lucide-react';
import { orgApi } from '../api';
import { formatDate, activityLabel } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';

export function OrgDashboard() {
  const { orgId } = useParams<{ orgId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['org-dashboard', orgId],
    queryFn: () => orgApi.dashboard(orgId!),
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const { org, members, invitations, trackers, recentActivity } = data?.data || {};
  const pendingInvites = invitations?.filter((i: any) => i.status === 'PENDING') || [];
  const adminCount = members?.filter((m: any) => m.role === 'ORG_ADMIN').length || 0;
  const memberCount = members?.length || 0;
  const totalLeads = trackers?.reduce((acc: number, t: any) => acc + (t.leadCount || 0), 0) || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{org?.orgName}</h1>
              <p className="text-muted-foreground text-sm">Organization Dashboard</p>
            </div>
          </div>
        </div>
        <Button asChild size="sm">
          <Link to={`/orgs/${orgId}/members`}>
            <Users className="w-4 h-4 mr-1" />
            Manage Team
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Members</p>
                <p className="text-2xl font-bold">{memberCount}</p>
                <p className="text-[10px] text-muted-foreground">{adminCount} admin{adminCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                <FolderKanban className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Trackers</p>
                <p className="text-2xl font-bold">{trackers?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-500/10 rounded-lg">
                <Mail className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold">{pendingInvites.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Team Members</CardTitle>
                <CardDescription>{memberCount} member{memberCount !== 1 ? 's' : ''}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/orgs/${orgId}/members`}>
                  <Plus className="w-4 h-4 mr-1" />Add
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {members?.slice(0, 8).map((m: any) => (
                <div key={m.userId} className="flex items-center justify-between py-2 px-3 rounded-lg border">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                  </div>
                  <Badge variant={m.role === 'ORG_ADMIN' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                    {m.role === 'ORG_ADMIN' ? 'Admin' : 'Member'}
                  </Badge>
                </div>
              ))}
              {members?.length > 8 && (
                <Button variant="ghost" size="sm" asChild className="w-full">
                  <Link to={`/orgs/${orgId}/members`}>
                    View all {memberCount} members <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invitations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invitations</CardTitle>
            <CardDescription>{invitations?.length || 0} total, {pendingInvites.length} pending</CardDescription>
          </CardHeader>
          <CardContent>
            {invitations?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No invitations sent yet.</p>
            ) : (
              <div className="space-y-2">
                {invitations?.slice(0, 8).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 px-3 rounded-lg border">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">
                        {inv.role === 'ORG_ADMIN' ? 'Admin' : 'Member'}
                      </Badge>
                      <Badge
                        variant={inv.status === 'ACCEPTED' ? 'default' : 'outline'}
                        className={`text-[10px] ${inv.status === 'PENDING' ? 'border-amber-300 text-amber-600' : 'bg-green-100 text-green-700 border-green-300'}`}
                      >
                        {inv.status === 'ACCEPTED' ? 'Registered' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Org Trackers */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Org Trackers</CardTitle>
              <CardDescription>{trackers?.length || 0} tracker{trackers?.length !== 1 ? 's' : ''} in this organization</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trackers?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No trackers created yet.</p>
          ) : (
            <div className="space-y-2">
              {trackers?.map((t: any) => (
                <Link
                  key={t.trackerId}
                  to={`/trackers/${t.trackerId}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{t.trackerName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.businessName} · by {t.createdByName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary">{t.leadCount} leads</Badge>
                    <Badge variant="outline">{t.memberCount} members</Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Latest actions by team members</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity?.map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-lg border">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{a.userName}</span>
                      {' '}<span className="text-muted-foreground">{activityLabel(a.action)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.trackerName} · {formatDate(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
