import { Reminder, ReminderRepeatType, Task, Note } from "./types";
import { notificationService } from "./notification-service";
import { voiceService } from "./voice-service";
import AsyncStorage from "@react-native-async-storage/async-storage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any;

const REMINDERS_STORAGE_KEY = "app_reminders_scheduled";

export const reminderManager = {
  // Schedule a reminder with optional repeat
  async scheduleReminder(
    reminder: Reminder,
    task?: Task,
    note?: Note
  ): Promise<void> {
    try {
      const notificationId = await notificationService.scheduleReminder(
        reminder,
        task,
        note
      );

      if (notificationId) {
        // Store the mapping of reminder ID to notification ID
        const scheduled = await this.getScheduledReminders();
        scheduled[reminder.id] = {
          notificationId,
          reminderId: reminder.id,
          scheduledTime: Date.now(),
        };
        await AsyncStorage.setItem(
          REMINDERS_STORAGE_KEY,
          JSON.stringify(scheduled)
        );
      }
    } catch (error) {
      console.error("Error scheduling reminder:", error);
    }
  },

  // Cancel a scheduled reminder
  async cancelReminder(reminderId: string): Promise<void> {
    try {
      const scheduled = await this.getScheduledReminders();
      const mapping = scheduled[reminderId];

      if (mapping) {
        await notificationService.cancelReminder(mapping.notificationId);
        delete scheduled[reminderId];
        await AsyncStorage.setItem(
          REMINDERS_STORAGE_KEY,
          JSON.stringify(scheduled)
        );
      }
    } catch (error) {
      console.error("Error canceling reminder:", error);
    }
  },

  // Get all scheduled reminders
  async getScheduledReminders(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Error getting scheduled reminders:", error);
      return {};
    }
  },

  // Handle reminder trigger (called when notification is received)
  async handleReminderTrigger(reminderId: string, reminderType: string): Promise<void> {
    try {
      // Play voice reminder if applicable
      if (reminderType === "voice") {
        await voiceService.speak("You have a reminder");
      }

      // Log the trigger event
      console.log(`Reminder ${reminderId} triggered with type: ${reminderType}`);
    } catch (error) {
      console.error("Error handling reminder trigger:", error);
    }
  },

  // Calculate next reminder time based on repeat settings
  calculateNextReminderTime(
    currentTime: number,
    repeatType: ReminderRepeatType
  ): number {
    const date = new Date(currentTime);

    switch (repeatType) {
      case ReminderRepeatType.DAILY:
        date.setDate(date.getDate() + 1);
        break;
      case ReminderRepeatType.WEEKLY:
        date.setDate(date.getDate() + 7);
        break;
      case ReminderRepeatType.MONTHLY:
        date.setMonth(date.getMonth() + 1);
        break;
      case ReminderRepeatType.YEARLY:
        date.setFullYear(date.getFullYear() + 1);
        break;
      case ReminderRepeatType.NONE:
      default:
        return 0; // No repeat
    }

    return date.getTime();
  },

  // Reschedule a reminder after it triggers (for repeating reminders)
  async rescheduleReminder(
    reminder: Reminder,
    task?: Task,
    note?: Note
  ): Promise<void> {
    try {
      const nextTime = this.calculateNextReminderTime(
        reminder.reminderTime,
        reminder.repeatType
      );

      if (nextTime > 0) {
        const updatedReminder: Reminder = {
          ...reminder,
          reminderTime: nextTime,
        };
        await this.scheduleReminder(updatedReminder, task, note);
      }
    } catch (error) {
      console.error("Error rescheduling reminder:", error);
    }
  },

  // Initialize reminder listeners
  initializeListeners(
    onReminderReceived: (reminderId: string, type: string) => void
  ): void {
    notificationService.onNotificationReceived((notification: any) => {
      const reminderId = notification.request.content.data?.reminderId as string | undefined;
      const reminderType = (notification.request.content.data?.reminderType as string) || "notification";

      if (reminderId) {
        onReminderReceived(reminderId, reminderType);
      }
    });
  },
};
