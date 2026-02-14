import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Globe, Target, Clock, AlertTriangle, Users, Phone, Calendar } from 'lucide-react';
import { trackerApi, analyticsApi } from '../api';
import { getMonthName } from '../lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

function formatDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STATUS_ORDER = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];
const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500',
  CONTACTED: 'bg-yellow-500',
  QUALIFIED: 'bg-purple-500',
  CONVERTED: 'bg-green-500',
  LOST: 'bg-red-500',
};

const BAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-cyan-500', 'bg-violet-500', 'bg-orange-500', 'bg-teal-500',
];

export function Analytics() {
  const currentDate = new Date();
  const firstOfMonth = formatDateStr(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  const today = formatDateStr(currentDate);

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [selectedTrackers, setSelectedTrackers] = useState<string[]>([]);

  const { data: trackersResponse } = useQuery({
    queryKey: ['trackers'],
    queryFn: () => trackerApi.list(),
  });

  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ['analytics', selectedTrackers, startDate, endDate],
    queryFn: async () => {
      if (selectedTrackers.length > 1) {
        return analyticsApi.getMultiTrackerAnalytics(selectedTrackers, startDate, endDate);
      } else if (selectedTrackers.length === 1) {
        return analyticsApi.getTrackerAnalytics(selectedTrackers[0], startDate, endDate) as any;
      }
      return null;
    },
    enabled: selectedTrackers.length > 0,
  });

  const trackers = trackersResponse?.data || [];
  const analytics = analyticsResponse?.data as any;

  const toggleTracker = (trackerId: string) => {
    setSelectedTrackers((prev) =>
      prev.includes(trackerId)
        ? prev.filter((id) => id !== trackerId)
        : [...prev, trackerId]
    );
  };

  const selectInputClassName = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Track performance across your trackers and team</p>
      </div>

      {/* Filters: Date Range + Tracker Selection — single compact card */}
      <Card>
        <CardContent className="pt-5 pb-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs mb-1 block text-muted-foreground">From</Label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`${selectInputClassName} w-36`}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-muted-foreground">To</Label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${selectInputClassName} w-36`}
              />
            </div>
            <Separator orientation="vertical" className="h-9 hidden sm:block" />
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => { setStartDate(firstOfMonth); setEndDate(today); }}>
                This Month
              </Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 30); setStartDate(formatDateStr(d)); setEndDate(today); }}>
                30 Days
              </Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 90); setStartDate(formatDateStr(d)); setEndDate(today); }}>
                90 Days
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-xs mb-2 block text-muted-foreground">Trackers</Label>
            <div className="flex flex-wrap gap-1.5">
              {trackers.map((tracker) => (
                <Button
                  key={tracker.trackerId}
                  onClick={() => toggleTracker(tracker.trackerId)}
                  className="rounded-full text-xs h-7 px-3"
                  size="sm"
                  variant={selectedTrackers.includes(tracker.trackerId) ? 'default' : 'outline'}
                >
                  {tracker.trackerName}
                </Button>
              ))}
              {trackers.length === 0 && (
                <p className="text-xs text-muted-foreground">No trackers available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {selectedTrackers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Select one or more trackers above to view analytics</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-3">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-7 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card><CardContent className="pt-5"><Skeleton className="h-4 w-40 mb-3" /><Skeleton className="h-8 w-full" /></CardContent></Card>
            <Card><CardContent className="pt-5"><Skeleton className="h-4 w-40 mb-3" /><Skeleton className="h-8 w-full" /></CardContent></Card>
          </div>
        </div>
      ) : analytics ? (
        <div className="space-y-5">
          {/* Summary Cards — compact, 6 columns */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Leads', value: analytics.totalLeads, icon: TrendingUp, color: 'border-indigo-500', iconColor: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'New Leads', value: analytics.byType?.NEW || 0, icon: Target, color: 'border-emerald-500', iconColor: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Yellow Leads', value: analytics.byType?.YELLOW || 0, icon: Globe, color: 'border-yellow-500', iconColor: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Conversion', value: `${analytics.conversionRate ?? 0}%`, icon: TrendingUp, color: 'border-green-500', iconColor: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Duplicates', value: `${analytics.duplicateRate ?? 0}%`, icon: AlertTriangle, color: 'border-orange-500', iconColor: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Avg Response', value: analytics.responseTime?.formatted || 'N/A', icon: Clock, color: 'border-purple-500', iconColor: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((stat) => (
              <Card key={stat.label} className={`border-t-2 ${stat.color}`}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1 rounded ${stat.bg}`}>
                      <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</span>
                  </div>
                  <div className="text-xl font-bold tracking-tight">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pipeline + Monthly Trend — side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lead Status Pipeline */}
            {analytics.byStatus && Object.keys(analytics.byStatus).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Status Pipeline</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex gap-0.5 h-8 rounded-lg overflow-hidden mb-3">
                    {STATUS_ORDER.map((status) => {
                      const count = analytics.byStatus[status] || 0;
                      const pct = analytics.totalLeads > 0 ? (count / analytics.totalLeads) * 100 : 0;
                      if (pct === 0) return null;
                      return (
                        <div
                          key={status}
                          className={`${STATUS_COLORS[status]} flex items-center justify-center text-white text-[10px] font-semibold transition-all`}
                          style={{ width: `${pct}%`, minWidth: count > 0 ? '32px' : '0' }}
                          title={`${status}: ${count} (${Math.round(pct)}%)`}
                        >
                          {pct > 10 && count}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {STATUS_ORDER.map((status) => {
                      const count = analytics.byStatus[status] || 0;
                      const pct = analytics.totalLeads > 0 ? Math.round((count / analytics.totalLeads) * 100) : 0;
                      return (
                        <div key={status} className="flex items-center gap-1.5 text-xs">
                          <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
                          <span className="text-muted-foreground">{status}</span>
                          <span className="font-medium">{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Monthly Trend */}
            {analytics.monthlyTrend && analytics.monthlyTrend.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-end gap-1.5 h-32">
                    {analytics.monthlyTrend.map((item: any) => {
                      const maxCount = Math.max(...analytics.monthlyTrend.map((t: any) => t.count));
                      const height = maxCount ? (item.count / maxCount) * 100 : 0;
                      return (
                        <div
                          key={`${item.yearAdded}-${item.monthAdded}`}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <span className="text-[10px] font-semibold text-muted-foreground">{item.count}</span>
                          <div className="w-full relative group">
                            <div
                              className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t transition-all hover:from-indigo-600 hover:to-indigo-500"
                              style={{ height: `${height}%`, minHeight: item.count ? '6px' : '0' }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {getMonthName(item.monthAdded).slice(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* If no monthly trend, show pipeline full width */}
            {!(analytics.monthlyTrend && analytics.monthlyTrend.length > 0) && !(analytics.byStatus && Object.keys(analytics.byStatus).length > 0) && null}
          </div>

          {/* Distributions — side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Lead Wants */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Lead Wants</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {analytics.byWants && analytics.byWants.length > 0 ? (
                  <div className="space-y-2.5">
                    {analytics.byWants.map((item: any, i: number) => {
                      const percentage = analytics.totalLeads
                        ? Math.round((item.count / analytics.totalLeads) * 100)
                        : 0;
                      return (
                        <div key={item.leadWants}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">{item.leadWants}</span>
                            <span className="text-muted-foreground">{item.count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`${BAR_COLORS[i % BAR_COLORS.length]} h-2 rounded-full transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs py-4 text-center">No data</p>
                )}
              </CardContent>
            </Card>

            {/* Source Channel */}
            {analytics.bySourceChannel && analytics.bySourceChannel.length > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Source Channels</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2.5">
                    {analytics.bySourceChannel.map((item: any, i: number) => {
                      const percentage = analytics.totalLeads
                        ? Math.round((item.count / analytics.totalLeads) * 100)
                        : 0;
                      return (
                        <div key={item.sourceChannel}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">{item.sourceChannel}</span>
                            <span className="text-muted-foreground">{item.count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`${BAR_COLORS[(i + 3) % BAR_COLORS.length]} h-2 rounded-full transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* If no source channel, keep the grid balanced */
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Source Channels</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-muted-foreground text-xs py-4 text-center">No data</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Caller Stats + Team Performance — side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Caller Interaction Stats */}
            {analytics.callerStats && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Caller Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: 'Total Interactions', value: analytics.callerStats.totalInteractions, bg: 'bg-indigo-50', color: 'text-indigo-700' },
                      { label: 'Avg per Lead', value: analytics.callerStats.avgCallersPerLead, bg: 'bg-emerald-50', color: 'text-emerald-700' },
                      { label: 'Leads Contacted', value: analytics.callerStats.leadsWithInteractions, bg: 'bg-purple-50', color: 'text-purple-700' },
                      { label: 'No Interactions', value: analytics.callerStats.leadsWithNoInteractions, bg: 'bg-red-50', color: 'text-red-700' },
                    ].map((s) => (
                      <div key={s.label} className={`p-3 ${s.bg} rounded-lg`}>
                        <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Member Performance */}
            {analytics.memberPerformance && analytics.memberPerformance.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Team Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    {analytics.memberPerformance.map((m: any) => (
                      <div key={m.userId} className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50">
                        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                          {(m.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{m.name || 'Unknown'}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{m.email}</div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-transparent text-[10px] h-5">
                            {m.leadsSourced} sourced
                          </Badge>
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-transparent text-[10px] h-5">
                            {m.leadsAssigned} assigned
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Country + Per-Tracker — side by side */}
          {((analytics.byCountry && analytics.byCountry.length > 0) || (analytics.perTracker && analytics.perTracker.length > 0)) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {analytics.byCountry && analytics.byCountry.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">By Country</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-2 gap-2">
                      {analytics.byCountry.slice(0, 8).map((item: any) => (
                        <div key={item.country} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <span className="text-xs text-muted-foreground">{item.country}</span>
                          <span className="text-sm font-bold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {analytics.perTracker && analytics.perTracker.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Per Tracker</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-2">
                      {analytics.perTracker.map((item: any) => (
                        <div key={item.trackerId} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <div>
                            <div className="text-xs font-medium">{item.trackerName}</div>
                            <div className="text-[10px] text-muted-foreground">{item.businessName}</div>
                          </div>
                          <div className="text-lg font-bold">{item.count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
