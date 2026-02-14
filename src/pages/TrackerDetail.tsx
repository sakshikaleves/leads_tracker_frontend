import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Filter, Users, Settings, ChevronLeft, UserPlus, Activity,
  Mail, Phone, AlertTriangle, MoreHorizontal,
} from 'lucide-react';
import { trackerApi, leadApi, teamApi } from '../api';
import { formatDate, displayRole, statusColor, activityLabel } from '../lib/utils';
import type { LeadFilters, LeadType, LeadStatus, SourceChannel } from '../types';
import { CallerInteractionsTimeline } from '../components/leads/CallerInteractionsTimeline';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';

export function TrackerDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LeadFilters>({ page: 1, limit: 10 });
  const [showFilters, setShowFilters] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [showActivity, setShowActivity] = useState(false);

  const { data: trackerResponse, isLoading: trackerLoading } = useQuery({
    queryKey: ['tracker', id],
    queryFn: () => trackerApi.get(id!),
    enabled: !!id,
  });

  const { data: leadsResponse, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', id, filters],
    queryFn: () => leadApi.list(id!, filters),
    enabled: !!id,
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
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => trackerApi.inviteBDA(id!, email),
    onSuccess: () => {
      setInviteEmail('');
      setInviteError('');
      setShowInvite(false);
      queryClient.invalidateQueries({ queryKey: ['members', id] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setInviteError(err.response?.data?.message || 'Failed to send invitation');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: string }) =>
      leadApi.changeStatus(id!, leadId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', id] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ leadId, assignedTo }: { leadId: string; assignedTo: string | null }) =>
      leadApi.assign(id!, leadId, assignedTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', id] });
    },
  });

  const { data: activityResponse } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => teamApi.getActivity(id!),
    enabled: !!id && showActivity,
  });

  const tracker = trackerResponse?.data;
  const leads = leadsResponse?.data || [];
  const pagination = leadsResponse?.pagination;
  const members = membersResponse?.data || [];
  const requests = requestsResponse?.data || [];
  const activities = activityResponse?.data || [];
  const isAdmin = tracker?.myRole === 'ADMIN' || tracker?.myRole === 'OWNER';
  const statuses: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];

  if (trackerLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!tracker) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground mb-4">Tracker not found</p>
        <Button variant="outline" asChild>
          <Link to="/trackers">Back to Trackers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <Link
          to="/trackers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Trackers
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{tracker.trackerName}</h1>
            <p className="text-muted-foreground text-sm">{tracker.businessName}</p>
            <div className="flex gap-2 mt-2">
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
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={`/trackers/${id}/team`}>
                      <Users className="w-4 h-4 mr-2" />
                      Team Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowActivity(true)}>
                    <Activity className="w-4 h-4 mr-2" />
                    Activity Log
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowMembers(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    Members
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowInvite(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Member
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowRequests(true)}>
                    <Mail className="w-4 h-4 mr-2" />
                    Access Requests
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/trackers/${id}/settings`}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button asChild>
              <Link to={`/trackers/${id}/leads/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {Object.keys(filters).filter(k => k !== 'page' && k !== 'limit' && (filters as any)[k]).length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {Object.keys(filters).filter(k => k !== 'page' && k !== 'limit' && (filters as any)[k]).length}
              </Badge>
            )}
          </button>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <select
                value={filters.leadType || ''}
                onChange={(e) => setFilters({ ...filters, leadType: e.target.value as LeadType || undefined, page: 1 })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Types</option>
                <option value="NEW">New</option>
                <option value="YELLOW">Yellow</option>
              </select>

              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as LeadStatus || undefined, page: 1 })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Statuses</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                value={filters.sourceChannel || ''}
                onChange={(e) => setFilters({ ...filters, sourceChannel: e.target.value as SourceChannel || undefined, page: 1 })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Sources</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Event">Event</option>
                <option value="Other">Other</option>
              </select>

              <Input
                placeholder="Country"
                value={filters.country || ''}
                onChange={(e) => setFilters({ ...filters, country: e.target.value || undefined, page: 1 })}
              />

              <Input
                placeholder="Search name, email, description..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined, page: 1 })}
                className="md:col-span-2"
              />

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.duplicatesOnly || false}
                    onChange={(e) => setFilters({ ...filters, duplicatesOnly: e.target.checked || undefined, page: 1 })}
                    className="rounded border-input"
                  />
                  Duplicates only
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ page: 1, limit: 10 })}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads List */}
      {leadsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No leads found. Add your first lead!</p>
            <Button asChild>
              <Link to={`/trackers/${id}/leads/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {leads.map((lead: any) => (
              <Card key={lead.leadId} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {lead.serialNumber && (
                          <span className="text-xs font-mono text-muted-foreground">#{lead.serialNumber}</span>
                        )}
                        {lead.leadName && (
                          <span className="font-semibold text-base">{lead.leadName}</span>
                        )}
                        <Badge variant={lead.leadType === 'NEW' ? 'default' : 'secondary'}>
                          {lead.leadType}
                        </Badge>
                        <select
                          value={lead.status || 'NEW'}
                          onChange={(e) => statusMutation.mutate({ leadId: lead.leadId, status: e.target.value })}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer ${statusColor(lead.status || 'NEW')}`}
                        >
                          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {lead.isDuplicate && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Duplicate
                          </Badge>
                        )}
                      </div>

                      {/* Contact info */}
                      {(lead.leadEmail || lead.leadContact) && (
                        <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                          {lead.leadEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" /> {lead.leadEmail}
                            </span>
                          )}
                          {lead.leadContact && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" /> {lead.leadContact}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Source & Location */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-muted-foreground text-sm">
                          {lead.country}{lead.city && `, ${lead.city}`}
                        </span>
                        {lead.sourceChannel && (
                          <Badge variant="outline" className="text-xs">{lead.sourceChannel}</Badge>
                        )}
                        {lead.sourceBdaName && (
                          <Badge variant="outline" className="text-xs text-violet-700 border-violet-200 bg-violet-50">
                            Sourced: {lead.sourceBdaName}
                          </Badge>
                        )}
                        {lead.assignedToName && (
                          <Badge variant="outline" className="text-xs text-indigo-700 border-indigo-200 bg-indigo-50">
                            Assigned: {lead.assignedToName}
                          </Badge>
                        )}
                      </div>

                      {/* Wants & Description */}
                      <p className="text-sm font-medium mb-1">Wants: {lead.leadWants}</p>
                      <p className="text-sm text-muted-foreground">{lead.description}</p>
                      {lead.notesForTeam && (
                        <p className="text-sm text-muted-foreground mt-1 italic">Notes: {lead.notesForTeam}</p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          Added by {lead.ownerName || 'Unknown'} ({lead.ownerEmail}) on {formatDate(lead.createdAt)}
                        </span>
                        {isAdmin && (
                          <select
                            value={lead.assignedTo || ''}
                            onChange={(e) => assignMutation.mutate({ leadId: lead.leadId, assignedTo: e.target.value || null })}
                            className="text-xs border rounded-md px-2 py-1 bg-background"
                          >
                            <option value="">Unassigned</option>
                            {members.map((m: any) => (
                              <option key={m.userId} value={m.userId}>{m.name || m.email}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Caller Interactions */}
                      <CallerInteractionsTimeline
                        trackerId={id!}
                        leadId={lead.leadId}
                        isAdmin={isAdmin}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/trackers/${id}/leads/${lead.leadId}/edit`}>Edit</Link>
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this lead?')) {
                              deleteMutation.mutate(lead.leadId);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                disabled={(filters.page || 1) <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Page {filters.page || 1} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                disabled={(filters.page || 1) >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Activity Log Dialog */}
      <Dialog open={showActivity} onOpenChange={setShowActivity}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Activity Log</DialogTitle>
            <DialogDescription>Recent actions in this tracker</DialogDescription>
          </DialogHeader>
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No activity yet</p>
          ) : (
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
                        if (d.assignedTo) return <span className="text-xs text-muted-foreground"> to {d.assignedTo}</span>;
                        if (d.leadWants) return <span className="text-xs text-muted-foreground"> - {d.leadWants}</span>;
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

      {/* Members Dialog */}
      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Members ({members.length})</DialogTitle>
            <DialogDescription>Team members in this tracker</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {members.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{member.name || member.email}</p>
                  <p className="text-xs text-muted-foreground">{member.email} - {displayRole(member.role)}</p>
                </div>
                <div className="flex gap-1">
                  {member.canAddLeads && <Badge variant="secondary" className="text-xs">Add</Badge>}
                  {member.canEditLeads && <Badge variant="secondary" className="text-xs">Edit</Badge>}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={showInvite} onOpenChange={(open) => { setShowInvite(open); if (!open) { setInviteError(''); setInviteEmail(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Enter their email address. If they're already registered, they'll be added immediately.
              Otherwise, they'll be added when they register.
            </DialogDescription>
          </DialogHeader>
          {inviteError && (
            <Alert variant="destructive">
              <AlertDescription>{inviteError}</AlertDescription>
            </Alert>
          )}
          <Input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="member@example.com"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowInvite(false); setInviteError(''); setInviteEmail(''); }}>
              Cancel
            </Button>
            <Button
              onClick={() => { if (inviteEmail) inviteMutation.mutate(inviteEmail); }}
              disabled={!inviteEmail || inviteMutation.isPending}
            >
              {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Requests Dialog */}
      <Dialog open={showRequests} onOpenChange={setShowRequests}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Access Requests</DialogTitle>
            <DialogDescription>Pending requests to join this tracker</DialogDescription>
          </DialogHeader>
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {requests.map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{request.email}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respondMutation.mutate({ requestId: request.id, action: 'accept' })}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => respondMutation.mutate({ requestId: request.id, action: 'reject' })}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
