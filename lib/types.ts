// Task Types
export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: number; // Timestamp in milliseconds
  dueTime?: number; // Timestamp in milliseconds (time component)
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  parentTaskId?: string; // For subtasks
  tags?: string[]; // Tag IDs
  reminderId?: string; // Associated reminder ID
}

// Note Types
export interface Note {
  id: string;
  title: string;
  content: string; // Can be rich text (Markdown or HTML string)
  folderId?: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  tags?: string[]; // Tag IDs
  reminderId?: string; // Associated reminder ID
}

// Tag Types
export interface Tag {
  id: string;
  name: string;
}

// Folder Types
export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

// Reminder Types
export enum ReminderType {
  NOTIFICATION = "NOTIFICATION",
  ALARM = "ALARM",
  VOICE = "VOICE",
}

export enum ReminderRepeatType {
  NONE = "NONE",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
  CUSTOM = "CUSTOM",
}

export enum ReminderAssociatedType {
  TASK = "TASK",
  NOTE = "NOTE",
}

export interface Reminder {
  id: string;
  associatedId: string; // Task or Note ID
  associatedType: ReminderAssociatedType;
  reminderTime: number; // Timestamp in milliseconds
  repeatType: ReminderRepeatType;
  reminderType: ReminderType;
  customVoiceNotePath?: string; // Local file path for custom voice notes
  isActive: boolean;
  createdAt: number;
}

// Attachment Types
export enum AttachmentFileType {
  IMAGE = "IMAGE",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  LINK = "LINK",
  OTHER = "OTHER",
}

export enum AttachmentAssociatedType {
  TASK = "TASK",
  NOTE = "NOTE",
}

export interface Attachment {
  id: string;
  associatedId: string; // Task or Note ID
  associatedType: AttachmentAssociatedType;
  filePath: string; // Local file path
  fileType: AttachmentFileType;
  fileName?: string;
  mimeType?: string;
  url?: string; // For link attachments
}

// User Profile
export interface UserProfile {
  name: string;
  dob: string;
  phoneNumber: string;
  email: string;
  isCompleted: boolean;
}

// App Settings
export interface AppSettings {
  theme: "light" | "dark" | "auto";
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  ttsVoice?: string;
  speechLanguage?: string;
  defaultReminderMinutesBefore: number; // e.g., 15 minutes before
  defaultReminderType: ReminderType;
  defaultReminderRepeat: ReminderRepeatType;
  notificationSound?: "notification1" | "notification2" | "device";
  userProfile?: UserProfile;
}

// Dashboard Data
export interface DashboardData {
  todaysTasks: Task[];
  upcomingTasks: Task[];
  completedTodayCount: number;
  recentNotes: Note[];
}
