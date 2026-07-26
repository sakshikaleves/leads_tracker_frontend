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

// Map color name (from custom status) to Tailwind badge classes
export function colorToBadge(color: string) {
  const map: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
    orange: 'bg-orange-100 text-orange-800',
    pink: 'bg-pink-100 text-pink-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    teal: 'bg-teal-100 text-teal-800',
  };
  return map[color] || 'bg-gray-100 text-gray-800';
}

// Map color name to dot/indicator classes
export function colorToDot(color: string) {
  const map: Record<string, string> = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    teal: 'bg-teal-500',
  };
  return map[color] || 'bg-gray-500';
}

// Map color name to kanban column classes
export function colorToCol(color: string) {
  const map: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    gray: 'bg-gray-50 border-gray-200',
    orange: 'bg-orange-50 border-orange-200',
    pink: 'bg-pink-50 border-pink-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    teal: 'bg-teal-50 border-teal-200',
  };
  return map[color] || 'bg-gray-50 border-gray-200';
}

// Map color name to kanban header classes
export function colorToHeader(color: string) {
  const map: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
    orange: 'bg-orange-100 text-orange-800',
    pink: 'bg-pink-100 text-pink-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    teal: 'bg-teal-100 text-teal-800',
  };
  return map[color] || 'bg-gray-100 text-gray-800';
}

export function getMonthName(month: number) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}
