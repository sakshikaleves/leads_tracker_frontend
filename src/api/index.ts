import axios from 'axios';
import type {
  AuthResponse,
  User,
  Tracker,
  TrackerMember,
  AccessRequest,
  Invitation,
  Lead,
  LeadFilters,
  LeadWithInteractions,
  CallerInteraction,
  CustomStatus,
  PaginatedResponse,
  TrackerAnalytics,
  MultiTrackerAnalytics,
  TeamDashboard,
  ActivityItem,
  ApiResponse,
  UserRole,
} from '../types';

const apiUrl = import.meta.env.VITE_API_URL || '/api';
console.log('API URL:', apiUrl);

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (name: string, email: string, password: string, phoneNumber?: string) => {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
      phoneNumber,
    });
    return data;
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  getMe: async () => {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data;
  },
};

// Tracker API
export const trackerApi = {
  list: async () => {
    const { data } = await api.get<ApiResponse<Tracker[]>>('/trackers');
    return data;
  },

  get: async (trackerId: string) => {
    const { data } = await api.get<ApiResponse<Tracker>>(`/trackers/${trackerId}`);
    return data;
  },

  create: async (tracker: { trackerName: string; businessName: string; trackerMode: string }) => {
    const { data } = await api.post<ApiResponse<Tracker>>('/trackers', tracker);
    return data;
  },

  update: async (trackerId: string, updates: Partial<Tracker>) => {
    const { data } = await api.put<ApiResponse<void>>(`/trackers/${trackerId}`, updates);
    return data;
  },

  duplicate: async (trackerId: string, newTrackerName?: string) => {
    const { data } = await api.post<ApiResponse<{ trackerId: string }>>(
      `/trackers/${trackerId}/duplicate`,
      { newTrackerName }
    );
    return data;
  },

  getMembers: async (trackerId: string) => {
    const { data } = await api.get<ApiResponse<TrackerMember[]>>(`/trackers/${trackerId}/members`);
    return data;
  },

  requestAccess: async (trackerId: string) => {
    const { data } = await api.post<ApiResponse<void>>(`/trackers/${trackerId}/request-access`);
    return data;
  },

  getAccessRequests: async (trackerId: string) => {
    const { data } = await api.get<ApiResponse<AccessRequest[]>>(`/trackers/${trackerId}/requests`);
    return data;
  },

  respondToRequest: async (
    requestId: number,
    action: 'accept' | 'reject',
    role?: UserRole,
    canAddLeads?: boolean,
    canEditLeads?: boolean
  ) => {
    const { data } = await api.put<ApiResponse<void>>(`/trackers/requests/${requestId}/respond`, {
      action,
      role,
      canAddLeads,
      canEditLeads,
    });
    return data;
  },

  inviteBDA: async (trackerId: string, email: string, role: string = 'BDA') => {
    const { data } = await api.post<ApiResponse<{ status: string }>>(`/trackers/${trackerId}/invite`, {
      email,
      role,
    });
    return data;
  },

  getInvitations: async (trackerId: string) => {
    const { data } = await api.get<ApiResponse<Invitation[]>>(`/trackers/${trackerId}/invitations`);
    return data;
  },

  cancelInvitation: async (trackerId: string, inviteId: number) => {
    const { data } = await api.delete<ApiResponse<void>>(`/trackers/${trackerId}/invite/${inviteId}`);
    return data;
  },
};

// Lead API
export const leadApi = {
  list: async (trackerId: string, filters?: LeadFilters) => {
    const { data } = await api.get<PaginatedResponse<Lead>>(`/trackers/${trackerId}/leads`, {
      params: filters,
    });
    return data;
  },

  get: async (trackerId: string, leadId: string) => {
    const { data } = await api.get<ApiResponse<Lead>>(`/trackers/${trackerId}/leads/${leadId}`);
    return data;
  },

  getFull: async (trackerId: string, leadId: string) => {
    const { data } = await api.get<ApiResponse<LeadWithInteractions>>(`/trackers/${trackerId}/leads/${leadId}/full`);
    return data;
  },

  checkDuplicate: async (trackerId: string, email?: string, name?: string) => {
    const { data } = await api.get<ApiResponse<{ isDuplicate: boolean; duplicates: Lead[] }>>(
      `/trackers/${trackerId}/leads/check-duplicate`,
      { params: { email, name } }
    );
    return data;
  },

  create: async (trackerId: string, lead: Partial<Lead>) => {
    const { data } = await api.post<ApiResponse<Lead & { isDuplicate?: boolean; duplicates?: Lead[] }>>(
      `/trackers/${trackerId}/leads`,
      lead
    );
    return data;
  },

  update: async (trackerId: string, leadId: string, updates: Partial<Lead>) => {
    const { data } = await api.put<ApiResponse<void>>(
      `/trackers/${trackerId}/leads/${leadId}`,
      updates
    );
    return data;
  },

  delete: async (trackerId: string, leadId: string) => {
    const { data } = await api.delete<ApiResponse<void>>(`/trackers/${trackerId}/leads/${leadId}`);
    return data;
  },

  changeStatus: async (trackerId: string, leadId: string, status: string) => {
    const { data } = await api.put<ApiResponse<void>>(
      `/trackers/${trackerId}/leads/${leadId}/status`,
      { status }
    );
    return data;
  },

  assign: async (trackerId: string, leadId: string, assignedTo: string | null) => {
    const { data } = await api.put<ApiResponse<void>>(
      `/trackers/${trackerId}/leads/${leadId}/assign`,
      { assignedTo }
    );
    return data;
  },
};

// Analytics API
export const analyticsApi = {
  getTrackerAnalytics: async (trackerId: string, startDate: string, endDate: string) => {
    const { data } = await api.get<ApiResponse<TrackerAnalytics>>(`/analytics/tracker/${trackerId}`, {
      params: { startDate, endDate },
    });
    return data;
  },

  getMultiTrackerAnalytics: async (trackerIds: string[], startDate: string, endDate: string) => {
    const { data } = await api.post<ApiResponse<MultiTrackerAnalytics>>('/analytics/multi', {
      trackerIds,
      startDate,
      endDate,
    });
    return data;
  },
};

// Team API
export const teamApi = {
  getDashboard: async (trackerId: string) => {
    const { data } = await api.get<ApiResponse<TeamDashboard>>(`/trackers/${trackerId}/team/dashboard`);
    return data;
  },

  getActivity: async (trackerId: string, page: number = 1) => {
    const { data } = await api.get<{ success: boolean; data: ActivityItem[]; pagination: { page: number; limit: number; total: number } }>(
      `/trackers/${trackerId}/team/activity`,
      { params: { page, limit: 30 } }
    );
    return data;
  },
};

// Caller Interaction API
export const callerInteractionApi = {
  list: async (trackerId: string, leadId: string) => {
    const { data } = await api.get<ApiResponse<CallerInteraction[]>>(
      `/trackers/${trackerId}/leads/${leadId}/caller-interactions`
    );
    return data;
  },

  create: async (trackerId: string, leadId: string, interaction: Partial<CallerInteraction>) => {
    const { data } = await api.post<ApiResponse<{ id: number; callerOrder: number }>>(
      `/trackers/${trackerId}/leads/${leadId}/caller-interactions`,
      interaction
    );
    return data;
  },

  update: async (trackerId: string, leadId: string, interactionId: number, updates: Partial<CallerInteraction>) => {
    const { data } = await api.put<ApiResponse<void>>(
      `/trackers/${trackerId}/leads/${leadId}/caller-interactions/${interactionId}`,
      updates
    );
    return data;
  },

  delete: async (trackerId: string, leadId: string, interactionId: number) => {
    const { data } = await api.delete<ApiResponse<void>>(
      `/trackers/${trackerId}/leads/${leadId}/caller-interactions/${interactionId}`
    );
    return data;
  },
};

// Custom Status API
export const customStatusApi = {
  list: async (trackerId: string) => {
    const { data } = await api.get<ApiResponse<CustomStatus[]>>(`/trackers/${trackerId}/custom-statuses`);
    return data;
  },

  create: async (trackerId: string, status: { statusName: string; statusColor?: string; statusType?: string }) => {
    const { data } = await api.post<ApiResponse<CustomStatus>>(`/trackers/${trackerId}/custom-statuses`, status);
    return data;
  },

  update: async (trackerId: string, statusId: number, updates: Partial<CustomStatus>) => {
    const { data } = await api.put<ApiResponse<void>>(`/trackers/${trackerId}/custom-statuses/${statusId}`, updates);
    return data;
  },

  delete: async (trackerId: string, statusId: number) => {
    const { data } = await api.delete<ApiResponse<void>>(`/trackers/${trackerId}/custom-statuses/${statusId}`);
    return data;
  },

  reorder: async (trackerId: string, statusIds: number[]) => {
    const { data } = await api.put<ApiResponse<void>>(`/trackers/${trackerId}/custom-statuses/reorder`, { statusIds });
    return data;
  },
};

export default api;
