import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Plus, Trash2, Users, FolderKanban, Shield, LogOut, ArrowLeft } from 'lucide-react';
import { adminApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Separator } from '../components/ui/separator';
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

export function AdminPanel() {
  const [showCreate, setShowCreate] = useState(false);
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-orgs'],
    queryFn: () => adminApi.listOrgs(),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createOrg(orgName, adminEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orgs'] });
      setShowCreate(false);
      setOrgName('');
      setAdminEmail('');
      setError('');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to create organization');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (orgId: string) => adminApi.deleteOrg(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orgs'] });
      setDeleteOrgId(null);
    },
  });

  // Access denied — not a super admin
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">You don't have super admin access.</p>
          <Button variant="outline" onClick={() => navigate('/')} className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
        </div>
      </div>
    );
  }

  const orgs = data?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Top Bar */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">Super Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">{user?.email}</span>
            <Separator orientation="vertical" className="h-5 bg-slate-700" />
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-slate-400 hover:text-white hover:bg-slate-700 text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to App
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Organizations</h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage organizations and assign admins. {orgs.length} org{orgs.length !== 1 ? 's' : ''} total.
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Organization
            </Button>
          </div>

          {/* Orgs Grid */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-xl bg-slate-800" />)}
            </div>
          ) : orgs.length === 0 ? (
            <div className="border border-dashed border-slate-700 rounded-xl py-16 text-center">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-1">No organizations yet</h3>
              <p className="text-slate-500 text-sm mb-6">Create your first organization to get started.</p>
              <Button onClick={() => setShowCreate(true)} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Organization
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {orgs.map((org) => (
                <div key={org.orgId} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">{org.orgName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          by {org.createdByName}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-slate-700"
                      onClick={() => setDeleteOrgId(org.orgId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {org.memberCount || 0} members
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FolderKanban className="w-3.5 h-3.5" />
                      {org.trackerCount || 0} trackers
                    </span>
                  </div>

                  <Button variant="outline" size="sm" asChild className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 text-xs">
                    <Link to={`/admin/orgs/${org.orgId}/members`}>
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      Manage Members
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Org Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); setError(''); }}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Create Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{error}</p>}
            <div>
              <Label className="text-slate-300">Organization Name</Label>
              <Input
                placeholder="e.g., Tresto"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-300">Org Admin Email</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500 mt-1">This user will be the org admin. They must already be registered.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!orgName || !adminEmail || createMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteOrgId} onOpenChange={(open) => !open && setDeleteOrgId(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Organization?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will remove the organization and all its members. Trackers will not be deleted but will lose their org association.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => deleteOrgId && deleteMutation.mutate(deleteOrgId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
