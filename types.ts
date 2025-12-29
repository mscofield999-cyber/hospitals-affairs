
export interface Visit {
  id: string;
  hospitalName: string;
  date: string;
  status: 'completed' | 'scheduled' | 'pending';
  notes?: string;
}

export interface KPI {
  name: string;
  target: number;
  current: number;
  unit: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  tasks: string[];
  visits: Visit[];
  kpis: KPI[];
  color: string;
  icon: string;
}

// --- Mahdar Platform Types ---

export type MeetingStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED';

export interface Attendee {
  id: string;
  name: string;
  title: string;
  type: 'INTERNAL' | 'EXTERNAL';
  isPresent: boolean;
  signature?: string; // Base64 DataURL
}

export interface MeetingDepartment {
  id?: number;
  name: string;
  defaultAttendees: Attendee[];
}

export interface SubDepartment {
  id?: number;
  name: string;
  parentDeptId: number; // Links to MeetingDepartment
  managerName: string;
}

export interface Hospital {
  id?: number;
  name: string;
  city: string;
}

export interface MeetingLocation {
  id?: number;
  name: string;
  capacity?: number;
  features?: string[];
}

export interface AgendaItem {
  id: string;
  title: string;
  presenter: string;
  duration: string; // e.g., "15 min"
}

export interface Decision {
  id: string;
  text: string;
  type: 'DECISION' | 'ACTION';
  assignee?: string;
  dueDate?: string;
}

export interface Meeting {
  id?: string; // Dexie uses optional id for auto-increment/uuid
  refNumber: string; // e.g., MTG-2024-001
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  department: string;
  status: MeetingStatus;
  attendees: Attendee[];
  agenda: AgendaItem[];
  decisions: Decision[];
  notes: string; // Raw notes or executive summary
  secretarySignature?: string; // Base64 DataURL
  chairmanSignature?: string; // Base64 DataURL
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  id?: number; // Singleton, usually id=1
  // Identity
  orgName: string;
  orgLogo?: string; // Base64
  
  // Appearance
  theme: 'default' | 'dark' | 'forest' | 'midnight' | 'corporate';
  font: 'Tajawal' | 'Cairo' | 'Inter' | 'IBM Plex Sans Arabic';
  displayMode: 'comfortable' | 'compact';
  enableAnimations: boolean;
  
  // Localization
  language: 'ar' | 'en';
  dateFormat: 'gregorian' | 'hijri';
  
  // System
  notificationsEnabled: boolean;
  autoSaveInterval: number; // in minutes
}
