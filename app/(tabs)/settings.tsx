import { ScrollView, Text, View, TouchableOpacity, Switch, Alert, TextInput, Modal, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { AppSettings, ReminderType } from "@/lib/types";
import { useState, useEffect } from "react";
import { backupService } from "@/lib/backup-service";
import { notificationSound, NotificationSoundType } from "@/lib/notification-sound";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { voiceService } from "@/lib/voice-service";

export default function SettingsScreen() {
  const { state, updateSettings } = useApp();
  const colors = useColors();
  const { settings } = state;
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

  const handleToggleSetting = async (key: keyof AppSettings, value: any) => {
    if (!localSettings) return;
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    await updateSettings(updated);

    if (key === "soundEnabled") {
      const message = value ? "Sound enabled" : "Sound disabled";
      voiceService.speak(message);
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
        <Text className="text-foreground text-lg">Loading settings...</Text>
      </ScreenContainer>
    );
  }

  const profile = localSettings.userProfile;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <Text className="text-2xl font-bold text-foreground mb-6">Settings</Text>

        {/* User Profile Section */}
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

        {/* Footer */}
        <View className="mt-8 mb-12 items-center">
          <Text className="text-xs text-muted">Taskme App v1.0.0</Text>
          <Text className="text-[10px] text-muted mt-1">Keep your life organized</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
