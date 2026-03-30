import { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Shield, User, Users } from 'lucide-react';
import { orgApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Separator } from '../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export function OrgMembers() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ORG_ADMIN' | 'ORG_MEMBER'>('ORG_MEMBER');
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);
  const [addError, setAddError] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => orgApi.listMembers(orgId!),
    enabled: !!orgId,
  });

  const addMutation = useMutation({
    mutationFn: () => orgApi.addMember(orgId!, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      setShowAdd(false);
      setEmail('');
      setRole('ORG_MEMBER');
      setAddError('');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setAddError(err.response?.data?.message || 'Failed to add member');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: 'ORG_ADMIN' | 'ORG_MEMBER' }) =>
      orgApi.updateMember(orgId!, userId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => orgApi.removeMember(orgId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      setRemoveUserId(null);
    },
  });

  const org = data?.data?.org;
  const members = data?.data?.members || [];

  const content = (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isAdminRoute ? 'text-white' : 'text-foreground'}`}>
              {isLoading ? '...' : (org?.orgName || 'Organization')}
            </h1>
            <p className={`text-sm mt-0.5 ${isAdminRoute ? 'text-slate-400' : 'text-muted-foreground'}`}>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)} className={isAdminRoute ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}>
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>

        {/* Members List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className={`h-16 rounded-xl ${isAdminRoute ? 'bg-slate-800' : ''}`} />)}
          </div>
        ) : members.length === 0 ? (
          <div className={`border border-dashed rounded-xl py-14 text-center ${isAdminRoute ? 'border-slate-700' : 'border-border'}`}>
            <Users className={`w-12 h-12 mx-auto mb-4 ${isAdminRoute ? 'text-slate-600' : 'text-muted-foreground'}`} />
            <h3 className={`text-lg font-medium mb-1 ${isAdminRoute ? 'text-slate-300' : 'text-foreground'}`}>No members yet</h3>
            <p className={`text-sm ${isAdminRoute ? 'text-slate-500' : 'text-muted-foreground'}`}>Add the first member to this organization.</p>
          </div>
        ) : (
          <div className={`rounded-xl divide-y ${isAdminRoute ? 'bg-slate-800/60 border border-slate-700 divide-slate-700' : 'bg-card border border-border divide-border'}`}>
            {members.map((member) => (
              <div key={member.userId} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isAdminRoute ? 'bg-slate-700' : 'bg-muted'}`}>
                    <User className={`w-4 h-4 ${isAdminRoute ? 'text-slate-400' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isAdminRoute ? 'text-white' : 'text-foreground'}`}>{member.name}</p>
                    <p className={`text-xs truncate ${isAdminRoute ? 'text-slate-500' : 'text-muted-foreground'}`}>{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                    member.role === 'ORG_ADMIN'
                      ? 'bg-amber-500/20 text-amber-400'
                      : isAdminRoute ? 'bg-slate-600/50 text-slate-400' : 'bg-muted text-muted-foreground'
                  }`}>
                    {member.role === 'ORG_ADMIN' ? 'Admin' : 'Member'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs h-7 px-2 ${isAdminRoute ? 'text-slate-400 hover:text-white hover:bg-slate-700' : ''}`}
                    onClick={() => updateRoleMutation.mutate({
                      userId: member.userId,
                      newRole: member.role === 'ORG_ADMIN' ? 'ORG_MEMBER' : 'ORG_ADMIN',
                    })}
                    disabled={updateRoleMutation.isPending}
                  >
                    {member.role === 'ORG_ADMIN' ? 'Demote' : 'Promote'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${isAdminRoute ? 'text-slate-500 hover:text-red-400 hover:bg-slate-700' : 'text-muted-foreground hover:text-destructive'}`}
                    onClick={() => setRemoveUserId(member.userId)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); setAddError(''); }}>
        <DialogContent className={isAdminRoute ? 'sm:max-w-md bg-slate-800 border-slate-700 text-white' : 'sm:max-w-md'}>
          <DialogHeader>
            <DialogTitle className={isAdminRoute ? 'text-white' : ''}>Add Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {addError && <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{addError}</p>}
            <div>
              <Label className={isAdminRoute ? 'text-slate-300' : ''}>Email Address</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={isAdminRoute ? 'bg-slate-900 border-slate-600 text-white placeholder:text-slate-500' : ''}
              />
              <p className={`text-xs mt-1 ${isAdminRoute ? 'text-slate-500' : 'text-muted-foreground'}`}>
                If the user is not registered, an invitation will be sent.
              </p>
            </div>
            <div>
              <Label className={isAdminRoute ? 'text-slate-300' : ''}>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'ORG_ADMIN' | 'ORG_MEMBER')}>
                <SelectTrigger className={isAdminRoute ? 'bg-slate-900 border-slate-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={isAdminRoute ? 'bg-slate-800 border-slate-700' : ''}>
                  <SelectItem value="ORG_MEMBER">Member</SelectItem>
                  <SelectItem value="ORG_ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAdd(false)} className={isAdminRoute ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : ''}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!email || addMutation.isPending}
              className={isAdminRoute ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
            >
              {addMutation.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirm */}
      <AlertDialog open={!!removeUserId} onOpenChange={(open) => !open && setRemoveUserId(null)}>
        <AlertDialogContent className={isAdminRoute ? 'bg-slate-800 border-slate-700 text-white' : ''}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isAdminRoute ? 'text-white' : ''}>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription className={isAdminRoute ? 'text-slate-400' : ''}>
              They will lose access to all trackers in this organization (unless they have direct tracker membership).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isAdminRoute ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : ''}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => removeUserId && removeMutation.mutate(removeUserId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (!isAdminRoute) {
    return <div className="max-w-3xl mx-auto">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">Super Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">{user?.email}</span>
            <Separator orientation="vertical" className="h-5 bg-slate-700" />
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-slate-400 hover:text-white hover:bg-slate-700 text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Orgs
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">{content}</main>
    </div>
  );
}
