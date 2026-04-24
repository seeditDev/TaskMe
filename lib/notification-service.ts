import * as Notifications from "expo-notifications";
import { Reminder, ReminderType, Task, Note } from "./types";
import { settingsStorage } from "./storage";
import { notificationSound } from "./notification-sound";

// Type assertion for notification trigger to avoid TypeScript issues
type NotificationTrigger = any; // eslint-disable-line @typescript-eslint/no-explicit-any

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const settings = await settingsStorage.getSettings();
    return {
      shouldShowAlert: true,
      shouldPlaySound: settings.soundEnabled,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export const notificationService = {
  async initialize() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("Notification permissions not granted");
      }
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  },

  async scheduleReminder(
    reminder: Reminder,
    task?: Task,
    note?: Note
  ): Promise<string | null> {
    try {
      const title = task ? task.title : note?.title || "Reminder";
      const body = task?.description || note?.content?.substring(0, 100) || "You have a reminder";

      const triggerTime = new Date(reminder.reminderTime);
      const now = new Date();
      const secondsFromNow = Math.max(1, Math.floor((triggerTime.getTime() - now.getTime()) / 1000));

      if (secondsFromNow <= 0) {
        console.warn("Reminder time is in the past, triggering immediately");
        return await this.sendNotification(title, body, reminder.reminderType);
      }

      const settings = await settingsStorage.getSettings();
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: settings.soundEnabled ? "notification.mp3" : undefined,
          data: {
            reminderId: reminder.id,
            associatedId: reminder.associatedId,
            associatedType: reminder.associatedType,
            reminderType: reminder.reminderType,
          },
        },
        trigger: (secondsFromNow > 0 ? { seconds: secondsFromNow } : null) as NotificationTrigger,
      });

      return notificationId;
    } catch (error) {
      console.error("Error scheduling reminder:", error);
      return null;
    }
  },

  async sendNotification(
    title: string,
    body: string,
    type: ReminderType = ReminderType.NOTIFICATION
  ): Promise<string | null> {
    try {
      const settings = await settingsStorage.getSettings();
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: settings.soundEnabled ? (type === ReminderType.ALARM ? "default" : "notification.mp3") : undefined,
          badge: 1,
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error("Error sending notification:", error);
      return null;
    }
  },

  async cancelReminder(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error("Error canceling reminder:", error);
    }
  },

  async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error canceling all reminders:", error);
    }
  },

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error getting scheduled notifications:", error);
      return [];
    }
  },

  onNotificationReceived(
    callback: (notification: Notifications.Notification) => void
  ): () => void {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      // Play notification sound when received
      notificationSound.playNotificationSound();
      callback(notification);
    });
    return subscription.remove;
  },

  onNotificationResponse(
    callback: (response: Notifications.NotificationResponse) => void
  ): () => void {
    return Notifications.addNotificationResponseReceivedListener(callback).remove;
  },
};
