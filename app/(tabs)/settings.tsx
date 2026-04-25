import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { useAppUpdate } from "@/hooks/use-app-update";
import { AppSettings, ReminderType, TaskStatus } from "@/lib/types";
import { taskStorage, noteStorage } from "@/lib/storage";
import { useState, useEffect } from "react";
import { backupService } from "@/lib/backup-service";
import { notificationSound, NotificationSoundType } from "@/lib/notification-sound";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { voiceService } from "@/lib/voice-service";
import { historyService, ActivityItem } from "@/lib/history-service";
import * as Sharing from "expo-sharing";
import { shareApp as shareViaUpdateManager } from "@/lib/update-manager";

type MoreView = 'menu' | 'history' | 'settings' | 'help' | 'about' | 'privacy' | 'terms';

export default function MoreScreen() {
  const { state, updateSettings } = useApp();
  const colors = useColors();
  const { settings } = state;
  
  // App update hook (Android only)
  const { 
    currentVersion, 
    isChecking: isCheckingUpdate, 
    checkForUpdate 
  } = useAppUpdate();
  const [currentView, setCurrentView] = useState<MoreView>('menu');
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(settings);
  const [stats, setStats] = useState({
    tasks: 0,
    notes: 0,
    tags: 0,
    folders: 0,
    reminders: 0,
    attachments: 0,
    totalSize: "0 B",
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDob, setEditDob] = useState<Date>(new Date());
  const [showDobPicker, setShowDobPicker] = useState(false);
  
  // History state
  const [activityHistory, setActivityHistory] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      if (settings.userProfile) {
        setEditName(settings.userProfile.name);
        setEditEmail(settings.userProfile.email);
        setEditPhone(settings.userProfile.phoneNumber);
        setEditDob(settings.userProfile.dob ? new Date(settings.userProfile.dob) : new Date());
      }
    }
    loadStats();
  }, [settings]);

  const loadStats = async () => {
    const dataStats = await backupService.getDataStats();
    setStats(dataStats);
  };

  const loadHistory = async () => {
    const history = await historyService.getHistory();
    setActivityHistory(history);
  };

  const handleShareApp = async () => {
    try {
      // Try native update manager first (Android only, includes GitHub URL)
      if (Platform.OS === 'android') {
        const shared = await shareViaUpdateManager();
        if (shared) {
          await historyService.logActivity(
            'share_app',
            'Shared App',
            'User shared TaskMe app via native share'
          );
          return;
        }
      }
      
      // Fallback to expo-sharing
      await Sharing.shareAsync('https://seedit.site/taskme', {
        dialogTitle: 'Share TaskMe with friends',
      });
      
      await historyService.logActivity(
        'share_app',
        'Shared App',
        'User shared TaskMe app'
      );
    } catch (error) {
      console.log('Share cancelled or error:', error);
    }
  };

  const handleToggleSetting = async (key: keyof AppSettings, value: any) => {
    if (!localSettings) return;
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    await updateSettings(updated);

    // Log settings changes
    if (key === "soundEnabled") {
      await historyService.logSettingsChanged("Sound", !value ? "on" : "off", value ? "on" : "off");
      const message = value ? "Sound enabled" : "Sound disabled";
      voiceService.speak(message);
    }
    
    if (key === "notificationsEnabled") {
      await historyService.logSettingsChanged("Notifications", !value ? "on" : "off", value ? "on" : "off");
    }
    
    if (key === "notificationSound") {
      await historyService.logNotificationSoundChanged(value as string);
    }
    
    // Play test sound when enabling notifications
    if (key === "notificationsEnabled" && value) {
      notificationSound.playTestSound(localSettings.notificationSound || 'notification1');
    }
    
    // Play test sound when selecting a notification sound (if notifications are enabled)
    if (key === "notificationSound" && localSettings.notificationsEnabled) {
      notificationSound.playTestSound(value as NotificationSoundType);
    }
  };

  const handleSaveProfile = async () => {
    if (!localSettings) return;
    
    const updatedProfile = {
      ...localSettings.userProfile,
      name: editName,
      email: editEmail,
      phoneNumber: editPhone,
      dob: editDob.toISOString().split('T')[0],
      isCompleted: true,
    };

    const updatedSettings = {
      ...localSettings,
      userProfile: updatedProfile,
    };

    setLocalSettings(updatedSettings);
    await updateSettings(updatedSettings);
    await historyService.logProfileUpdated(`Name: ${editName}, Email: ${editEmail}`);
    setIsEditingProfile(false);
    Alert.alert("Success", "Profile updated successfully");
  };

  const onDobChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDobPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEditDob(selectedDate);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const json = await backupService.exportToJSON();
      await historyService.logDataExported();
      Alert.alert(
        "Export Successful",
        `Data exported successfully!\n\nSize: ${stats.totalSize}\nItems: ${stats.tasks + stats.notes} total`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Export Failed", "Failed to export data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      Alert.alert("Error", "Please paste backup data to import");
      return;
    }

    try {
      setIsLoading(true);
      const success = await backupService.importFromJSON(importData.trim());
      if (success) {
        await historyService.logDataImported();
        Alert.alert(
          "Import Successful",
          "Data imported successfully! Please restart the app to see changes.",
          [{ text: "OK", onPress: () => setShowImportModal(false) }]
        );
        setImportData("");
        loadStats();
      } else {
        Alert.alert("Import Failed", "Failed to import data. Please check the backup format.");
      }
    } catch (error) {
      Alert.alert("Import Failed", "Invalid backup data format.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to delete all data? This cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await backupService.clearAllData();
            Alert.alert("Data Cleared", "All data has been deleted.");
            loadStats();
          },
        },
      ]
    );
  };

  if (!localSettings) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground text-lg">Loading...</Text>
      </ScreenContainer>
    );
  }

  const profile = localSettings.userProfile;

  // Menu View
  const renderMenu = () => (
    <View className="space-y-3">
      <Text className="text-2xl font-bold text-foreground mb-4">More</Text>
      
      {/* History Option */}
      <TouchableOpacity 
        onPress={() => { setCurrentView('history'); loadHistory(); }}
        className="bg-surface rounded-lg p-4 border border-border flex-row items-center"
      >
        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
          <Ionicons name="time-outline" size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">History</Text>
          <Text className="text-xs text-muted">View all your activities</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </TouchableOpacity>

      {/* Settings Option */}
      <TouchableOpacity 
        onPress={() => setCurrentView('settings')}
        className="bg-surface rounded-lg p-4 border border-border flex-row items-center"
      >
        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
          <Ionicons name="settings-outline" size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">Settings</Text>
          <Text className="text-xs text-muted">App preferences & defaults</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </TouchableOpacity>

      {/* Help Option */}
      <TouchableOpacity 
        onPress={() => setCurrentView('help')}
        className="bg-surface rounded-lg p-4 border border-border flex-row items-center"
      >
        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
          <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">Help & FAQ</Text>
          <Text className="text-xs text-muted">Get help using TaskMe</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </TouchableOpacity>

      {/* About Option */}
      <TouchableOpacity 
        onPress={() => setCurrentView('about')}
        className="bg-surface rounded-lg p-4 border border-border flex-row items-center"
      >
        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">About</Text>
          <Text className="text-xs text-muted">App info & developer</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </TouchableOpacity>

      {/* Check for Updates Option */}
      <TouchableOpacity 
        onPress={() => { checkForUpdate(); }}
        disabled={isCheckingUpdate}
        className="bg-surface rounded-lg p-4 border border-border flex-row items-center"
      >
        <View className="w-10 h-10 rounded-full bg-success/10 items-center justify-center mr-3">
          <Ionicons name="refresh-circle-outline" size={20} color={colors.success} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">
            {isCheckingUpdate ? 'Checking...' : 'Check for Updates'}
          </Text>
          <Text className="text-xs text-muted">
            {currentVersion ? `Current: v${currentVersion.versionName}` : 'Get latest version'}
          </Text>
        </View>
        {isCheckingUpdate ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        )}
      </TouchableOpacity>

      {/* Privacy Policy Option */}
      <TouchableOpacity 
        onPress={() => setCurrentView('privacy')}
        className="bg-surface rounded-lg p-4 border border-border flex-row items-center"
      >
        <View className="w-10 h-10 rounded-full bg-warning/10 items-center justify-center mr-3">
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.warning} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">Privacy Policy</Text>
          <Text className="text-xs text-muted">How we handle your data</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </TouchableOpacity>

      {/* Terms of Service Option */}
      <TouchableOpacity 
        onPress={() => setCurrentView('terms')}
        className="bg-surface rounded-lg p-4 border border-border flex-row items-center"
      >
        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">Terms of Service</Text>
          <Text className="text-xs text-muted">Usage terms and conditions</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </TouchableOpacity>

      {/* Rate App */}
      <TouchableOpacity 
        onPress={() => Linking.openURL('market://details?id=com.seedites.taskme')}
        className="bg-surface rounded-lg p-4 border border-border flex-row items-center"
      >
        <View className="w-10 h-10 rounded-full bg-success/10 items-center justify-center mr-3">
          <Ionicons name="star-outline" size={20} color={colors.success} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">Rate App</Text>
          <Text className="text-xs text-muted">Rate us on Play Store</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </TouchableOpacity>

      {/* Share App */}
      <TouchableOpacity 
        onPress={handleShareApp}
        className="bg-surface rounded-lg p-4 border border-border flex-row items-center"
      >
        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
          <Ionicons name="share-outline" size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">Share App</Text>
          <Text className="text-xs text-muted">Share with friends</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </TouchableOpacity>

      {/* Quick Stats */}
      <View className="bg-surface rounded-lg p-4 border border-border mt-4">
        <Text className="text-sm font-semibold text-foreground mb-3">Quick Stats</Text>
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-xl font-bold text-primary">{stats.tasks}</Text>
            <Text className="text-xs text-muted">Tasks</Text>
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold text-primary">{stats.notes}</Text>
            <Text className="text-xs text-muted">Notes</Text>
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold text-primary">{stats.reminders}</Text>
            <Text className="text-xs text-muted">Reminders</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // History View
  const renderHistory = () => (
    <View className="flex-1">
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => setCurrentView('menu')} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">History</Text>
      </View>
      
      <ScrollView className="flex-1">
        {activityHistory.length === 0 ? (
          <Text className="text-muted text-center py-8">No activity yet</Text>
        ) : (
          activityHistory.map((item) => (
            <View key={item.id} className="bg-surface rounded-lg p-3 border border-border mb-2">
              <View className="flex-row items-center mb-1">
                <View className={`w-2 h-2 rounded-full mr-2 ${
                  item.type.includes('task') ? 'bg-primary' : 
                  item.type.includes('note') ? 'bg-warning' : 
                  item.type.includes('notification') ? 'bg-primary' :
                  item.type.includes('profile') ? 'bg-success' :
                  item.type.includes('settings') ? 'bg-warning' : 'bg-muted'
                }`} />
                <Text className="text-foreground font-medium">{item.title}</Text>
              </View>
              <Text className="text-sm text-muted ml-4">{item.description}</Text>
              <Text className="text-xs text-muted mt-1 ml-4">{new Date(item.timestamp).toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  // Help View
  const renderHelp = () => (
    <View className="flex-1">
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => setCurrentView('menu')} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">Help & FAQ</Text>
      </View>
      
      <ScrollView className="flex-1">
        <View className="space-y-4">
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-foreground font-semibold mb-2">How do I create a task?</Text>
            <Text className="text-sm text-muted">Tap the "+ Add Task" button on the home screen, enter a title and optional details, then save.</Text>
          </View>
          
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-foreground font-semibold mb-2">How do reminders work?</Text>
            <Text className="text-sm text-muted">Set a due date and time for your task. TaskMe will remind you when the task is due, and repeat every 30 minutes until completed.</Text>
          </View>
          
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-foreground font-semibold mb-2">What are the notification buttons?</Text>
            <Text className="text-sm text-muted">"Done" marks the task complete. "Remind in 5 min" reschedules the reminder for 5 minutes later.</Text>
          </View>
          
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-foreground font-semibold mb-2">How do I organize tasks?</Text>
            <Text className="text-sm text-muted">Tasks have three statuses: In Progress, Yet to Start, and Completed. Use the status buttons to organize your work.</Text>
          </View>
          
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-foreground font-semibold mb-2">Can I backup my data?</Text>
            <Text className="text-sm text-muted">Yes! Go to Settings → Data Management to export and import your data.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  // Privacy Policy View
  const renderPrivacy = () => (
    <View className="flex-1">
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => setCurrentView('menu')} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">Privacy Policy</Text>
      </View>
      
      <ScrollView className="flex-1">
        <View className="bg-surface rounded-lg p-4 border border-border space-y-4">
          <View>
            <Text className="text-foreground font-semibold mb-2">1. Data Collection</Text>
            <Text className="text-sm text-muted">
              TaskMe collects and stores only the data you create within the app: tasks, notes, reminders, and profile information. All data is stored locally on your device.
            </Text>
          </View>
          
          <View>
            <Text className="text-foreground font-semibold mb-2">2. Data Storage</Text>
            <Text className="text-sm text-muted">
              All your data is stored locally on your device using secure storage. We do not upload or transmit your data to any external servers unless you explicitly use the backup/export feature.
            </Text>
          </View>
          
          <View>
            <Text className="text-foreground font-semibold mb-2">3. Notifications</Text>
            <Text className="text-sm text-muted">
              The app uses local notifications to remind you of tasks and due dates. These notifications are processed entirely on your device.
            </Text>
          </View>
          
          <View>
            <Text className="text-foreground font-semibold mb-2">4. Voice Data</Text>
            <Text className="text-sm text-muted">
              Voice recognition for task creation uses your device's built-in speech recognition. No voice data is stored or transmitted.
            </Text>
          </View>
          
          <View>
            <Text className="text-foreground font-semibold mb-2">5. Third-Party Services</Text>
            <Text className="text-sm text-muted">
              We do not share your data with third parties. The app operates entirely offline except when you choose to share or backup data.
            </Text>
          </View>
          
          <View>
            <Text className="text-foreground font-semibold mb-2">6. Your Rights</Text>
            <Text className="text-sm text-muted">
              You have full control over your data. You can export, import, or delete all data at any time through the app settings.
            </Text>
          </View>
          
          <Text className="text-xs text-muted text-center pt-4">
            Last updated: April 2025
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  // Terms of Service View
  const renderTerms = () => (
    <View className="flex-1">
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => setCurrentView('menu')} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">Terms of Service</Text>
      </View>
      
      <ScrollView className="flex-1">
        <View className="bg-surface rounded-lg p-4 border border-border space-y-4">
          <View>
            <Text className="text-foreground font-semibold mb-2">1. Acceptance of Terms</Text>
            <Text className="text-sm text-muted">
              By using TaskMe, you agree to these Terms of Service. If you do not agree, please do not use the application.
            </Text>
          </View>
          
          <View>
            <Text className="text-foreground font-semibold mb-2">2. Use of the App</Text>
            <Text className="text-sm text-muted">
              TaskMe is provided for personal productivity purposes. You may not use the app for any illegal or unauthorized purpose.
            </Text>
          </View>
          
          <View>
            <Text className="text-foreground font-semibold mb-2">3. Data Responsibility</Text>
            <Text className="text-sm text-muted">
              You are responsible for maintaining backups of your data. While we strive to provide a stable app, we are not responsible for data loss.
            </Text>
          </View>
          
          <View>
            <Text className="text-foreground font-semibold mb-2">4. App Updates</Text>
            <Text className="text-sm text-muted">
              We may update the app periodically. Continued use after updates constitutes acceptance of any changes.
            </Text>
          </View>
          
          <View>
            <Text className="text-foreground font-semibold mb-2">5. Limitation of Liability</Text>
            <Text className="text-sm text-muted">
              TaskMe is provided "as is" without warranties. SEED-ITES is not liable for any damages arising from the use of this app.
            </Text>
          </View>
          
          <View>
            <Text className="text-foreground font-semibold mb-2">6. Contact</Text>
            <Text className="text-sm text-muted">
              For questions about these terms, please contact us through the SEED-ITES website at seedit.site.
            </Text>
          </View>
          
          <Text className="text-xs text-muted text-center pt-4">
            Last updated: April 2025
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  // About View
  const renderAbout = () => (
    <View className="flex-1">
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => setCurrentView('menu')} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">About</Text>
      </View>
      
      <ScrollView className="flex-1">
        <View className="bg-surface rounded-lg p-4 border border-border">
          <View className="items-center mb-4">
            <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-2">
              <Text className="text-4xl">📝</Text>
            </View>
            <Text className="text-xl font-bold text-foreground">TaskMe</Text>
            <Text className="text-sm text-muted">Your personal task and note manager</Text>
          </View>
          
          <View className="pt-4 border-t border-border">
            <Text className="text-xs text-muted mb-1">Developed by</Text>
            <Text className="text-sm text-foreground font-medium">Ashok Selva Kumar E</Text>
          </View>
          
          <View className="pt-4 border-t border-border mt-4">
            <TouchableOpacity onPress={() => Linking.openURL('https://seedit.site')} className="flex-row items-center">
              <Text className="text-xs text-muted">Powered by </Text>
              <Text className="text-sm text-primary font-bold">SEED-ITES</Text>
            </TouchableOpacity>
            <Text className="text-xs text-muted mt-1">
              SEED Innovating Technologies and Edu Services
            </Text>
            <Text className="text-xs text-muted">
              Product Development, Leading Training and Placement Company managed by IT veterans
            </Text>
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://seedit.site')}
              className="mt-2"
            >
              <Text className="text-xs text-primary">Visit: seedit.site</Text>
            </TouchableOpacity>
          </View>
          
          <View className="pt-4 border-t border-border mt-4">
            <Text className="text-xs text-muted text-center">TaskMe v1.0.0</Text>
            <Text className="text-[10px] text-muted text-center mt-1">Powered by SEED-ITES</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {currentView === 'menu' && renderMenu()}
        {currentView === 'history' && renderHistory()}
        {currentView === 'help' && renderHelp()}
        {currentView === 'about' && renderAbout()}
        {currentView === 'privacy' && renderPrivacy()}
        {currentView === 'terms' && renderTerms()}
        {currentView === 'settings' && (
        <>
        {/* Settings Header with Back Button */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => setCurrentView('menu')} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Settings</Text>
        </View>
        
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-foreground">Profile</Text>
            <TouchableOpacity onPress={() => setIsEditingProfile(!isEditingProfile)}>
              <Text className="text-primary font-medium">{isEditingProfile ? "Cancel" : "Edit"}</Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-surface rounded-lg p-4 border border-border">
            {isEditingProfile ? (
              <View className="gap-4">
                <View>
                  <Text className="text-xs text-muted mb-1">Name</Text>
                  <TextInput
                    className="bg-background border border-border rounded p-2 text-foreground"
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter name"
                  />
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Email</Text>
                  <TextInput
                    className="bg-background border border-border rounded p-2 text-foreground"
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="Enter email"
                    keyboardType="email-address"
                  />
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Phone</Text>
                  <TextInput
                    className="bg-background border border-border rounded p-2 text-foreground"
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Date of Birth</Text>
                  <TouchableOpacity 
                    onPress={() => setShowDobPicker(true)}
                    className="bg-background border border-border rounded p-2 flex-row justify-between items-center"
                  >
                    <Text className="text-foreground">{editDob.toDateString()}</Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  {showDobPicker && (
                    <DateTimePicker
                      value={editDob}
                      mode="date"
                      display="default"
                      onChange={onDobChange}
                      maximumDate={new Date()}
                    />
                  )}
                </View>
                <TouchableOpacity 
                  onPress={handleSaveProfile}
                  className="bg-primary p-3 rounded-lg items-center mt-2"
                >
                  <Text className="text-white font-bold">Save Profile</Text>
                </TouchableOpacity>
              </View>
            ) : (
              profile ? (
                <>
                  <View className="flex-row items-center mb-4">
                    <View className="bg-primary/10 p-3 rounded-full mr-4">
                      <Ionicons name="person" size={30} color="#4caf50" />
                    </View>
                    <View>
                      <Text className="text-lg font-bold text-foreground">{profile.name || "No Name"}</Text>
                      <Text className="text-sm text-muted">{profile.email || "No Email"}</Text>
                    </View>
                  </View>
                  <View className="border-t border-border pt-3 gap-2">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted">DOB</Text>
                      <Text className="text-sm text-foreground">{profile.dob || "Not set"}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted">Phone</Text>
                      <Text className="text-sm text-foreground">{profile.phoneNumber || "Not set"}</Text>
                    </View>
                  </View>
                </>
              ) : (
                <View className="items-center py-4">
                  <Text className="text-muted mb-2">No profile information</Text>
                  <TouchableOpacity onPress={() => setIsEditingProfile(true)}>
                    <Text className="text-primary font-bold">Create Profile</Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        </View>

        {/* Notification Settings */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Notifications</Text>
          
          <View className="bg-surface rounded-lg p-4 border border-border mb-3 flex-row items-center justify-between">
            <Text className="text-foreground">Enable Notifications</Text>
            <Switch
              value={localSettings.notificationsEnabled}
              onValueChange={(value) => handleToggleSetting("notificationsEnabled", value)}
              trackColor={{ false: "#767577", true: "#81c784" }}
              thumbColor={localSettings.notificationsEnabled ? "#4caf50" : "#f4f3f4"}
            />
          </View>

          <View className="bg-surface rounded-lg p-4 border border-border mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-foreground">Sound</Text>
              <Text className="text-xs text-muted">Voiceover confirmation included</Text>
            </View>
            <Switch
              value={localSettings.soundEnabled}
              onValueChange={(value) => handleToggleSetting("soundEnabled", value)}
              trackColor={{ false: "#767577", true: "#81c784" }}
              thumbColor={localSettings.soundEnabled ? "#4caf50" : "#f4f3f4"}
            />
          </View>

          <View className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between">
            <Text className="text-foreground">Vibration</Text>
            <Switch
              value={localSettings.vibrationEnabled}
              onValueChange={(value) => handleToggleSetting("vibrationEnabled", value)}
              trackColor={{ false: "#767577", true: "#81c784" }}
              thumbColor={localSettings.vibrationEnabled ? "#4caf50" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Theme Settings */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Theme</Text>
          
          <View className="flex-row gap-2">
            {["light", "dark", "auto"].map((theme) => (
              <TouchableOpacity
                key={theme}
                onPress={() => handleToggleSetting("theme", theme)}
                className={`flex-1 px-3 py-3 rounded-lg ${
                  localSettings.theme === theme
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
              >
                <Text
                  className={`text-sm font-medium text-center capitalize ${
                    localSettings.theme === theme ? "text-white" : "text-foreground"
                  }`}
                >
                  {theme}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminder Defaults */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Reminder Defaults</Text>
          
          <View className="bg-surface rounded-lg p-4 border border-border mb-3">
            <Text className="text-sm text-muted mb-2">Minutes Before Due Date</Text>
            <View className="flex-row gap-2">
              {[5, 10, 15, 30].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  onPress={() => handleToggleSetting("defaultReminderMinutesBefore", minutes)}
                  className={`px-3 py-2 rounded ${
                    localSettings.defaultReminderMinutesBefore === minutes
                      ? "bg-primary"
                      : "bg-background"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      localSettings.defaultReminderMinutesBefore === minutes
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    {minutes}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-sm text-muted mb-2">Default Reminder Type</Text>
            <View className="flex-row gap-2">
              {[ReminderType.NOTIFICATION, ReminderType.ALARM, ReminderType.VOICE].map(
                (type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => handleToggleSetting("defaultReminderType", type)}
                    className={`px-3 py-2 rounded ${
                      localSettings.defaultReminderType === type
                        ? "bg-primary"
                        : "bg-background"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        localSettings.defaultReminderType === type
                          ? "text-white"
                          : "text-foreground"
                      }`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>

        {/* Notification Sound */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Notification Sound</Text>
          
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-sm text-muted mb-2">Select Sound</Text>
            <View className="flex-row gap-2">
              {[
                { id: "notification1", name: "Sound 1" },
                { id: "notification2", name: "Sound 2" },
                { id: "device", name: "Device" },
              ].map((sound) => (
                <TouchableOpacity
                  key={sound.id}
                  onPress={() => handleToggleSetting("notificationSound", sound.id)}
                  className={`flex-1 px-3 py-2 rounded ${
                    localSettings.notificationSound === sound.id
                      ? "bg-primary"
                      : "bg-background"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium text-center ${
                      localSettings.notificationSound === sound.id
                        ? "text-white"
                        : "text-foreground"
                    }`}
                  >
                    {sound.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-xs text-muted mt-2">
              {localSettings.notificationSound === "device" 
                ? "Uses your device's default notification sound"
                : `Using ${localSettings.notificationSound === "notification2" ? "Sound 2" : "Sound 1"}`}
            </Text>
          </View>
        </View>

        {/* Data Management */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Data Management</Text>

          <View className="bg-surface rounded-lg p-4 border border-border mb-3">
            <View className="flex-row flex-wrap">
              <View className="w-1/2 mb-2">
                <Text className="text-2xl font-bold text-primary">{stats.tasks}</Text>
                <Text className="text-sm text-muted">Tasks</Text>
              </View>
              <View className="w-1/2 mb-2">
                <Text className="text-2xl font-bold text-primary">{stats.notes}</Text>
                <Text className="text-sm text-muted">Notes</Text>
              </View>
            </View>
            <View className="mt-3 pt-3 border-t border-border flex-row justify-between items-center">
              <Text className="text-sm text-muted">Total Size: {stats.totalSize}</Text>
              <TouchableOpacity onPress={handleClearAll}>
                <Text className="text-xs text-red-500 font-bold">CLEAR ALL</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleExport}
              disabled={isLoading}
              className="flex-1 bg-surface border border-border rounded-lg p-3 items-center"
            >
              <Ionicons name="download-outline" size={20} color="#4caf50" />
              <Text className="text-foreground text-xs mt-1">Export Backup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowImportModal(true)}
              disabled={isLoading}
              className="flex-1 bg-surface border border-border rounded-lg p-3 items-center"
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#2196f3" />
              <Text className="text-foreground text-xs mt-1">Import Backup</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Import Modal */}
        <Modal
          visible={showImportModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowImportModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50 p-4">
            <View className="bg-surface w-full rounded-xl p-6 border border-border">
              <Text className="text-xl font-bold text-foreground mb-4">Import Data</Text>
              <Text className="text-sm text-muted mb-4">
                Paste the backup JSON string below. This will overwrite current data.
              </Text>
              <TextInput
                multiline
                numberOfLines={10}
                className="bg-background border border-border rounded-lg p-3 text-foreground mb-4 text-xs font-mono"
                placeholder="Paste backup data here..."
                value={importData}
                onChangeText={setImportData}
                textAlignVertical="top"
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowImportModal(false)}
                  className="flex-1 bg-surface border border-border p-3 rounded-lg items-center"
                >
                  <Text className="text-foreground">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleImport}
                  className="flex-1 bg-primary p-3 rounded-lg items-center"
                >
                  <Text className="text-white font-bold">Import</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* About Section */}
        <View className="bg-surface rounded-lg p-4 border border-border mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">About</Text>
          <View className="space-y-2">
            <View>
              <Text className="text-sm text-foreground font-medium">TaskMe</Text>
              <Text className="text-xs text-muted">Your personal task and note manager</Text>
            </View>
            <View className="pt-2 border-t border-border">
              <Text className="text-xs text-muted">Developed by</Text>
              <Text className="text-sm text-foreground font-medium">Ashok Selva Kumar E</Text>
            </View>
            <View className="pt-2 border-t border-border">
              <TouchableOpacity onPress={() => Linking.openURL('https://seedit.site')} className="flex-row items-center">
                <Text className="text-xs text-muted">Powered by </Text>
                <Text className="text-sm text-primary font-bold">SEED-ITES</Text>
              </TouchableOpacity>
              <Text className="text-xs text-muted mt-1">
                 SEED Innovating Technologies and Edu Services
              </Text>
              <Text className="text-xs text-muted">
               Product Development, Leading Training and Placement Company managed by IT veterans
              </Text>
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://seedit.site')}
                className="mt-2"
              >
                <Text className="text-xs text-primary">Visit: seedit.site</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-8 mb-12 items-center">
          <Text className="text-xs text-muted">TaskMe v1.0.0</Text>
          <Text className="text-[10px] text-muted mt-1">Powered by SEED-ITES</Text>
        </View>
        </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
