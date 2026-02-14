import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function displayRole(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'Admin',
    OWNER: 'Admin',
    BDA: 'Team Member',
    MEMBER: 'Member',
    VIEWER: 'Viewer',
  };
  return map[role] || role;
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-yellow-100 text-yellow-800',
    QUALIFIED: 'bg-purple-100 text-purple-800',
    CONVERTED: 'bg-green-100 text-green-800',
    LOST: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

export function activityLabel(action: string) {
  const map: Record<string, string> = {
    LEAD_ADDED: 'added a lead',
    LEAD_EDITED: 'edited a lead',
    LEAD_DELETED: 'deleted a lead',
    STATUS_CHANGED: 'changed status',
    LEAD_ASSIGNED: 'assigned a lead',
    MEMBER_ADDED: 'added a member',
    MEMBER_REMOVED: 'removed a member',
  };
  return map[action] || action;
}

export function getMonthName(month: number) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}
