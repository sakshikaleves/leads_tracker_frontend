// User types
export interface User {
  userId: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    token: string;
  };
}

// Tracker types
export type TrackerMode = 'SINGULAR' | 'MULTI';
export type UserRole = 'ADMIN' | 'OWNER' | 'BDA' | 'MEMBER' | 'VIEWER';

export interface Tracker {
  trackerId: string;
  trackerName: string;
  businessName: string;
  trackerMode: TrackerMode;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  role?: UserRole;
  myRole?: UserRole;
  memberCount?: number;
  leadCount?: number;
}

export interface TrackerMember {
  id: number;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  canAddLeads: boolean;
  canEditLeads: boolean;
  createdAt: string;
}

export interface Invitation {
  id: number;
  email: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED';
  createdAt: string;
  invitedByName: string;
}

export interface AccessRequest {
  id: number;
  userId: string;
  email: string;
  phoneNumber: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

// Lead types
export type LeadType = 'NEW' | 'YELLOW';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
export type SourceChannel = 'LinkedIn' | 'Website' | 'Referral' | 'Cold Call' | 'Event' | 'Other';

export interface Lead {
  leadId: string;
  trackerId: string;
  serialNumber: number | null;
  leadName: string | null;
  leadEmail: string | null;
  leadContact: string | null;
  signupDate: string | null;
  assignedDate: string | null;
  sourceChannel: SourceChannel | null;
  sourceBdaId: string | null;
  sourceBdaName?: string | null;
  sourceBdaEmail?: string | null;
  isDuplicate: boolean;
  finalStatus: string | null;
  leadOwnerId: string;
  leadOwnerPhone: string | null;
  ownerEmail?: string;
  ownerName?: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  leadType: LeadType;
  status: LeadStatus;
  country: string;
  city: string | null;
  leadWants: string;
  description: string;
  notesForTeam: string | null;
  additionalDetails: string | null;
  createdAt: string;
  monthAdded: number;
  yearAdded: number;
  updatedAt: string;
}

export interface CallerInteraction {
  id: number;
  leadId: string;
  trackerId: string;
  callerId: string;
  callerName: string;
  callerEmail: string;
  callerOrder: number;
  status: string | null;
  profileLinkGiven: string | null;
  isProfileLocked: boolean;
  connectRequestSent: boolean;
  didUnfriend: boolean;
  referenceName: string | null;
  callDate: string | null;
  finalCallDate: string | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomStatus {
  id: number;
  trackerId: string;
  statusName: string;
  statusOrder: number;
  statusColor: string;
  statusType: 'ACTIVE' | 'SUCCESS' | 'FAILED' | 'NEUTRAL';
  createdAt: string;
  updatedAt: string;
}

export interface LeadWithInteractions extends Lead {
  callerInteractions: CallerInteraction[];
}

export interface LeadFilters {
  leadType?: LeadType;
  status?: LeadStatus;
  assignedTo?: string;
  sourceChannel?: SourceChannel;
  sourceBdaId?: string;
  duplicatesOnly?: boolean;
  month?: number;
  year?: number;
  country?: string;
  city?: string;
  leadWants?: string;
  ownerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Analytics types
export interface CallerStats {
  totalInteractions: number;
  leadsWithInteractions: number;
  totalLeadsInRange: number;
  avgCallersPerLead: number;
  leadsWithNoInteractions: number;
}

export interface ResponseTime {
  avgHours: number | null;
  formatted: string;
}

export interface MemberPerformanceItem {
  userId: string;
  name: string;
  email: string;
  leadsSourced: number;
  leadsAssigned: number;
}

export interface TrackerAnalytics {
  period: { startDate: string; endDate: string };
  totalLeads: number;
  duplicateCount: number;
  duplicateRate: number;
  conversionRate: number;
  byType: Record<LeadType, number>;
  byStatus: Record<string, number>;
  byWants: Array<{ leadWants: string; count: number }>;
  bySourceChannel: Array<{ sourceChannel: string; count: number }>;
  byCountry: Array<{ country: string; count: number }>;
  callerStats: CallerStats;
  responseTime: ResponseTime;
  memberPerformance: MemberPerformanceItem[];
  monthlyTrend: Array<{ monthAdded: number; yearAdded: number; count: number }>;
}

export interface MultiTrackerAnalytics {
  period: { startDate: string; endDate: string };
  trackersIncluded: number;
  totalLeads: number;
  duplicateCount: number;
  duplicateRate: number;
  conversionRate: number;
  perTracker: Array<{
    trackerId: string;
    trackerName: string;
    businessName: string;
    count: number;
  }>;
  byType: Record<LeadType, number>;
  byStatus: Record<string, number>;
  byWants: Array<{ leadWants: string; count: number }>;
  bySourceChannel: Array<{ sourceChannel: string; count: number }>;
  callerStats: CallerStats;
  responseTime: ResponseTime;
  memberPerformance: MemberPerformanceItem[];
}

// Team types
export interface MemberStat {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
}

export interface TeamDashboard {
  totalLeads: number;
  statusBreakdown: Array<{ status: LeadStatus; count: number }>;
  memberStats: MemberStat[];
  assignmentStats: Array<{ name: string; email: string; assignedLeads: number; converted: number }>;
}

export interface ActivityItem {
  id: number;
  action: string;
  details: string | null;
  createdAt: string;
  leadId: string | null;
  userName: string;
  userEmail: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
