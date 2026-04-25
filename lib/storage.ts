import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task, Note, Tag, Folder, Reminder, Attachment, AppSettings, TaskStatus, ReminderRepeatType, ReminderType } from "./types";

const STORAGE_KEYS = {
  TASKS: "tasks",
  NOTES: "notes",
  TAGS: "tags",
  FOLDERS: "folders",
  REMINDERS: "reminders",
  ATTACHMENTS: "attachments",
  SETTINGS: "settings",
};

// Task Storage
export const taskStorage = {
  async getAllTasks(): Promise<Task[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading tasks:", error);
      return [];
    }
  },

  async getTaskById(id: string): Promise<Task | null> {
    try {
      const tasks = await this.getAllTasks();
      return tasks.find((t) => t.id === id) || null;
    } catch (error) {
      console.error("Error reading task:", error);
      return null;
    }
  },

  async saveTask(task: Task): Promise<void> {
    try {
      const tasks = await this.getAllTasks();
      const index = tasks.findIndex((t) => t.id === task.id);
      if (index >= 0) {
        tasks[index] = task;
      } else {
        tasks.push(task);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error("Error saving task:", error);
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      const tasks = await this.getAllTasks();
      const filtered = tasks.filter((t) => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  },

  async getTodaysTasks(): Promise<Task[]> {
    try {
      const tasks = await this.getAllTasks();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return tasks.filter((t) => {
        if (t.status === TaskStatus.COMPLETED) return false;
        
        // If no due date, show it in today's tasks by default (newly created)
        if (!t.dueDate) return true;
        
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() <= today.getTime(); // Include overdue tasks too
      });
    } catch (error) {
      console.error("Error reading today's tasks:", error);
      return [];
    }
  },

  async getUpcomingTasks(): Promise<Task[]> {
    try {
      const tasks = await this.getAllTasks();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      return tasks
        .filter((t) => {
          if (t.status === TaskStatus.COMPLETED) return false;
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() >= tomorrow.getTime();
        })
        .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
    } catch (error) {
      console.error("Error reading upcoming tasks:", error);
      return [];
    }
  },

  async getCompletedTodayCount(): Promise<number> {
    try {
      const tasks = await this.getAllTasks();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return tasks.filter((t) => {
        if (t.status !== TaskStatus.COMPLETED) return false;
        const updatedDate = new Date(t.updatedAt);
        updatedDate.setHours(0, 0, 0, 0);
        return updatedDate.getTime() === today.getTime();
      }).length;
    } catch (error) {
      console.error("Error reading completed today count:", error);
      return 0;
    }
  },

  async getCompletedTodayTasks(): Promise<Task[]> {
    try {
      const tasks = await this.getAllTasks();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return tasks
        .filter((t) => {
          if (t.status !== TaskStatus.COMPLETED) return false;
          const updatedDate = new Date(t.updatedAt);
          updatedDate.setHours(0, 0, 0, 0);
          return updatedDate.getTime() === today.getTime();
        })
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch (error) {
      console.error("Error reading completed today tasks:", error);
      return [];
    }
  },

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    try {
      const tasks = await this.getAllTasks();
      return tasks.filter((t) => t.status === status);
    } catch (error) {
      console.error("Error reading tasks by status:", error);
      return [];
    }
  },
};

// Note Storage
export const noteStorage = {
  async getAllNotes(): Promise<Note[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading notes:", error);
      return [];
    }
  },

  async getNoteById(id: string): Promise<Note | null> {
    try {
      const notes = await this.getAllNotes();
      return notes.find((n) => n.id === id) || null;
    } catch (error) {
      console.error("Error reading note:", error);
      return null;
    }
  },

  async saveNote(note: Note): Promise<void> {
    try {
      const notes = await this.getAllNotes();
      const index = notes.findIndex((n) => n.id === note.id);
      if (index >= 0) {
        notes[index] = note;
      } else {
        notes.push(note);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (error) {
      console.error("Error saving note:", error);
    }
  },

  async deleteNote(id: string): Promise<void> {
    try {
      const notes = await this.getAllNotes();
      const filtered = notes.filter((n) => n.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  },

  async getRecentNotes(limit: number = 5): Promise<Note[]> {
    try {
      const notes = await this.getAllNotes();
      return notes
        .filter((n) => !n.isArchived)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, limit);
    } catch (error) {
      console.error("Error reading recent notes:", error);
      return [];
    }
  },
};

// Tag Storage
export const tagStorage = {
  async getAllTags(): Promise<Tag[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TAGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading tags:", error);
      return [];
    }
  },

  async saveTag(tag: Tag): Promise<void> {
    try {
      const tags = await this.getAllTags();
      const index = tags.findIndex((t) => t.id === tag.id);
      if (index >= 0) {
        tags[index] = tag;
      } else {
        tags.push(tag);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
    } catch (error) {
      console.error("Error saving tag:", error);
    }
  },

  async deleteTag(id: string): Promise<void> {
    try {
      const tags = await this.getAllTags();
      const filtered = tags.filter((t) => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  },
};

// Folder Storage
export const folderStorage = {
  async getAllFolders(): Promise<Folder[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FOLDERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading folders:", error);
      return [];
    }
  },

  async saveFolder(folder: Folder): Promise<void> {
    try {
      const folders = await this.getAllFolders();
      const index = folders.findIndex((f) => f.id === folder.id);
      if (index >= 0) {
        folders[index] = folder;
      } else {
        folders.push(folder);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    } catch (error) {
      console.error("Error saving folder:", error);
    }
  },

  async deleteFolder(id: string): Promise<void> {
    try {
      const folders = await this.getAllFolders();
      const filtered = folders.filter((f) => f.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  },
};

// Reminder Storage
export const reminderStorage = {
  async getAllReminders(): Promise<Reminder[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading reminders:", error);
      return [];
    }
  },

  async saveReminder(reminder: Reminder): Promise<void> {
    try {
      const reminders = await this.getAllReminders();
      const index = reminders.findIndex((r) => r.id === reminder.id);
      if (index >= 0) {
        reminders[index] = reminder;
      } else {
        reminders.push(reminder);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    } catch (error) {
      console.error("Error saving reminder:", error);
    }
  },

  async deleteReminder(id: string): Promise<void> {
    try {
      const reminders = await this.getAllReminders();
      const filtered = reminders.filter((r) => r.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error deleting reminder:", error);
    }
  },
};

// Attachment Storage
export const attachmentStorage = {
  async getAllAttachments(): Promise<Attachment[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ATTACHMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading attachments:", error);
      return [];
    }
  },

  async saveAttachment(attachment: Attachment): Promise<void> {
    try {
      const attachments = await this.getAllAttachments();
      const index = attachments.findIndex((a) => a.id === attachment.id);
      if (index >= 0) {
        attachments[index] = attachment;
      } else {
        attachments.push(attachment);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify(attachments));
    } catch (error) {
      console.error("Error saving attachment:", error);
    }
  },

  async deleteAttachment(id: string): Promise<void> {
    try {
      const attachments = await this.getAllAttachments();
      const filtered = attachments.filter((a) => a.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error deleting attachment:", error);
    }
  },
};

// Settings Storage
export const settingsStorage = {
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data
        ? JSON.parse(data)
        : {
            theme: "auto",
            notificationsEnabled: true,
            soundEnabled: true,
            vibrationEnabled: true,
            defaultReminderMinutesBefore: 15,
            defaultReminderType: ReminderType.NOTIFICATION,
            defaultReminderRepeat: ReminderRepeatType.NONE,
          };
    } catch (error) {
      console.error("Error reading settings:", error);
      return {
        theme: "auto",
        notificationsEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        defaultReminderMinutesBefore: 15,
        defaultReminderType: ReminderType.NOTIFICATION,
        defaultReminderRepeat: ReminderRepeatType.NONE,
      };
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  },
};
