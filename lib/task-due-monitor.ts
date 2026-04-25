// Task Due Monitor - Automatically schedules notifications for due tasks
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Task, TaskStatus } from "./types";
import { taskStorage, settingsStorage } from "./storage";
import { notificationSound } from './notification-sound';
import { historyService } from './history-service';
import { voiceService } from './voice-service';
import AsyncStorage from "@react-native-async-storage/async-storage";
const DUE_NOTIFICATIONS_KEY = "task_due_notifications";

interface DueNotification {
  taskId: string;
  notificationId: string;
  scheduledTime: number;
}

// Simple event emitter for React Native (no Node.js dependency)
class SimpleEventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

// Event emitter for UI updates
export const taskDueEvents = new SimpleEventEmitter();

class TaskDueMonitor {
  private isInitialized = false;
  private notificationReceivedListener: Notifications.Subscription | null = null;
  private notificationResponseListener: Notifications.Subscription | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("Notification permissions not granted for due tasks");
        return;
      }

      // Request storage permission for Android (for sounds)
      if (Platform.OS === "android") {
        const { StorageAccessFramework } = await import('expo-file-system');
      }

      // Set up Android notification channel with custom sound
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("task-due", {
          name: "Task Due Notifications",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 500, 500],
          lightColor: "#FF231F7C",
          sound: "notification1.mp3", // Use bundled sound file
        });
      }

      // Set up notification categories with action buttons (opensAppToForeground: false to prevent opening app)
      // Category for task due notifications
      await Notifications.setNotificationCategoryAsync("task-due-actions", [
        {
          identifier: "done",
          buttonTitle: "Done",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
            opensAppToForeground: false,
          },
        },
        {
          identifier: "remind_5min",
          buttonTitle: "Remind in 5 min",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
            opensAppToForeground: false,
          },
        },
      ]);

      // Category for reminder notifications (same buttons)
      await Notifications.setNotificationCategoryAsync("task-reminder-actions", [
        {
          identifier: "done",
          buttonTitle: "Done",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
            opensAppToForeground: false,
          },
        },
        {
          identifier: "remind_5min",
          buttonTitle: "Remind in 5 min",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
            opensAppToForeground: false,
          },
        },
      ]);

      // Listen for notification received
      if (!this.notificationReceivedListener) {
        this.notificationReceivedListener = Notifications.addNotificationReceivedListener(this.handleNotificationReceived);
      }
      
      // Listen for notification response (action button clicks)
      if (!this.notificationResponseListener) {
        this.notificationResponseListener = Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);
      }
      
      this.isInitialized = true;
      console.log("Task due monitor initialized");
    } catch (error) {
      console.error("Error initializing task due monitor:", error);
    }
  }

  // Schedule notification when task is due
  async scheduleDueNotification(task: Task): Promise<string | null> {
    try {
      if (!task.dueDate) return null;

      const settings = await settingsStorage.getSettings();
      if (!settings.notificationsEnabled) return null;

      // Cancel any existing due notification for this task
      await this.cancelDueNotification(task.id);

      // Calculate due time
      const dueTime = new Date(task.dueDate);
      if (task.dueTime) {
        const dueTimeDate = new Date(task.dueTime);
        dueTime.setHours(dueTimeDate.getHours(), dueTimeDate.getMinutes(), 0, 0);
      } else {
        // Default to 9 AM if no time specified
        dueTime.setHours(9, 0, 0, 0);
      }

      // Don't schedule if already past
      const now = new Date();
      if (dueTime <= now) return null;

      const secondsFromNow = Math.floor((dueTime.getTime() - now.getTime()) / 1000);

      // Schedule notification with custom sound and action buttons
      const channelId = Platform.OS === "android" ? "task-due" : undefined;
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Task Due!",
          body: `"${task.title}" is due now!`,
          data: {
            type: "task-due",
            taskId: task.id,
            taskTitle: task.title,
          },
          categoryIdentifier: "task-due-actions",
          // Use platform-specific sound - Android uses channel sound, iOS uses content sound
          sound: Platform.OS === "ios" ? "notification1.mp3" : undefined,
          ...(Platform.OS === "android" && channelId ? { channelId } : {}),
        },
        trigger: {
          type: "timeInterval",
          seconds: secondsFromNow,
        } as Notifications.TimeIntervalTriggerInput,
      });

      // Store notification actions for this task
      await this.setNotificationActions(task.id);

      // Store notification reference
      const dueNotifications = await this.getDueNotifications();
      dueNotifications[task.id] = {
        taskId: task.id,
        notificationId,
        scheduledTime: dueTime.getTime(),
      };
      await AsyncStorage.setItem(DUE_NOTIFICATIONS_KEY, JSON.stringify(dueNotifications));

      // Also schedule repeating reminder every 30 minutes after due time
      await this.scheduleRepeatingDueNotification(task, dueTime);

      // Schedule pre-reminder notification based on user settings (before due time)
      await this.schedulePreReminderNotification(task, dueTime, settings);

      console.log(`Scheduled due notification for task "${task.title}" at ${dueTime.toLocaleString()}`);
      return notificationId;
    } catch (error) {
      console.error("Error scheduling due notification:", error);
      return null;
    }
  }

  // Schedule pre-reminder notification before task is due (based on user settings)
  private async schedulePreReminderNotification(task: Task, dueTime: Date, settings: any): Promise<void> {
    try {
      // Get reminder minutes before from settings (default to 5 if not set)
      const minutesBefore = settings?.defaultReminderMinutesBefore || 5;
      
      // Calculate pre-reminder time
      const preReminderTime = new Date(dueTime.getTime() - minutesBefore * 60 * 1000);
      const now = new Date();
      
      // Don't schedule if pre-reminder time is in the past
      if (preReminderTime <= now) {
        console.log(`Pre-reminder time already passed for task "${task.title}"`);
        return;
      }

      const secondsFromNow = Math.floor((preReminderTime.getTime() - now.getTime()) / 1000);
      const channelId = Platform.OS === "android" ? "task-reminder" : undefined;

      // Schedule pre-reminder notification
      const preReminderId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Task Reminder",
          body: `"${task.title}" is due in ${minutesBefore} minute${minutesBefore !== 1 ? 's' : ''}!`,
          data: {
            type: "task-reminder",
            taskId: task.id,
            taskTitle: task.title,
            isPreReminder: true,
          },
          categoryIdentifier: "task-reminder-actions",
          sound: Platform.OS === "ios" ? "notification1.mp3" : undefined,
          ...(Platform.OS === "android" && channelId ? { channelId } : {}),
        },
        trigger: {
          type: "timeInterval",
          seconds: secondsFromNow,
        } as Notifications.TimeIntervalTriggerInput,
      });

      // Play voice feedback for the reminder if sound is enabled
      if (settings?.soundEnabled) {
        const voiceMessage = `${task.title} is due in ${minutesBefore} minute${minutesBefore !== 1 ? 's' : ''}`;
        await voiceService.speak(voiceMessage);
      }

      // Log the reminder set activity
      await historyService.logReminderSet(task.title, task.id, preReminderTime.getTime());

      console.log(`Scheduled pre-reminder for task "${task.title}" at ${preReminderTime.toLocaleString()} (${minutesBefore} mins before due)`);
    } catch (error) {
      console.error("Error scheduling pre-reminder notification:", error);
    }
  }

  // Schedule repeating notification every 30 minutes after task is due
  private async scheduleRepeatingDueNotification(task: Task, dueTime: Date): Promise<void> {
    try {
      const settings = await settingsStorage.getSettings();
      if (!settings.notificationsEnabled) return;

      const channelId = Platform.OS === "android" ? "task-due" : undefined;
      
      // Schedule repeating notification every 30 minutes (1800 seconds)
      // This will repeat 10 times (5 hours total)
      for (let i = 1; i <= 10; i++) {
        const repeatTime = new Date(dueTime.getTime() + i * 30 * 60 * 1000); // 30 min intervals
        const secondsFromDue = Math.floor((repeatTime.getTime() - Date.now()) / 1000);
        
        if (secondsFromDue > 0) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "⏰ Task Still Due!",
              body: `"${task.title}" is still due! (Reminder ${i})`,
              data: {
                type: "task-due-repeat",
                taskId: task.id,
                taskTitle: task.title,
                repeatCount: i,
              },
              categoryIdentifier: "task-due-actions",
              sound: Platform.OS === "ios" ? "notification1.mp3" : undefined,
              ...(Platform.OS === "android" && channelId ? { channelId } : {}),
            },
            trigger: {
              type: "timeInterval",
              seconds: secondsFromDue,
            } as Notifications.TimeIntervalTriggerInput,
          });
        }
      }
      console.log(`Scheduled 10 repeating reminders for "${task.title}" every 30 mins`);
    } catch (error) {
      console.error("Error scheduling repeating due notification:", error);
    }
  }

  // Cancel due notification for a task
  async cancelDueNotification(taskId: string): Promise<void> {
    try {
      const dueNotifications = await this.getDueNotifications();
      const notification = dueNotifications[taskId];
      
      if (notification) {
        await Notifications.cancelScheduledNotificationAsync(notification.notificationId);
        delete dueNotifications[taskId];
        await AsyncStorage.setItem(DUE_NOTIFICATIONS_KEY, JSON.stringify(dueNotifications));
        console.log(`Cancelled due notification for task ${taskId}`);
      }
    } catch (error) {
      console.error("Error cancelling due notification:", error);
    }
  }

  // Cancel ALL scheduled notifications for a task (due + repeating + reminders)
  async cancelAllNotificationsForTask(taskId: string): Promise<void> {
    try {
      // Cancel the main due notification
      await this.cancelDueNotification(taskId);
      
      // Get all scheduled notifications and cancel any that belong to this task
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        const data = notification.content.data;
        if (data?.taskId === taskId || data?.type?.includes(taskId)) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          console.log(`Cancelled notification ${notification.identifier} for task ${taskId}`);
        }
      }
      
      console.log(`Cancelled all notifications for task ${taskId}`);
    } catch (error) {
      console.error("Error cancelling all notifications for task:", error);
    }
  }

  // Update due notification when task changes
  async updateDueNotification(task: Task): Promise<void> {
    if (task.status === TaskStatus.COMPLETED) {
      // Cancel if task is completed
      await this.cancelDueNotification(task.id);
    } else if (task.dueDate) {
      // Reschedule with new due date
      await this.scheduleDueNotification(task);
    } else {
      // Cancel if no due date
      await this.cancelDueNotification(task.id);
    }
  }

  // Schedule notifications for all tasks with due dates
  async scheduleAllDueNotifications(): Promise<void> {
    try {
      const tasks = await taskStorage.getAllTasks();
      const activeTasks = tasks.filter(
        (t) => t.dueDate && t.status !== TaskStatus.COMPLETED
      );

      for (const task of activeTasks) {
        await this.scheduleDueNotification(task);
      }

      console.log(`Scheduled ${activeTasks.length} due notifications`);
    } catch (error) {
      console.error("Error scheduling all due notifications:", error);
    }
  }

  // Handle notification received - play custom sound and voice
  private handleNotificationReceived = async (notification: Notifications.Notification) => {
    const data = notification.request.content.data;
    const settings = await settingsStorage.getSettings();
    
    if (data?.type === "task-due") {
      console.log("Task due notification received - playing custom sound and voice");
      // Play the app's notification sound
      await notificationSound.playNotificationSound();
      
      // Play voice feedback if sound is enabled
      if (settings?.soundEnabled) {
        const taskTitle = data?.taskTitle as string || "Task";
        await voiceService.speak(`${taskTitle} is due now`);
      }
      
      // Log notification received
      await historyService.logNotificationReceived(data?.taskTitle as string || "Task", data?.taskId as string);
    } else if (data?.type === "task-reminder" && data?.isPreReminder) {
      console.log("Pre-reminder notification received - playing custom sound and voice");
      // Play the app's notification sound
      await notificationSound.playNotificationSound();
      
      // Play voice feedback if sound is enabled
      if (settings?.soundEnabled) {
        const taskTitle = data?.taskTitle as string || "Task";
        const minutesBefore = settings?.defaultReminderMinutesBefore || 5;
        await voiceService.speak(`${taskTitle} is due in ${minutesBefore} minute${minutesBefore !== 1 ? 's' : ''}`);
      }
      
      // Log notification received
      await historyService.logNotificationReceived(data?.taskTitle as string || "Task", data?.taskId as string);
    }
  };

  // Handle notification response (Done or Remind) - using arrow function to preserve 'this'
  private handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    const actionId = response.actionIdentifier;
    const notificationId = response.notification.request.identifier;
    
    // Dismiss the notification immediately when any action is clicked
    await Notifications.dismissNotificationAsync(notificationId);
    
    if (data?.type === "task-due" && data?.taskId) {
      const taskId = data.taskId as string;
      const taskTitle = data.taskTitle as string || "Task";
      
      // Import voice service for feedback
      const { voiceService } = await import('./voice-service');
      
      if (actionId === "done") {
        // Mark task as completed
        const tasks = await taskStorage.getAllTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          task.status = TaskStatus.COMPLETED;
          task.updatedAt = Date.now();
          await taskStorage.saveTask(task);
          
          // Cancel ALL notifications for this task (due + repeating + reminders)
          await this.cancelAllNotificationsForTask(taskId);
          
          // Log the activity
          await historyService.logNotificationActionDone(taskTitle, taskId);
          
          // Play voice feedback only once
          await voiceService.speak(`${taskTitle} completed`);
          console.log(`Task ${taskId} marked as done from notification - all notifications cancelled`);
          
          // Emit event to refresh UI with a small delay to ensure storage is complete
          setTimeout(() => {
            taskDueEvents.emit('taskUpdated', task);
            console.log(`[Notification] Emitted taskUpdated for ${taskId}`);
          }, 100);
        }
      } else if (actionId === "remind_5min") {
        // Reschedule for 5 minutes later
        const tasks = await taskStorage.getAllTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
          task.dueDate = fiveMinutesFromNow;
          task.updatedAt = Date.now();
          await taskStorage.saveTask(task);
          
          // Log the activity
          await historyService.logNotificationActionRemind(taskTitle, taskId);
          await historyService.logReminderRescheduled(taskTitle, taskId, fiveMinutesFromNow);
          
          // Emit event to refresh UI before scheduling new notification
          setTimeout(() => {
            taskDueEvents.emit('taskUpdated', task);
            console.log(`[Notification] Emitted taskUpdated for rescheduled ${taskId}`);
          }, 100);
          
          await this.scheduleDueNotification(task);
          
          // Play voice feedback only once
          await voiceService.speak(`Will remind ${taskTitle} in 5 minutes`);
          console.log(`Task ${taskId} rescheduled for 5 minutes`);
        }
      }
    }
  };

  // Store notification action handlers
  private async setNotificationActions(taskId: string): Promise<void> {
    // Actions are handled via notification response listener
  }


  // Get stored due notifications
  private async getDueNotifications(): Promise<Record<string, DueNotification>> {
    try {
      const data = await AsyncStorage.getItem(DUE_NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  // Check for overdue tasks and notify immediately
  async checkOverdueTasks(): Promise<void> {
    try {
      const tasks = await taskStorage.getAllTasks();
      const now = Date.now();
      
      const overdueTasks = tasks.filter(
        (t) => t.dueDate && t.dueDate < now && t.status !== TaskStatus.COMPLETED
      );

      for (const task of overdueTasks) {
        // Send immediate notification for overdue task
        await this.sendOverdueNotification(task);
      }
    } catch (error) {
      console.error("Error checking overdue tasks:", error);
    }
  }

  // Send immediate notification for overdue task
  private async sendOverdueNotification(task: Task): Promise<void> {
    try {
      const settings = await settingsStorage.getSettings();
      if (!settings.notificationsEnabled) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⚠️ Task Overdue!",
          body: `"${task.title}" was due and is now overdue!`,
          sound: settings.soundEnabled ? "default" : undefined,
          data: {
            type: "task-overdue",
            taskId: task.id,
            taskTitle: task.title,
          },
        },
        trigger: {
          type: "timeInterval",
          seconds: 1,
        } as Notifications.TimeIntervalTriggerInput,
      });

      // Play sound
      await notificationSound.playNotificationSound();
    } catch (error) {
      console.error("Error sending overdue notification:", error);
    }
  }
}

export const taskDueMonitor = new TaskDueMonitor();
