// Backup and Export Service for offline-first productivity app
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  taskStorage,
  noteStorage,
  tagStorage,
  folderStorage,
  reminderStorage,
  attachmentStorage,
  settingsStorage,
} from "./storage";
import { Task, Note, Tag, Folder, Reminder, Attachment, AppSettings } from "./types";

export interface BackupData {
  version: string;
  exportedAt: number;
  tasks: Task[];
  notes: Note[];
  tags: Tag[];
  folders: Folder[];
  reminders: Reminder[];
  attachments: Attachment[];
  settings: AppSettings | null;
}

export const backupService = {
  async exportAllData(): Promise<BackupData> {
    const [
      tasks,
      notes,
      tags,
      folders,
      reminders,
      attachments,
      settings,
    ] = await Promise.all([
      taskStorage.getAllTasks(),
      noteStorage.getAllNotes(),
      tagStorage.getAllTags(),
      folderStorage.getAllFolders(),
      reminderStorage.getAllReminders(),
      attachmentStorage.getAllAttachments(),
      settingsStorage.getSettings(),
    ]);

    return {
      version: "1.0.0",
      exportedAt: Date.now(),
      tasks,
      notes,
      tags,
      folders,
      reminders,
      attachments,
      settings,
    };
  },

  async importAllData(data: BackupData): Promise<boolean> {
    try {
      // Validate backup version
      if (!data.version) {
        throw new Error("Invalid backup: missing version");
      }

      // Import all data
      await Promise.all([
        AsyncStorage.setItem("tasks", JSON.stringify(data.tasks)),
        AsyncStorage.setItem("notes", JSON.stringify(data.notes)),
        AsyncStorage.setItem("tags", JSON.stringify(data.tags)),
        AsyncStorage.setItem("folders", JSON.stringify(data.folders)),
        AsyncStorage.setItem("reminders", JSON.stringify(data.reminders)),
        AsyncStorage.setItem("attachments", JSON.stringify(data.attachments)),
        data.settings && AsyncStorage.setItem("settings", JSON.stringify(data.settings)),
      ]);

      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  },

  async exportToJSON(): Promise<string> {
    const data = await this.exportAllData();
    return JSON.stringify(data, null, 2);
  },

  async importFromJSON(jsonString: string): Promise<boolean> {
    try {
      const data: BackupData = JSON.parse(jsonString);
      return await this.importAllData(data);
    } catch (error) {
      console.error("Error parsing backup JSON:", error);
      return false;
    }
  },

  async clearAllData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem("tasks"),
      AsyncStorage.removeItem("notes"),
      AsyncStorage.removeItem("tags"),
      AsyncStorage.removeItem("folders"),
      AsyncStorage.removeItem("reminders"),
      AsyncStorage.removeItem("attachments"),
      AsyncStorage.removeItem("settings"),
    ]);
  },

  async getDataStats(): Promise<{
    tasks: number;
    notes: number;
    tags: number;
    folders: number;
    reminders: number;
    attachments: number;
    totalSize: string;
  }> {
    const [
      tasks,
      notes,
      tags,
      folders,
      reminders,
      attachments,
    ] = await Promise.all([
      taskStorage.getAllTasks(),
      noteStorage.getAllNotes(),
      tagStorage.getAllTags(),
      folderStorage.getAllFolders(),
      reminderStorage.getAllReminders(),
      attachmentStorage.getAllAttachments(),
    ]);

    // Calculate approximate size
    const allData = {
      tasks,
      notes,
      tags,
      folders,
      reminders,
      attachments,
    };
    const sizeInBytes = new Blob([JSON.stringify(allData)]).size;
    const totalSize =
      sizeInBytes < 1024
        ? `${sizeInBytes} B`
        : sizeInBytes < 1024 * 1024
        ? `${(sizeInBytes / 1024).toFixed(2)} KB`
        : `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;

    return {
      tasks: tasks.length,
      notes: notes.length,
      tags: tags.length,
      folders: folders.length,
      reminders: reminders.length,
      attachments: attachments.length,
      totalSize,
    };
  },
};
