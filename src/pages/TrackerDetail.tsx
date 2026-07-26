import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Filter, Users, Settings, ChevronLeft, UserPlus, Activity,
  Mail, Phone, AlertTriangle, MoreHorizontal, LayoutList, Table2,
  X, MapPin, Columns3, LayoutGrid, PhoneCall, Clock, MessageCircle, Trash2,
} from 'lucide-react';
import { trackerApi, leadApi, teamApi, customStatusApi } from '../api';
import { formatDate, displayRole, activityLabel, colorToBadge, colorToDot, colorToCol, colorToHeader } from '../lib/utils';
import type { LeadFilters, LeadType, LeadStatus, SourceChannel } from '../types';
import { CallerInteractionsTimeline } from '../components/leads/CallerInteractionsTimeline';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '../components/ui/sheet';

type ViewMode = 'card' | 'grid' | 'table' | 'kanban' | 'active';

const selectCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function filtersFromParams(sp: URLSearchParams): LeadFilters {
  return {
    page:    parseInt(sp.get('page') || '1'),
    limit:   20,
    ...(sp.get('leadType')      && { leadType:      sp.get('leadType') as LeadType }),
    ...(sp.get('status')        && { status:        sp.get('status') as LeadStatus }),
    ...(sp.get('sourceChannel') && { sourceChannel: sp.get('sourceChannel') as SourceChannel }),
    ...(sp.get('country')       && { country:       sp.get('country')! }),
    ...(sp.get('search')        && { search:        sp.get('search')! }),
    ...(sp.get('assignedTo')    && { assignedTo:    sp.get('assignedTo')! }),
    ...(sp.get('ownerId')       && { ownerId:       sp.get('ownerId')! }),
    ...(sp.get('leadWants')     && { leadWants:     sp.get('leadWants')! }),
    ...(sp.get('month')         && { month:         parseInt(sp.get('month')!) }),
    ...(sp.get('year')          && { year:          parseInt(sp.get('year')!) }),
    ...(sp.get('sortBy')        && { sortBy:        sp.get('sortBy') as LeadFilters['sortBy'] }),
    ...(sp.get('sortOrder')     && { sortOrder:     sp.get('sortOrder') as 'asc' | 'desc' }),
    ...(sp.get('duplicatesOnly') === 'true' && { duplicatesOnly: true }),
  };
}

const activeFilterKeys = [
  'leadType', 'status', 'sourceChannel', 'country', 'search',
  'assignedTo', 'ownerId', 'leadWants', 'month', 'year', 'duplicatesOnly',
];

// ── View toggle button ────────────────────────────────────────────────────────
function ViewBtn({
  mode, current, onChange, icon, label,
}: {
  mode: ViewMode; current: ViewMode; onChange: (v: ViewMode) => void;
  icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={() => onChange(mode)}
      title={label}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
        current === mode ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function TrackerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [showFilters, setShowFilters] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showAddOrgMember, setShowAddOrgMember] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');

  const filters = filtersFromParams(searchParams);

  const setFilter = (key: string, value: string | boolean | number | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value !== undefined && value !== '' && value !== false) {
      next.set(key, String(value));
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next, { replace: true });
  };

  const setPage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => setSearchParams({ page: '1' }, { replace: true });
  const activeFilterCount = activeFilterKeys.filter(k => searchParams.get(k)).length;

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: trackerResponse, isLoading: trackerLoading } = useQuery({
    queryKey: ['tracker', id],
    queryFn: () => trackerApi.get(id!),
    enabled: !!id,
  });

  // Fetch custom lead statuses for this tracker
  const { data: leadStatusesResponse } = useQuery({
    queryKey: ['custom-statuses', id, 'LEAD'],
    queryFn: () => customStatusApi.list(id!, 'LEAD'),
    enabled: !!id,
  });

  const customLeadStatuses = leadStatusesResponse?.data || [];
  const statuses = useMemo(() => customLeadStatuses.map(s => s.statusName), [customLeadStatuses]);
  const statusConfig = useMemo(() => {
    const cfg: Record<string, { label: string; dot: string; col: string; header: string }> = {};
    for (const s of customLeadStatuses) {
      cfg[s.statusName] = {
        label: s.statusName,
        dot: colorToDot(s.statusColor),
        col: colorToCol(s.statusColor),
        header: colorToHeader(s.statusColor),
      };
    }
    return cfg;
  }, [customLeadStatuses]);

  // Helper: get badge class for a lead status
  const getStatusBadge = (status: string) => {
    const cs = customLeadStatuses.find(s => s.statusName === status);
    return cs ? colorToBadge(cs.statusColor) : 'bg-gray-100 text-gray-800';
  };

  // Paginated query for card/grid/table views
  const { data: leadsResponse, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', id, filters],
    queryFn: () => leadApi.list(id!, filters),
    enabled: !!id && viewMode !== 'kanban',
  });

  // Active statuses the user considers "active" — defaults to statuses with type ACTIVE
  const [activeStatuses, setActiveStatuses] = useState<LeadStatus[]>([]);
  const [activeStatusesInit, setActiveStatusesInit] = useState(false);
  useEffect(() => {
    if (customLeadStatuses.length > 0 && !activeStatusesInit) {
      setActiveStatuses(customLeadStatuses.filter(s => s.statusType === 'ACTIVE').map(s => s.statusName));
      setActiveStatusesInit(true);
    }
  }, [customLeadStatuses, activeStatusesInit]);

  // Kanban + Active view fetch ALL leads (no pagination), grouped client-side
  const bulkFilters: LeadFilters = { ...filters, page: 1, limit: 500, status: undefined };
  const { data: kanbanResponse, isLoading: kanbanLoading } = useQuery({
    queryKey: ['leads-kanban', id, { ...filters, status: undefined }],
    queryFn: () => leadApi.list(id!, bulkFilters),
    enabled: !!id && (viewMode === 'kanban' || viewMode === 'active'),
  });

  const { data: membersResponse } = useQuery({
    queryKey: ['members', id],
    queryFn: () => trackerApi.getMembers(id!),
    enabled: !!id,
  });
  const { data: requestsResponse } = useQuery({
    queryKey: ['requests', id],
    queryFn: () => trackerApi.getAccessRequests(id!),
    enabled: !!id && showRequests,
  });
  const { data: activityResponse } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => teamApi.getActivity(id!),
    enabled: !!id && showActivity,
  });
  const { data: orgMembersResponse, isLoading: orgMembersLoading } = useQuery({
    queryKey: ['org-members', id],
    queryFn: () => trackerApi.getOrgMembers(id!),
    enabled: !!id && showAddOrgMember,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const respondMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: number; action: 'accept' | 'reject' }) =>
      trackerApi.respondToRequest(requestId, action, 'MEMBER', true, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', id] });
      queryClient.invalidateQueries({ queryKey: ['members', id] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (leadId: string) => leadApi.delete(id!, leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', id] });
      queryClient.invalidateQueries({ queryKey: ['leads-kanban', id] });
    },
  });
  const inviteMutation = useMutation({
    mutationFn: (email: string) => trackerApi.inviteBDA(id!, email),
    onSuccess: () => {
      setInviteEmail(''); setInviteError(''); setShowInvite(false);
      queryClient.invalidateQueries({ queryKey: ['members', id] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setInviteError(err.response?.data?.message || 'Failed to send invitation');
    },
  });
  const addOrgMemberMutation = useMutation({
    mutationFn: (email: string) => trackerApi.inviteBDA(id!, email, 'MEMBER'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', id] });
      queryClient.invalidateQueries({ queryKey: ['org-members', id] });
    },
  });

  const deleteTrackerMutation = useMutation({
    mutationFn: () => trackerApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackers'] });
      navigate('/trackers');
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: string }) =>
      leadApi.changeStatus(id!, leadId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', id] });
      queryClient.invalidateQueries({ queryKey: ['leads-kanban', id] });
    },
  });
  const assignMutation = useMutation({
    mutationFn: ({ leadId, assignedTo }: { leadId: string; assignedTo: string | null }) =>
      leadApi.assign(id!, leadId, assignedTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', id] });
      queryClient.invalidateQueries({ queryKey: ['leads-kanban', id] });
    },
  });

  // ── Derived ────────────────────────────────────────────────────────────────
  const tracker    = trackerResponse?.data;
  const leads      = leadsResponse?.data || [];
  const pagination = leadsResponse?.pagination;
  const allLeads   = kanbanResponse?.data || [];
  const members    = membersResponse?.data || [];
  const requests   = requestsResponse?.data || [];
  const activities = activityResponse?.data || [];
  const isAdmin    = tracker?.myRole === 'ADMIN' || tracker?.myRole === 'OWNER';

  // Group for kanban
  const kanbanGroups = statuses.reduce<Record<string, any[]>>((acc, s) => {
    acc[s] = allLeads.filter((l: any) => (l.status || 'NEW') === s);
    return acc;
  }, {} as Record<string, any[]>);

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (trackerLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-between"><div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-32" /></div><Skeleton className="h-10 w-28" /></div>
        <div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-40 rounded-xl"/>)}</div>
      </div>
    );
  }
  if (!tracker) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground mb-4">Tracker not found</p>
        <Button variant="outline" asChild><Link to="/trackers">Back to Trackers</Link></Button>
      </div>
    );
  }

  const isLoading = (viewMode === 'kanban' || viewMode === 'active') ? kanbanLoading : leadsLoading;
  const activeLeads = allLeads.filter((l: any) => activeStatuses.includes((l.status || 'NEW') as LeadStatus));

  // ── Helpers ────────────────────────────────────────────────────────────────
  // Shared mini card used in Grid + Kanban
  const MiniCard = ({ lead }: { lead: any }) => (
    <div className="bg-background border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          {lead.serialNumber && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded">#{lead.serialNumber}</span>
          )}
          <span className="font-semibold text-sm truncate">{lead.leadName || '—'}</span>
          {lead.isDuplicate && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
        </div>
        <Badge variant={lead.leadType === 'NEW' ? 'default' : 'secondary'} className="text-[10px] px-1.5 shrink-0">
          {lead.leadType}
        </Badge>
      </div>

      {/* Status select */}
      <select
        value={lead.status || 'NEW'}
        onChange={(e) => statusMutation.mutate({ leadId: lead.leadId, status: e.target.value })}
        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border-0 cursor-pointer w-full mb-2 ${getStatusBadge(lead.status || 'NEW')}`}
      >
        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {lead.leadEmail && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground truncate mb-0.5">
          <Mail className="w-3 h-3 shrink-0" />{lead.leadEmail}
        </div>
      )}
      {lead.leadContact && (
        <div className="flex items-center gap-1 flex-wrap mb-0.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3 shrink-0" />{lead.leadContact}</span>
          <a href={`tel:${lead.leadContact}`} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-medium"><Phone className="w-2.5 h-2.5" />Call</a>
          <a href={`https://wa.me/${lead.leadContact.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 text-[10px] font-medium"><MessageCircle className="w-2.5 h-2.5" />WA</a>
        </div>
      )}
      {lead.country && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <MapPin className="w-3 h-3 shrink-0" />{lead.country}{lead.city ? `, ${lead.city}` : ''}
        </div>
      )}
      {lead.leadWants && (
        <div className="text-xs text-muted-foreground mb-1">
          <span className="font-medium">Wants:</span> {lead.leadWants}
        </div>
      )}
      {lead.assignedToName && (
        <Badge variant="outline" className="text-[10px] px-1.5 text-indigo-700 border-indigo-200 bg-indigo-50 mb-1">
          {lead.assignedToName}
        </Badge>
      )}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t">
        <Button variant="outline" size="sm" className="h-6 px-2 text-xs flex-1" asChild>
          <Link to={`/trackers/${id}/leads/${lead.leadId}/edit`}>Edit</Link>
        </Button>
        {isAdmin && (
          <Button
            variant="destructive" size="sm" className="h-6 px-2 text-xs"
            onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(lead.leadId); }}
          >Del</Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <Link to="/trackers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ChevronLeft className="w-4 h-4" />Back to Trackers
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{tracker.trackerName}</h1>
            <p className="text-muted-foreground text-sm">{tracker.businessName}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant={tracker.trackerMode === 'SINGULAR' ? 'secondary' : 'default'}>
                {tracker.trackerMode === 'SINGULAR' ? 'Singular' : 'Team'}
              </Badge>
              <Badge variant="outline">{displayRole(tracker.myRole || '')}</Badge>
              <Badge variant="secondary">{tracker.leadCount} leads</Badge>
              <Badge variant="secondary">{tracker.memberCount} members</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm"><MoreHorizontal className="w-4 h-4 mr-2" />Manage</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={`/trackers/${id}/team`}><Users className="w-4 h-4 mr-2" />Team Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowActivity(true)}>
                    <Activity className="w-4 h-4 mr-2" />Activity Log
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowMembers(true)}>
                    <Users className="w-4 h-4 mr-2" />Members
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowInvite(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />Invite by Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAddOrgMember(true)}>
                    <Users className="w-4 h-4 mr-2" />Add from Org
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowRequests(true)}>
                    <Mail className="w-4 h-4 mr-2" />Access Requests
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/trackers/${id}/settings`}><Settings className="w-4 h-4 mr-2" />Settings</Link>
                  </DropdownMenuItem>
                  {tracker?.isOrgAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />Delete Tracker
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button asChild size="sm">
              <Link to={`/trackers/${id}/leads/new`}><Plus className="w-4 h-4" /><span className="hidden sm:inline ml-1">Add Lead</span></Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
            showFilters ? 'bg-accent border-accent-foreground/20' : 'border-input hover:bg-accent'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5">{activeFilterCount}</Badge>
          )}
        </button>

        {/* Sort (hidden in kanban/active) */}
        {viewMode !== 'kanban' && viewMode !== 'active' && (
          <select
            value={`${searchParams.get('sortBy') || 'createdAt'}-${searchParams.get('sortOrder') || 'desc'}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              const next = new URLSearchParams(searchParams);
              next.set('sortBy', by); next.set('sortOrder', order); next.set('page', '1');
              setSearchParams(next, { replace: true });
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="createdAt-desc">Newest first</option>
            <option value="createdAt-asc">Oldest first</option>
            <option value="serialNumber-asc">Serial # ↑</option>
            <option value="serialNumber-desc">Serial # ↓</option>
            <option value="leadName-asc">Name A→Z</option>
            <option value="leadName-desc">Name Z→A</option>
            <option value="status-asc">Status</option>
          </select>
        )}

        {/* View toggle — 5 options */}
        <div className="flex items-center border border-input rounded-md overflow-hidden ml-auto">
          <ViewBtn mode="card"   current={viewMode} onChange={setViewMode} icon={<LayoutList className="w-4 h-4"/>}  label="Cards" />
          <ViewBtn mode="grid"   current={viewMode} onChange={setViewMode} icon={<LayoutGrid className="w-4 h-4"/>}  label="Grid" />
          <ViewBtn mode="table"  current={viewMode} onChange={setViewMode} icon={<Table2 className="w-4 h-4"/>}      label="Table" />
          <ViewBtn mode="kanban" current={viewMode} onChange={setViewMode} icon={<Columns3 className="w-4 h-4"/>}    label="Kanban" />
          <ViewBtn mode="active" current={viewMode} onChange={setViewMode} icon={<PhoneCall className="w-4 h-4"/>}   label="Active" />
        </div>
      </div>

      {/* ── Filter Panel (Desktop: inline card, Mobile: Sheet drawer) ───── */}
      {/* Desktop filters */}
      {showFilters && (
        <Card className="hidden lg:block">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Lead Type</label>
                <select value={filters.leadType || ''} onChange={e => setFilter('leadType', e.target.value || undefined)} className={selectCls}>
                  <option value="">All Types</option>
                  <option value="NEW">New</option>
                  <option value="YELLOW">Yellow</option>
                </select>
              </div>

              {viewMode !== 'kanban' && viewMode !== 'active' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                  <select value={filters.status || ''} onChange={e => setFilter('status', e.target.value || undefined)} className={selectCls}>
                    <option value="">All Statuses</option>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Working On (Assigned)</label>
                <select value={filters.assignedTo || ''} onChange={e => setFilter('assignedTo', e.target.value || undefined)} className={selectCls}>
                  <option value="">Anyone</option>
                  <option value="unassigned">Unassigned</option>
                  {members.map(m => <option key={m.userId} value={m.userId}>{m.name || m.email}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Added By</label>
                <select value={filters.ownerId || ''} onChange={e => setFilter('ownerId', e.target.value || undefined)} className={selectCls}>
                  <option value="">Anyone</option>
                  {members.map(m => <option key={m.userId} value={m.userId}>{m.name || m.email}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Lead Wants</label>
                <select value={filters.leadWants || ''} onChange={e => setFilter('leadWants', e.target.value || undefined)} className={selectCls}>
                  <option value="">All</option>
                  <option>Website</option>
                  <option>Mobile App</option>
                  <option>Web App</option>
                  <option>E-commerce</option>
                  <option>CRM</option>
                  <option>ERP</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Source Channel</label>
                <select value={filters.sourceChannel || ''} onChange={e => setFilter('sourceChannel', e.target.value || undefined)} className={selectCls}>
                  <option value="">All Sources</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Event">Event</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label>
                <Input
                  placeholder="e.g. India, USA"
                  value={filters.country || ''}
                  onChange={e => setFilter('country', e.target.value || undefined)}
                  className="h-9"
                />
              </div>

              {/* Month + Year */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Month</label>
                  <select value={filters.month || ''} onChange={e => setFilter('month', e.target.value ? parseInt(e.target.value) : undefined)} className={selectCls}>
                    <option value="">Any</option>
                    {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Year</label>
                  <select value={filters.year || ''} onChange={e => setFilter('year', e.target.value ? parseInt(e.target.value) : undefined)} className={selectCls}>
                    <option value="">Any</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Search */}
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
                <Input
                  placeholder="Name, email, description..."
                  value={filters.search || ''}
                  onChange={e => setFilter('search', e.target.value || undefined)}
                  className="h-9"
                />
              </div>

              {/* Duplicates + clear */}
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.duplicatesOnly || false}
                    onChange={e => setFilter('duplicatesOnly', e.target.checked || undefined)}
                    className="rounded border-input"
                  />
                  Duplicates only
                </label>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                    <X className="w-3.5 h-3.5 mr-1" />Clear all
                  </Button>
                )}
              </div>
            </div>

            {/* Active chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                {filters.leadType && <Chip label={`Type: ${filters.leadType}`} onRemove={() => setFilter('leadType', undefined)} />}
                {filters.status && <Chip label={`Status: ${filters.status}`} onRemove={() => setFilter('status', undefined)} />}
                {filters.assignedTo && <Chip label={`Assigned: ${members.find(m=>m.userId===filters.assignedTo)?.name || filters.assignedTo}`} onRemove={() => setFilter('assignedTo', undefined)} />}
                {filters.ownerId && <Chip label={`Added by: ${members.find(m=>m.userId===filters.ownerId)?.name || filters.ownerId}`} onRemove={() => setFilter('ownerId', undefined)} />}
                {filters.leadWants && <Chip label={`Wants: ${filters.leadWants}`} onRemove={() => setFilter('leadWants', undefined)} />}
                {filters.sourceChannel && <Chip label={`Source: ${filters.sourceChannel}`} onRemove={() => setFilter('sourceChannel', undefined)} />}
                {filters.country && <Chip label={`Country: ${filters.country}`} onRemove={() => setFilter('country', undefined)} />}
                {filters.month && <Chip label={`Month: ${months[(filters.month||1)-1]}`} onRemove={() => setFilter('month', undefined)} />}
                {filters.year && <Chip label={`Year: ${filters.year}`} onRemove={() => setFilter('year', undefined)} />}
                {filters.search && <Chip label={`"${filters.search}"`} onRemove={() => setFilter('search', undefined)} />}
                {filters.duplicatesOnly && <Chip label="Duplicates only" amber onRemove={() => setFilter('duplicatesOnly', undefined)} />}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile filter Sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="right" className="w-[85vw] sm:max-w-md lg:hidden overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-1 gap-3 mt-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Lead Type</label>
              <select value={filters.leadType || ''} onChange={e => setFilter('leadType', e.target.value || undefined)} className={selectCls}>
                <option value="">All Types</option>
                <option value="NEW">New</option>
                <option value="YELLOW">Yellow</option>
              </select>
            </div>
            {viewMode !== 'kanban' && viewMode !== 'active' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <select value={filters.status || ''} onChange={e => setFilter('status', e.target.value || undefined)} className={selectCls}>
                  <option value="">All Statuses</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Working On (Assigned)</label>
              <select value={filters.assignedTo || ''} onChange={e => setFilter('assignedTo', e.target.value || undefined)} className={selectCls}>
                <option value="">Anyone</option>
                <option value="unassigned">Unassigned</option>
                {members.map(m => <option key={m.userId} value={m.userId}>{m.name || m.email}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Added By</label>
              <select value={filters.ownerId || ''} onChange={e => setFilter('ownerId', e.target.value || undefined)} className={selectCls}>
                <option value="">Anyone</option>
                {members.map(m => <option key={m.userId} value={m.userId}>{m.name || m.email}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Lead Wants</label>
              <select value={filters.leadWants || ''} onChange={e => setFilter('leadWants', e.target.value || undefined)} className={selectCls}>
                <option value="">All</option>
                <option>Website</option><option>Mobile App</option><option>Web App</option>
                <option>E-commerce</option><option>CRM</option><option>ERP</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Source Channel</label>
              <select value={filters.sourceChannel || ''} onChange={e => setFilter('sourceChannel', e.target.value || undefined)} className={selectCls}>
                <option value="">All Sources</option>
                <option value="LinkedIn">LinkedIn</option><option value="Website">Website</option>
                <option value="Referral">Referral</option><option value="Cold Call">Cold Call</option>
                <option value="Event">Event</option><option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label>
              <Input placeholder="e.g. India, USA" value={filters.country || ''} onChange={e => setFilter('country', e.target.value || undefined)} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Month</label>
                <select value={filters.month || ''} onChange={e => setFilter('month', e.target.value ? parseInt(e.target.value) : undefined)} className={selectCls}>
                  <option value="">Any</option>
                  {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Year</label>
                <select value={filters.year || ''} onChange={e => setFilter('year', e.target.value ? parseInt(e.target.value) : undefined)} className={selectCls}>
                  <option value="">Any</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
              <Input placeholder="Name, email, description..." value={filters.search || ''} onChange={e => setFilter('search', e.target.value || undefined)} className="h-10" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
              <input type="checkbox" checked={filters.duplicatesOnly || false} onChange={e => setFilter('duplicatesOnly', e.target.checked || undefined)} className="rounded border-input" />
              Duplicates only
            </label>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                <X className="w-3.5 h-3.5 mr-1" />Clear all filters
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Active filter chips (visible on all screens) */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.leadType && <Chip label={`Type: ${filters.leadType}`} onRemove={() => setFilter('leadType', undefined)} />}
          {filters.status && <Chip label={`Status: ${filters.status}`} onRemove={() => setFilter('status', undefined)} />}
          {filters.assignedTo && <Chip label={`Assigned: ${members.find(m=>m.userId===filters.assignedTo)?.name || filters.assignedTo}`} onRemove={() => setFilter('assignedTo', undefined)} />}
          {filters.search && <Chip label={`"${filters.search}"`} onRemove={() => setFilter('search', undefined)} />}
          {filters.duplicatesOnly && <Chip label="Duplicates only" amber onRemove={() => setFilter('duplicatesOnly', undefined)} />}
        </div>
      )}

      {/* ── Lead Content ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className={viewMode === 'kanban' ? 'flex gap-3' : 'space-y-3'}>
          {viewMode === 'kanban'
            ? (statuses.length > 0 ? statuses : ['1','2','3','4','5']).map(s => <Skeleton key={s} className="flex-1 h-64 rounded-xl" />)
            : [1,2,3].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)
          }
        </div>
      ) : (viewMode !== 'kanban' && viewMode !== 'active' && leads.length === 0) || ((viewMode === 'kanban' || viewMode === 'active') && allLeads.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {activeFilterCount > 0 ? 'No leads match your filters.' : 'No leads yet. Add your first lead!'}
            </p>
            {activeFilterCount > 0
              ? <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
              : <Button asChild><Link to={`/trackers/${id}/leads/new`}><Plus className="w-4 h-4 mr-2" />Add Lead</Link></Button>
            }
          </CardContent>
        </Card>

      ) : viewMode === 'card' ? (
        /* ── CARD VIEW ──────────────────────────────────────────────────────── */
        <div className="space-y-3">
          {leads.map((lead: any) => (
            <Card key={lead.leadId} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {lead.serialNumber && <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{lead.serialNumber}</span>}
                      {lead.leadName && <span className="font-semibold text-base">{lead.leadName}</span>}
                      <Badge variant={lead.leadType === 'NEW' ? 'default' : 'secondary'}>{lead.leadType}</Badge>
                      <select
                        value={lead.status || 'NEW'}
                        onChange={e => statusMutation.mutate({ leadId: lead.leadId, status: e.target.value })}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer ${getStatusBadge(lead.status || 'NEW')}`}
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {lead.isDuplicate && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                          <AlertTriangle className="w-3 h-3 mr-1" />Duplicate
                        </Badge>
                      )}
                    </div>
                    {(lead.leadEmail || lead.leadContact) && (
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                        {lead.leadEmail && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5"/>{lead.leadEmail}</span>}
                        {lead.leadContact && (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5"/>{lead.leadContact}</span>
                            <a
                              href={`tel:${lead.leadContact}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-colors"
                            >
                              <Phone className="w-3 h-3" /> Call
                            </a>
                            <a
                              href={`https://wa.me/${lead.leadContact.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {lead.country && <span className="flex items-center gap-1 text-muted-foreground text-sm"><MapPin className="w-3.5 h-3.5"/>{lead.country}{lead.city && `, ${lead.city}`}</span>}
                      {lead.sourceChannel && <Badge variant="outline" className="text-xs">{lead.sourceChannel}</Badge>}
                      {lead.sourceBdaName && <Badge variant="outline" className="text-xs text-violet-700 border-violet-200 bg-violet-50">Sourced: {lead.sourceBdaName}</Badge>}
                      {lead.assignedToName && <Badge variant="outline" className="text-xs text-indigo-700 border-indigo-200 bg-indigo-50">Assigned: {lead.assignedToName}</Badge>}
                    </div>
                    <p className="text-sm font-medium mb-1">Wants: {lead.leadWants}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{lead.description}</p>
                    {lead.notesForTeam && <p className="text-sm text-muted-foreground mt-1 italic">Notes: {lead.notesForTeam}</p>}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-xs text-muted-foreground">Added by {lead.ownerName || 'Unknown'} on {formatDate(lead.createdAt)}</span>
                      {isAdmin && (
                        <select
                          value={lead.assignedTo || ''}
                          onChange={e => assignMutation.mutate({ leadId: lead.leadId, assignedTo: e.target.value || null })}
                          className="text-xs border rounded-md px-2 py-1 bg-background"
                        >
                          <option value="">Unassigned</option>
                          {members.map((m: any) => <option key={m.userId} value={m.userId}>{m.name || m.email}</option>)}
                        </select>
                      )}
                    </div>
                    <CallerInteractionsTimeline trackerId={id!} leadId={lead.leadId} isAdmin={isAdmin} />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild><Link to={`/trackers/${id}/leads/${lead.leadId}/edit`}>Edit</Link></Button>
                    {isAdmin && (
                      <Button variant="destructive" size="sm" onClick={() => { if (confirm('Delete this lead?')) deleteMutation.mutate(lead.leadId); }}>Delete</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      ) : viewMode === 'grid' ? (
        /* ── GRID VIEW ──────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {leads.map((lead: any) => <MiniCard key={lead.leadId} lead={lead} />)}
        </div>

      ) : viewMode === 'table' ? (
        /* ── TABLE VIEW ─────────────────────────────────────────────────────── */
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-10">#</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Lead</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Wants</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-28">Status</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Source</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Assigned</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Country</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Added</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead: any, idx: number) => (
                <tr key={lead.leadId} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${idx % 2 !== 0 ? 'bg-muted/10' : ''}`}>
                  <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{lead.serialNumber ? `#${lead.serialNumber}` : '—'}</td>
                  <td className="px-3 py-2.5 max-w-[180px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {lead.isDuplicate && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
                      <span className="font-medium truncate">{lead.leadName || '—'}</span>
                    </div>
                    <Badge variant={lead.leadType === 'NEW' ? 'default' : 'secondary'} className="text-[10px] px-1.5 h-4 mt-0.5">{lead.leadType}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-[180px]">
                    {lead.leadEmail && <div className="flex items-center gap-1 text-xs truncate"><Mail className="w-3 h-3 shrink-0"/>{lead.leadEmail}</div>}
                    {lead.leadContact && (
                      <div className="flex items-center gap-1 flex-wrap mt-0.5">
                        <span className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3 shrink-0"/>{lead.leadContact}</span>
                        <a href={`tel:${lead.leadContact}`} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-medium"><Phone className="w-2.5 h-2.5"/>Call</a>
                        <a href={`https://wa.me/${lead.leadContact.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 text-[10px] font-medium"><MessageCircle className="w-2.5 h-2.5"/>WA</a>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-medium max-w-[120px]">{lead.leadWants}</td>
                  <td className="px-3 py-2.5">
                    <select
                      value={lead.status || 'NEW'}
                      onChange={e => statusMutation.mutate({ leadId: lead.leadId, status: e.target.value })}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer w-full ${getStatusBadge(lead.status || 'NEW')}`}
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {lead.sourceChannel && <Badge variant="outline" className="text-[10px] px-1.5">{lead.sourceChannel}</Badge>}
                    {lead.sourceBdaName && <div className="text-[10px] text-violet-600 mt-0.5">{lead.sourceBdaName}</div>}
                  </td>
                  <td className="px-3 py-2.5 min-w-[130px]">
                    {isAdmin ? (
                      <select
                        value={lead.assignedTo || ''}
                        onChange={e => assignMutation.mutate({ leadId: lead.leadId, assignedTo: e.target.value || null })}
                        className="text-xs border rounded-md px-2 py-1 bg-background w-full"
                      >
                        <option value="">Unassigned</option>
                        {members.map((m: any) => <option key={m.userId} value={m.userId}>{m.name || m.email}</option>)}
                      </select>
                    ) : <span className="text-xs text-muted-foreground">{lead.assignedToName || 'Unassigned'}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {lead.country || '—'}
                    {lead.city && <div className="text-[10px]">{lead.city}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    <div>{formatDate(lead.createdAt)}</div>
                    {lead.ownerName && <div className="text-[10px]">{lead.ownerName}</div>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                        <Link to={`/trackers/${id}/leads/${lead.leadId}/edit`}>Edit</Link>
                      </Button>
                      {isAdmin && (
                        <Button variant="destructive" size="sm" className="h-7 px-2 text-xs"
                          onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(lead.leadId); }}>
                          Del
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      ) : viewMode === 'active' ? (
        /* ── ACTIVE CALLS VIEW ──────────────────────────────────────────────── */
        <div className="space-y-3">
          {/* Active status toggles */}
          <div className="flex items-center gap-2 flex-wrap p-3 bg-muted/40 rounded-lg border">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" /> Show as active:
            </span>
            {statuses.map(s => {
              const cfg = statusConfig[s];
              const on = activeStatuses.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => setActiveStatuses(prev =>
                    on ? prev.filter(x => x !== s) : [...prev, s]
                  )}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    on ? `${cfg.header} border-current` : 'bg-background border-input text-muted-foreground'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${on ? cfg.dot : 'bg-muted-foreground'}`} />
                  {cfg.label}
                </button>
              );
            })}
            <span className="ml-auto text-xs text-muted-foreground font-medium">
              {activeLeads.length} active lead{activeLeads.length !== 1 ? 's' : ''}
            </span>
          </div>

          {activeLeads.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No active leads with selected statuses.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-10">#</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Lead</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Assigned To</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Wants</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Source</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 inline mr-1" />Age
                    </th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLeads.map((lead: any, idx: number) => {
                    const cfg = statusConfig[lead.status || 'NEW'] || { label: lead.status || 'NEW', dot: 'bg-gray-500', col: 'bg-gray-50 border-gray-200', header: 'bg-gray-100 text-gray-800' };
                    const daysOld = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000);
                    const ageColor = daysOld > 30 ? 'text-red-600 font-semibold' : daysOld > 14 ? 'text-amber-600 font-medium' : 'text-muted-foreground';
                    return (
                      <tr key={lead.leadId} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${idx % 2 !== 0 ? 'bg-muted/10' : ''}`}>
                        <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">
                          {lead.serialNumber ? `#${lead.serialNumber}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 max-w-[160px]">
                          <div className="flex items-center gap-1.5">
                            {lead.isDuplicate && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
                            <span className="font-medium truncate">{lead.leadName || '—'}</span>
                          </div>
                          {lead.country && <div className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5"/>{lead.country}</div>}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground max-w-[180px]">
                          {lead.leadEmail && <div className="flex items-center gap-1 text-xs truncate"><Mail className="w-3 h-3 shrink-0"/>{lead.leadEmail}</div>}
                          {lead.leadContact && (
                            <div className="flex items-center gap-1 flex-wrap mt-0.5">
                              <span className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3 shrink-0"/>{lead.leadContact}</span>
                              <a href={`tel:${lead.leadContact}`} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-medium"><Phone className="w-2.5 h-2.5"/>Call</a>
                              <a href={`https://wa.me/${lead.leadContact.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 text-[10px] font-medium"><MessageCircle className="w-2.5 h-2.5"/>WA</a>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            value={lead.status || 'NEW'}
                            onChange={e => statusMutation.mutate({ leadId: lead.leadId, status: e.target.value })}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer ${getStatusBadge(lead.status || 'NEW')}`}
                          >
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2.5 min-w-[130px]">
                          {isAdmin ? (
                            <select
                              value={lead.assignedTo || ''}
                              onChange={e => assignMutation.mutate({ leadId: lead.leadId, assignedTo: e.target.value || null })}
                              className="text-xs border rounded-md px-2 py-1 bg-background w-full"
                            >
                              <option value="">Unassigned</option>
                              {members.map((m: any) => <option key={m.userId} value={m.userId}>{m.name || m.email}</option>)}
                            </select>
                          ) : (
                            <span className={`text-xs ${lead.assignedToName ? 'text-indigo-600 font-medium' : 'text-muted-foreground'}`}>
                              {lead.assignedToName || 'Unassigned'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs font-medium">{lead.leadWants}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {lead.sourceChannel && <Badge variant="outline" className="text-[10px] px-1.5">{lead.sourceChannel}</Badge>}
                          {lead.sourceBdaName && <div className="text-[10px] text-violet-600 mt-0.5">{lead.sourceBdaName}</div>}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs ${ageColor}`}>
                            {daysOld === 0 ? 'Today' : `${daysOld}d`}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                              <Link to={`/trackers/${id}/leads/${lead.leadId}/edit`}>Edit</Link>
                            </Button>
                            {isAdmin && (
                              <Button variant="destructive" size="sm" className="h-7 px-2 text-xs"
                                onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(lead.leadId); }}>
                                Del
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      ) : (
        /* ── KANBAN VIEW ────────────────────────────────────────────────────── */
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
          {statuses.map((status) => {
            const cfg = statusConfig[status] || { label: status, dot: 'bg-gray-500', col: 'bg-gray-50 border-gray-200', header: 'bg-gray-100 text-gray-800' };
            const col = kanbanGroups[status] || [];
            return (
              <div key={status} className={`flex-shrink-0 w-64 rounded-xl border-2 ${cfg.col} flex flex-col`}>
                {/* Column header */}
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl ${cfg.header}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="font-semibold text-sm">{cfg.label}</span>
                  </div>
                  <span className="text-xs font-bold opacity-70">{col.length}</span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {col.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6 opacity-60">No leads</p>
                  ) : (
                    col.map((lead: any) => <MiniCard key={lead.leadId} lead={lead} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination (hidden in kanban/active) ────────────────────────────── */}
      {viewMode !== 'kanban' && viewMode !== 'active' && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage((filters.page||1)-1)} disabled={(filters.page||1)<=1}>Previous</Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - (filters.page||1)) <= 1)
              .reduce<(number|'...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i-1] as number) > 1) acc.push('...');
                acc.push(p); return acc;
              }, [])
              .map((p, i) =>
                p === '...'
                  ? <span key={`el-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
                  : <button key={p} onClick={() => setPage(p as number)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${(filters.page||1)===p ? 'bg-primary text-primary-foreground' : 'hover:bg-accent border border-input'}`}
                    >{p}</button>
              )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage((filters.page||1)+1)} disabled={(filters.page||1)>=pagination.totalPages}>Next</Button>
          <span className="text-xs text-muted-foreground ml-1">{pagination.total} total</span>
        </div>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <Dialog open={showActivity} onOpenChange={setShowActivity}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Activity Log</DialogTitle><DialogDescription>Recent actions in this tracker</DialogDescription></DialogHeader>
          {activities.length === 0 ? <p className="text-muted-foreground text-center py-4">No activity yet</p> : (
            <div className="space-y-2">
              {activities.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-1">
                    <span className="font-medium text-sm">{a.userName}</span>{' '}
                    <span className="text-sm text-muted-foreground">{activityLabel(a.action)}</span>
                    {a.details && (() => {
                      try {
                        const d = typeof a.details === 'string' ? JSON.parse(a.details) : a.details;
                        if (d.from && d.to) return <span className="text-xs text-muted-foreground"> ({d.from} → {d.to})</span>;
                        return null;
                      } catch { return null; }
                    })()}
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Members ({members.length})</DialogTitle><DialogDescription>Team members in this tracker</DialogDescription></DialogHeader>
          <div className="space-y-2">
            {members.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{m.name || m.email}</p>
                  <p className="text-xs text-muted-foreground">{m.email} · {displayRole(m.role)}</p>
                </div>
                <div className="flex gap-1">
                  {m.canAddLeads && <Badge variant="secondary" className="text-xs">Add</Badge>}
                  {m.canEditLeads && <Badge variant="secondary" className="text-xs">Edit</Badge>}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showInvite} onOpenChange={open => { setShowInvite(open); if (!open) { setInviteError(''); setInviteEmail(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Invite Team Member</DialogTitle><DialogDescription>Enter their email. If registered they'll be added immediately; otherwise on registration.</DialogDescription></DialogHeader>
          {inviteError && <Alert variant="destructive"><AlertDescription>{inviteError}</AlertDescription></Alert>}
          <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="member@example.com" />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowInvite(false); setInviteError(''); setInviteEmail(''); }}>Cancel</Button>
            <Button onClick={() => { if (inviteEmail) inviteMutation.mutate(inviteEmail); }} disabled={!inviteEmail || inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddOrgMember} onOpenChange={setShowAddOrgMember}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Add Organization Members</DialogTitle><DialogDescription>Add members from your organization to this tracker</DialogDescription></DialogHeader>
          {orgMembersLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : (orgMembersResponse?.data || []).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No available org members to add</p>
          ) : (
            <div className="space-y-2">
              {(orgMembersResponse?.data || []).map((m: any) => (
                <div key={m.userId} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addOrgMemberMutation.mutate(m.email)}
                    disabled={addOrgMemberMutation.isPending}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRequests} onOpenChange={setShowRequests}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Access Requests</DialogTitle><DialogDescription>Pending requests to join this tracker</DialogDescription></DialogHeader>
          {requests.length === 0 ? <p className="text-muted-foreground text-center py-4">No pending requests</p> : (
            <div className="space-y-2">
              {requests.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{r.email}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => respondMutation.mutate({ requestId: r.id, action: 'accept' })}>Accept</Button>
                    <Button variant="destructive" size="sm" onClick={() => respondMutation.mutate({ requestId: r.id, action: 'reject' })}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Tracker</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{tracker?.trackerName}</strong>? This will permanently remove all leads, members, and data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTrackerMutation.mutate()}
              disabled={deleteTrackerMutation.isPending}
            >
              {deleteTrackerMutation.isPending ? 'Deleting...' : 'Delete Tracker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tiny helper component for active filter chips
function Chip({ label, onRemove, amber }: { label: string; onRemove: () => void; amber?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
      amber ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
    }`}>
      {label}
      <button onClick={onRemove} className="hover:text-destructive"><X className="w-3 h-3" /></button>
    </span>
  );
}
