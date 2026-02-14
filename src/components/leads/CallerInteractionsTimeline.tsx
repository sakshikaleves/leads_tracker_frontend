import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { callerInteractionApi, customStatusApi, trackerApi } from '../../api';
import { formatDate } from '../../lib/utils';
import type { CallerInteraction, CustomStatus, TrackerMember } from '../../types';

interface Props {
  trackerId: string;
  leadId: string;
  isAdmin: boolean;
}

export function CallerInteractionsTimeline({ trackerId, leadId, isAdmin }: Props) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CallerInteraction | null>(null);

  const { data: interactionsResponse } = useQuery({
    queryKey: ['caller-interactions', trackerId, leadId],
    queryFn: () => callerInteractionApi.list(trackerId, leadId),
    enabled: expanded,
  });

  const { data: statusesResponse } = useQuery({
    queryKey: ['custom-statuses', trackerId],
    queryFn: () => customStatusApi.list(trackerId),
    enabled: expanded,
  });

  const { data: membersResponse } = useQuery({
    queryKey: ['members', trackerId],
    queryFn: () => trackerApi.getMembers(trackerId),
    enabled: expanded && showModal,
  });

  const interactions = interactionsResponse?.data || [];
  const customStatuses = statusesResponse?.data || [];
  const members = membersResponse?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (interactionId: number) => callerInteractionApi.delete(trackerId, leadId, interactionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caller-interactions', trackerId, leadId] }),
  });

  const statusTypeColor: Record<string, string> = {
    ACTIVE: 'bg-blue-100 text-blue-800',
    SUCCESS: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    NEUTRAL: 'bg-gray-100 text-gray-800',
  };

  const getStatusColor = (statusName: string | null) => {
    if (!statusName) return 'bg-gray-100 text-gray-800';
    const cs = customStatuses.find(s => s.statusName === statusName);
    return cs ? (statusTypeColor[cs.statusType] || 'bg-gray-100 text-gray-800') : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="mt-3 border-t pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <Phone className="w-4 h-4" />
        Caller Interactions {interactions.length > 0 && `(${interactions.length})`}
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {interactions.length === 0 ? (
            <p className="text-xs text-gray-400">No caller interactions yet</p>
          ) : (
            interactions.map((ci) => (
              <div key={ci.id} className="border rounded p-3 text-sm bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Caller {ci.callerOrder}: {ci.callerName}</span>
                      {ci.status && (
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(ci.status)}`}>
                          {ci.status}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {ci.callDate && <div>Call Date: {new Date(ci.callDate).toLocaleDateString()}</div>}
                      {ci.finalCallDate && <div>Final Call: {new Date(ci.finalCallDate).toLocaleDateString()}</div>}
                      {ci.profileLinkGiven && <div>Profile Link: {ci.profileLinkGiven}</div>}
                      {ci.isProfileLocked && <div>Profile Locked: Yes | Connect Request: {ci.connectRequestSent ? 'Sent' : 'No'}</div>}
                      {ci.didUnfriend && <div>Unfriended: Yes</div>}
                      {ci.referenceName && <div>Reference: {ci.referenceName}</div>}
                      {ci.comments && <div className="mt-1 text-gray-600">{ci.comments}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditing(ci); setShowModal(true); }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { if (confirm('Delete this interaction?')) deleteMutation.mutate(ci.id); }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Plus className="w-3 h-3" /> Add Interaction
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <InteractionModal
          trackerId={trackerId}
          leadId={leadId}
          interaction={editing}
          customStatuses={customStatuses}
          members={members}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function InteractionModal({
  trackerId, leadId, interaction, customStatuses, members, onClose,
}: {
  trackerId: string;
  leadId: string;
  interaction: CallerInteraction | null;
  customStatuses: CustomStatus[];
  members: TrackerMember[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    callerId: interaction?.callerId || '',
    status: interaction?.status || '',
    profileLinkGiven: interaction?.profileLinkGiven || '',
    isProfileLocked: interaction?.isProfileLocked || false,
    connectRequestSent: interaction?.connectRequestSent || false,
    didUnfriend: interaction?.didUnfriend || false,
    referenceName: interaction?.referenceName || '',
    callDate: interaction?.callDate ? interaction.callDate.split('T')[0] : '',
    finalCallDate: interaction?.finalCallDate ? interaction.finalCallDate.split('T')[0] : '',
    comments: interaction?.comments || '',
  });

  const createMutation = useMutation({
    mutationFn: () => callerInteractionApi.create(trackerId, leadId, {
      ...form,
      callerId: form.callerId || undefined,
      status: form.status || undefined,
      profileLinkGiven: form.profileLinkGiven || undefined,
      referenceName: form.referenceName || undefined,
      callDate: form.callDate || undefined,
      finalCallDate: form.finalCallDate || undefined,
      comments: form.comments || undefined,
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caller-interactions', trackerId, leadId] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => callerInteractionApi.update(trackerId, leadId, interaction!.id, {
      status: form.status || undefined,
      profileLinkGiven: form.profileLinkGiven || undefined,
      isProfileLocked: form.isProfileLocked,
      connectRequestSent: form.connectRequestSent,
      didUnfriend: form.didUnfriend,
      referenceName: form.referenceName || undefined,
      callDate: form.callDate || undefined,
      finalCallDate: form.finalCallDate || undefined,
      comments: form.comments || undefined,
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caller-interactions', trackerId, leadId] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interaction) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{interaction ? 'Edit' : 'Add'} Caller Interaction</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!interaction && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caller</label>
              <select
                value={form.callerId}
                onChange={(e) => setForm({ ...form, callerId: e.target.value })}
                className="input w-full"
              >
                <option value="">Select caller (defaults to you)</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.name || m.email}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="input w-full"
            >
              <option value="">Select status...</option>
              {customStatuses.map((s) => (
                <option key={s.id} value={s.statusName}>{s.statusName}</option>
              ))}
            </select>
            {customStatuses.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">No custom statuses configured. Go to Tracker Settings to add them.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Link Given</label>
            <input
              value={form.profileLinkGiven}
              onChange={(e) => setForm({ ...form, profileLinkGiven: e.target.value })}
              className="input w-full"
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isProfileLocked}
                onChange={(e) => setForm({ ...form, isProfileLocked: e.target.checked })}
                className="rounded"
              />
              Profile is locked
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.connectRequestSent}
                onChange={(e) => setForm({ ...form, connectRequestSent: e.target.checked })}
                className="rounded"
              />
              Connect request sent
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.didUnfriend}
                onChange={(e) => setForm({ ...form, didUnfriend: e.target.checked })}
                className="rounded"
              />
              Unfriended after connecting
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Name</label>
            <input
              value={form.referenceName}
              onChange={(e) => setForm({ ...form, referenceName: e.target.value })}
              className="input w-full"
              placeholder="Referral name..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Call Date</label>
              <input
                type="date"
                value={form.callDate}
                onChange={(e) => setForm({ ...form, callDate: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Final Call Date</label>
              <input
                type="date"
                value={form.finalCallDate}
                onChange={(e) => setForm({ ...form, finalCallDate: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
            <textarea
              value={form.comments}
              onChange={(e) => setForm({ ...form, comments: e.target.value })}
              className="input w-full min-h-16"
              placeholder="Notes from the call..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn btn-primary flex-1"
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : interaction ? 'Update' : 'Add Interaction'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
