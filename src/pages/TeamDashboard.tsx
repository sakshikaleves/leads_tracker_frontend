import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Users, TrendingUp, BarChart3, Target } from 'lucide-react';
import { teamApi, trackerApi } from '../api';
import { displayRole, statusColor } from '../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';

export function TeamDashboard() {
  const { id } = useParams<{ id: string }>();

  const { data: trackerResponse } = useQuery({
    queryKey: ['tracker', id],
    queryFn: () => trackerApi.get(id!),
    enabled: !!id,
  });

  const { data: dashboardResponse, isLoading } = useQuery({
    queryKey: ['team-dashboard', id],
    queryFn: () => teamApi.getDashboard(id!),
    enabled: !!id,
  });

  const tracker = trackerResponse?.data;
  const dashboard = dashboardResponse?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!dashboard) {
    return <div className="text-center py-8 text-muted-foreground">No data available</div>;
  }

  const conversionRate = dashboard.totalLeads > 0
    ? ((dashboard.statusBreakdown.find(s => s.status === 'CONVERTED')?.count || 0) / dashboard.totalLeads * 100).toFixed(1)
    : '0';

  return (
    <div>
      <Link
        to={`/trackers/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to {tracker?.trackerName || 'Tracker'}
      </Link>
      <h1 className="text-2xl font-bold mb-6">Team Dashboard</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">{dashboard.totalLeads}</div>
            <div className="text-sm text-muted-foreground">Total Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-600">{conversionRate}%</div>
            <div className="text-sm text-muted-foreground">Conversion Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-600">{dashboard.memberStats.length}</div>
            <div className="text-sm text-muted-foreground">Team Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
              <Target className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {dashboard.statusBreakdown.find(s => s.status === 'QUALIFIED')?.count || 0}
            </div>
            <div className="text-sm text-muted-foreground">Qualified Leads</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Pipeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Lead Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'].map((status) => {
              const count = dashboard.statusBreakdown.find(s => s.status === status)?.count || 0;
              const pct = dashboard.totalLeads > 0 ? (count / dashboard.totalLeads * 100).toFixed(0) : 0;
              return (
                <Card key={status} className="flex-1 min-w-[120px] border-0 shadow-none">
                  <CardContent className="p-0">
                    <div className={`rounded-lg p-3 text-center ${statusColor(status)}`}>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-xs font-medium">{status}</div>
                      <div className="text-xs opacity-70">{pct}%</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Per-Member Performance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Member Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-3">Member</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3 text-center">Total</th>
                  <th className="py-2 px-3 text-center">New</th>
                  <th className="py-2 px-3 text-center">Contacted</th>
                  <th className="py-2 px-3 text-center">Qualified</th>
                  <th className="py-2 px-3 text-center">Converted</th>
                  <th className="py-2 px-3 text-center">Lost</th>
                  <th className="py-2 px-3 text-center">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.memberStats.map((m) => {
                  const rate = m.totalLeads > 0 ? (m.convertedLeads / m.totalLeads * 100).toFixed(0) : '0';
                  return (
                    <tr key={m.userId} className="border-b border-border hover:bg-muted/50">
                      <td className="py-2 px-3">
                        <div className="font-medium">{m.name || m.email}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary">{displayRole(m.role)}</Badge>
                      </td>
                      <td className="py-2 px-3 text-center font-bold">{m.totalLeads}</td>
                      <td className="py-2 px-3 text-center">{m.newLeads}</td>
                      <td className="py-2 px-3 text-center">{m.contactedLeads}</td>
                      <td className="py-2 px-3 text-center">{m.qualifiedLeads}</td>
                      <td className="py-2 px-3 text-center text-green-600 font-medium">{m.convertedLeads}</td>
                      <td className="py-2 px-3 text-center text-red-600">{m.lostLeads}</td>
                      <td className="py-2 px-3 text-center font-medium">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Stats */}
      {dashboard.assignmentStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assignment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.assignmentStats.map((a, i) => (
                <Card key={i} className="rounded-lg border">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-sm text-muted-foreground">{a.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{a.assignedLeads} assigned</div>
                      <div className="text-sm text-green-600">{a.converted} converted</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
