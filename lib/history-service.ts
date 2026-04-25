import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "@taskme_activity_history";
const MAX_HISTORY_ITEMS = 100;

export type ActivityType = 
  | "task_created" 
  | "task_updated" 
  | "task_deleted" 
  | "task_completed" 
  | "task_started" 
  | "task_paused" 
  | "reminder_set" 
  | "reminder_triggered"
  | "reminder_rescheduled"
  | "note_created"
  | "note_updated"
  | "note_deleted"
  | "profile_updated"
  | "settings_changed"
  | "notification_sound_changed"
  | "theme_changed"
  | "data_exported"
  | "data_imported"
  | "notification_received"
  | "notification_action_done"
  | "notification_action_remind";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class HistoryService {
  async logActivity(
    type: ActivityType,
    title: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const history = await this.getHistory();
      const newItem: ActivityItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title,
        description,
        timestamp: Date.now(),
        metadata,
      };

      // Add to beginning, limit to MAX_HISTORY_ITEMS
      const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      console.log(`[History] Logged: ${type} - ${title}`);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }

  async getHistory(): Promise<ActivityItem[]> {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting history:", error);
      return [];
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  }

  // Helper methods for common activities
  async logTaskCreated(taskTitle: string, taskId: string): Promise<void> {
    await this.logActivity("task_created", "Task Created", taskTitle, { taskId });
  }

  async logTaskCompleted(taskTitle: string, taskId: string): Promise<void> {
    await this.logActivity("task_completed", "Task Completed", taskTitle, { taskId });
  }

  async logTaskStarted(taskTitle: string, taskId: string): Promise<void> {
    await this.logActivity("task_started", "Task Started", taskTitle, { taskId });
  }

  async logTaskPaused(taskTitle: string, taskId: string): Promise<void> {
    await this.logActivity("task_paused", "Task Paused", taskTitle, { taskId });
  }

  async logTaskUpdated(taskTitle: string, taskId: string, changes: string): Promise<void> {
    await this.logActivity("task_updated", "Task Updated", taskTitle, { taskId, changes });
  }

  async logTaskDeleted(taskTitle: string, taskId: string): Promise<void> {
    await this.logActivity("task_deleted", "Task Deleted", taskTitle, { taskId });
  }

  async logReminderSet(taskTitle: string, taskId: string, reminderTime: number): Promise<void> {
    await this.logActivity("reminder_set", "Reminder Set", taskTitle, { 
      taskId, 
      reminderTime,
      reminderTimeFormatted: new Date(reminderTime).toLocaleString() 
    });
  }

  async logReminderRescheduled(taskTitle: string, taskId: string, newTime: number): Promise<void> {
    await this.logActivity("reminder_rescheduled", "Reminder Rescheduled", taskTitle, { 
      taskId, 
      newTime,
      newTimeFormatted: new Date(newTime).toLocaleString() 
    });
  }

  async logNoteCreated(noteTitle: string, noteId: string): Promise<void> {
    await this.logActivity("note_created", "Note Created", noteTitle, { noteId });
  }

  async logNoteUpdated(noteTitle: string, noteId: string): Promise<void> {
    await this.logActivity("note_updated", "Note Updated", noteTitle, { noteId });
  }

  async logNoteDeleted(noteTitle: string, noteId: string): Promise<void> {
    await this.logActivity("note_deleted", "Note Deleted", noteTitle, { noteId });
  }

  async logProfileUpdated(changes: string): Promise<void> {
    await this.logActivity("profile_updated", "Profile Updated", changes);
  }

  async logSettingsChanged(settingName: string, oldValue: any, newValue: any): Promise<void> {
    await this.logActivity("settings_changed", "Settings Changed", `${settingName}: ${oldValue} → ${newValue}`, { 
      settingName, 
      oldValue, 
      newValue 
    });
  }

  async logNotificationSoundChanged(soundName: string): Promise<void> {
    await this.logActivity("notification_sound_changed", "Notification Sound Changed", soundName, { soundName });
  }

  async logThemeChanged(theme: string): Promise<void> {
    await this.logActivity("theme_changed", "Theme Changed", theme, { theme });
  }

  async logDataExported(): Promise<void> {
    await this.logActivity("data_exported", "Data Exported", "All app data exported");
  }

  async logDataImported(): Promise<void> {
    await this.logActivity("data_imported", "Data Imported", "All app data imported");
  }

  async logNotificationReceived(taskTitle: string, taskId: string): Promise<void> {
    await this.logActivity("notification_received", "Notification Received", taskTitle, { taskId });
  }

  async logNotificationActionDone(taskTitle: string, taskId: string): Promise<void> {
    await this.logActivity("notification_action_done", "Marked Done from Notification", taskTitle, { taskId });
  }

  async logNotificationActionRemind(taskTitle: string, taskId: string): Promise<void> {
    await this.logActivity("notification_action_remind", "Remind in 5 min from Notification", taskTitle, { taskId });
  }
}

export const historyService = new HistoryService();
