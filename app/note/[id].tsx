import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Switch,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import {
  Note,
  Folder,
  Tag,
  Reminder,
  ReminderType,
  ReminderRepeatType,
  ReminderAssociatedType,
} from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { formatDate } from "@/lib/date-utils";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { reminderManager } from "@/lib/reminder-manager";
import { folderStorage, tagStorage, reminderStorage } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { Platform } from "react-native";
import { speechRecognitionService } from "@/lib/voice-service";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, addNote, updateNote, deleteNote } = useApp();
  const { notes, settings } = state;
  const colors = useColors();
  const isNewNote = id === "new";

  const existingNote = isNewNote ? null : notes.find((n: Note) => n.id === id);

  // Form state
  const [title, setTitle] = useState(existingNote?.title || "");
  const [content, setContent] = useState(existingNote?.content || "");
  const [isPinned, setIsPinned] = useState(existingNote?.isPinned || false);
  const [isArchived, setIsArchived] = useState(existingNote?.isArchived || false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    existingNote?.folderId
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(existingNote?.tags || []);

  // Data state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Reminder state
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [reminderType, setReminderType] = useState<ReminderType>(
    settings?.defaultReminderType || ReminderType.NOTIFICATION
  );
  const [reminderRepeat, setReminderRepeat] = useState<ReminderRepeatType>(
    ReminderRepeatType.NONE
  );

  // UI state
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isListeningContent, setIsListeningContent] = useState(false);

  // Load data
  useEffect(() => {
    folderStorage.getAllFolders().then(setFolders);
    tagStorage.getAllTags().then(setTags);

    if (existingNote?.reminderId) {
      reminderStorage.getAllReminders().then((reminders) => {
        const reminder = reminders.find((r) => r.id === existingNote.reminderId);
        if (reminder) {
          setHasReminder(reminder.isActive);
          setReminderTime(new Date(reminder.reminderTime));
          setReminderType(reminder.reminderType);
          setReminderRepeat(reminder.repeatType);
        }
      });
    }
  }, [existingNote]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;

    setIsSaving(true);

    try {
      const now = Date.now();
      const noteId = isNewNote ? `note-${now}-${Math.random().toString(36).substr(2, 9)}` : existingNote!.id;

      let reminderId = existingNote?.reminderId;

      // Handle reminder
      if (hasReminder && reminderTime) {
        const reminder: Reminder = {
          id: reminderId || `reminder-${now}-${Math.random().toString(36).substr(2, 9)}`,
          associatedId: noteId,
          associatedType: ReminderAssociatedType.NOTE,
          reminderTime: reminderTime.getTime(),
          repeatType: reminderRepeat,
          reminderType: reminderType,
          isActive: true,
          createdAt: reminderId ? existingNote!.createdAt : now,
        };

        await reminderStorage.saveReminder(reminder);
        await reminderManager.scheduleReminder(reminder);
        reminderId = reminder.id;
      } else if (reminderId) {
        await reminderManager.cancelReminder(reminderId);
        await reminderStorage.deleteReminder(reminderId);
        reminderId = undefined;
      }

      const note: Note = {
        id: noteId,
        title: title.trim(),
        content: content.trim(),
        folderId: selectedFolderId,
        isPinned,
        isArchived,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        reminderId,
        createdAt: existingNote?.createdAt || now,
        updatedAt: now,
      };

      if (isNewNote) {
        await addNote(note);
      } else {
        await updateNote(note);
      }

      router.back();
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    title,
    content,
    selectedFolderId,
    isPinned,
    isArchived,
    selectedTags,
    hasReminder,
    reminderTime,
    reminderType,
    reminderRepeat,
    isNewNote,
    existingNote,
    addNote,
    updateNote,
    router,
  ]);

  const handleDelete = useCallback(async () => {
    if (!existingNote) return;

    if (existingNote.reminderId) {
      await reminderManager.cancelReminder(existingNote.reminderId);
    }

    await deleteNote(existingNote.id);
    router.back();
  }, [existingNote, deleteNote, router]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const newTag: Tag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newTagName.trim(),
    };

    await tagStorage.saveTag(newTag);
    setTags([...tags, newTag]);
    setSelectedTags([...selectedTags, newTag.id]);
    setNewTagName("");
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const newFolder: Folder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newFolderName.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await folderStorage.saveFolder(newFolder);
    setFolders([...folders, newFolder]);
    setSelectedFolderId(newFolder.id);
    setNewFolderName("");
    setShowFolderPicker(false);
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((tagId: string) => tagId !== id));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleReminderDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowReminderDatePicker(false);
    if (selectedDate && reminderTime) {
      const newDate = new Date(selectedDate);
      newDate.setHours(reminderTime.getHours(), reminderTime.getMinutes());
      setReminderTime(newDate);
    } else if (selectedDate) {
      setReminderTime(selectedDate);
    }
  };

  const handleReminderTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowReminderTimePicker(false);
    if (selectedTime && reminderTime) {
      const newTime = new Date(reminderTime);
      newTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setReminderTime(newTime);
    } else if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  // Voice input handlers
  const handleVoiceInputTitle = async () => {
    if (isListeningTitle) {
      await speechRecognitionService.stopListening();
      setIsListeningTitle(false);
      return;
    }

    setIsListeningTitle(true);
    try {
      await speechRecognitionService.startListening(
        (text, isFinal) => {
          if (isFinal) {
            setTitle((prev: string) => prev + (prev ? " " : "") + text);
            setIsListeningTitle(false);
          }
        },
        (error) => {
          console.error("Voice input error:", error);
          setIsListeningTitle(false);
        }
      );
    } catch (error) {
      console.error("Failed to start voice input:", error);
      setIsListeningTitle(false);
    }
  };

  const handleVoiceInputContent = async () => {
    if (isListeningContent) {
      await speechRecognitionService.stopListening();
      setIsListeningContent(false);
      return;
    }

    setIsListeningContent(true);
    try {
      await speechRecognitionService.startListening(
        (text, isFinal) => {
          if (isFinal) {
            setContent((prev: string) => prev + (prev ? " " : "") + text);
            setIsListeningContent(false);
          }
        },
        (error) => {
          console.error("Voice input error:", error);
          setIsListeningContent(false);
        }
      );
    } catch (error) {
      console.error("Failed to start voice input:", error);
      setIsListeningContent(false);
    }
  };

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      speechRecognitionService.abort();
    };
  }, []);

  const reminderTypeOptions = [
    { value: ReminderType.NOTIFICATION, label: "Notification", icon: "notifications-outline" },
    { value: ReminderType.ALARM, label: "Alarm", icon: "alarm-outline" },
    { value: ReminderType.VOICE, label: "Voice", icon: "mic-outline" },
  ];

  const repeatOptions = [
    { value: ReminderRepeatType.NONE, label: "Once" },
    { value: ReminderRepeatType.DAILY, label: "Daily" },
    { value: ReminderRepeatType.WEEKLY, label: "Weekly" },
    { value: ReminderRepeatType.MONTHLY, label: "Monthly" },
    { value: ReminderRepeatType.YEARLY, label: "Yearly" },
  ];

  return (
    <ScreenContainer className="p-0">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: isNewNote ? "New Note" : "Edit Note",
          headerBackTitle: "Back",
        }}
      />
      <ScrollView className="p-4">
        {/* Title */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-muted">Title</Text>
            <TouchableOpacity
              onPress={handleVoiceInputTitle}
              className={`flex-row items-center px-2 py-1 rounded-full ${
                isListeningTitle ? "bg-red-100" : "bg-primary/10"
              }`}
            >
              <Ionicons
                name={isListeningTitle ? "mic" : "mic-outline"}
                size={14}
                color={isListeningTitle ? "#ef4444" : colors.primary}
              />
              <Text className={`text-xs ml-1 ${isListeningTitle ? "text-red-500" : "text-primary"}`}>
                {isListeningTitle ? "Listening..." : "Voice"}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter note title..."
            placeholderTextColor="#687076"
            className="bg-surface rounded-lg p-3 text-foreground text-base border border-border"
          />
        </View>

        {/* Content */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-muted">Content</Text>
            <TouchableOpacity
              onPress={handleVoiceInputContent}
              className={`flex-row items-center px-2 py-1 rounded-full ${
                isListeningContent ? "bg-red-100" : "bg-primary/10"
              }`}
            >
              <Ionicons
                name={isListeningContent ? "mic" : "mic-outline"}
                size={14}
                color={isListeningContent ? "#ef4444" : colors.primary}
              />
              <Text className={`text-xs ml-1 ${isListeningContent ? "text-red-500" : "text-primary"}`}>
                {isListeningContent ? "Listening..." : "Voice"}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Enter note content..."
            placeholderTextColor="#687076"
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            className="bg-surface rounded-lg p-3 text-foreground text-base border border-border min-h-[200px]"
          />
        </View>

        {/* Pins & Archive */}
        <View className="mb-4 bg-surface rounded-lg border border-border overflow-hidden">
          <View className="p-4 flex-row items-center justify-between border-b border-border">
            <View className="flex-row items-center">
              <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
              <Text className="text-foreground font-medium ml-2">Pin Note</Text>
            </View>
            <Switch
              value={isPinned}
              onValueChange={setIsPinned}
              trackColor={{ false: "#767577", true: colors.primary + "80" }}
              thumbColor={isPinned ? colors.primary : "#f4f3f4"}
            />
          </View>
          <View className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="archive-outline" size={20} color={colors.primary} />
              <Text className="text-foreground font-medium ml-2">Archive</Text>
            </View>
            <Switch
              value={isArchived}
              onValueChange={setIsArchived}
              trackColor={{ false: "#767577", true: colors.primary + "80" }}
              thumbColor={isArchived ? colors.primary : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Folder Selection */}
        <View className="mb-4">
          <Text className="text-sm text-muted mb-2">Folder</Text>
          <TouchableOpacity
            onPress={() => setShowFolderPicker(!showFolderPicker)}
            className="bg-surface rounded-lg p-3 border border-border flex-row items-center justify-between"
          >
            <Text className={selectedFolderId ? "text-foreground" : "text-muted"}>
              {selectedFolderId
                ? folders.find((f) => f.id === selectedFolderId)?.name || "Unknown folder"
                : "Select folder..."}
            </Text>
            <Ionicons
              name={showFolderPicker ? "chevron-up-outline" : "chevron-down-outline"}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>

          {showFolderPicker && (
            <View className="mt-2 bg-surface rounded-lg border border-border p-3">
              <TouchableOpacity
                onPress={() => {
                  setSelectedFolderId(undefined);
                  setShowFolderPicker(false);
                }}
                className={`py-2 px-3 rounded-lg mb-1 ${
                  !selectedFolderId ? "bg-primary/10" : ""
                }`}
              >
                <Text className={!selectedFolderId ? "text-primary" : "text-foreground"}>
                  No folder
                </Text>
              </TouchableOpacity>
              {folders.map((folder: Folder) => (
                <TouchableOpacity
                  key={folder.id}
                  onPress={() => {
                    setSelectedFolderId(folder.id);
                    setShowFolderPicker(false);
                  }}
                  className={`py-2 px-3 rounded-lg mb-1 ${
                    selectedFolderId === folder.id ? "bg-primary/10" : ""
                  }`}
                >
                  <Text
                    className={
                      selectedFolderId === folder.id ? "text-primary" : "text-foreground"
                    }
                  >
                    {folder.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <View className="mt-2 pt-2 border-t border-border">
                <Text className="text-sm text-muted mb-2">Create new folder</Text>
                <View className="flex-row gap-2">
                  <TextInput
                    value={newFolderName}
                    onChangeText={setNewFolderName}
                    placeholder="Folder name..."
                    placeholderTextColor="#687076"
                    className="flex-1 bg-background rounded-lg p-2 text-foreground text-sm border border-border"
                  />
                  <TouchableOpacity
                    onPress={handleCreateFolder}
                    disabled={!newFolderName.trim()}
                    className={`px-3 py-2 rounded-lg ${
                      newFolderName.trim() ? "bg-primary" : "bg-primary/50"
                    }`}
                  >
                    <Ionicons name="add" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Tags */}
        <View className="mb-4">
          <Text className="text-sm text-muted mb-2">Tags</Text>
          <TouchableOpacity
            onPress={() => setShowTagPicker(!showTagPicker)}
            className="bg-surface rounded-lg p-3 border border-border flex-row items-center justify-between"
          >
            <View className="flex-row flex-wrap flex-1">
              {selectedTags.length > 0 ? (
                selectedTags.map((tagId: string) => {
                  const tag = tags.find((t: Tag) => t.id === tagId);
                  return tag ? (
                    <View
                      key={tagId}
                      className="bg-primary/10 px-2 py-1 rounded mr-1 mb-1"
                    >
                      <Text className="text-xs text-primary">#{tag.name}</Text>
                    </View>
                  ) : null;
                })
              ) : (
                <Text className="text-muted">Select tags...</Text>
              )}
            </View>
            <Ionicons
              name={showTagPicker ? "chevron-up-outline" : "chevron-down-outline"}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>

          {showTagPicker && (
            <View className="mt-2 bg-surface rounded-lg border border-border p-3">
              <View className="flex-row flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full ${
                      selectedTags.includes(tag.id)
                        ? "bg-primary"
                        : "bg-background border border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedTags.includes(tag.id) ? "text-white" : "text-foreground"
                      }`}
                    >
                      #{tag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="pt-2 border-t border-border">
                <Text className="text-sm text-muted mb-2">Create new tag</Text>
                <View className="flex-row gap-2">
                  <TextInput
                    value={newTagName}
                    onChangeText={setNewTagName}
                    placeholder="Tag name..."
                    placeholderTextColor="#687076"
                    className="flex-1 bg-background rounded-lg p-2 text-foreground text-sm border border-border"
                  />
                  <TouchableOpacity
                    onPress={handleCreateTag}
                    disabled={!newTagName.trim()}
                    className={`px-3 py-2 rounded-lg ${
                      newTagName.trim() ? "bg-primary" : "bg-primary/50"
                    }`}
                  >
                    <Ionicons name="add" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Reminder Section */}
        <View className="mb-4 bg-surface rounded-lg border border-border overflow-hidden">
          <View className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text className="text-foreground font-medium ml-2">Set Reminder</Text>
            </View>
            <Switch
              value={hasReminder}
              onValueChange={setHasReminder}
              trackColor={{ false: "#767577", true: colors.primary + "80" }}
              thumbColor={hasReminder ? colors.primary : "#f4f3f4"}
            />
          </View>

          {hasReminder && (
            <View className="px-4 pb-4">
              {/* Reminder Time */}
              <View className="mb-3">
                <Text className="text-sm text-muted mb-2">Reminder Time</Text>
                <TouchableOpacity
                  onPress={() => setShowReminderDatePicker(true)}
                  className="bg-background rounded-lg p-3 border border-border mb-2 flex-row items-center justify-between"
                >
                  <Text className={reminderTime ? "text-foreground" : "text-muted"}>
                    {reminderTime ? formatDate(reminderTime.getTime()) : "Select date..."}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowReminderTimePicker(true)}
                  className="bg-background rounded-lg p-3 border border-border flex-row items-center justify-between"
                >
                  <Text className={reminderTime ? "text-foreground" : "text-muted"}>
                    {reminderTime
                      ? reminderTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Select time..."}
                  </Text>
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                {showReminderDatePicker && (
                  <DateTimePicker
                    value={reminderTime || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleReminderDateChange}
                    minimumDate={new Date()}
                  />
                )}
                {showReminderTimePicker && (
                  <DateTimePicker
                    value={reminderTime || new Date()}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleReminderTimeChange}
                  />
                )}
              </View>

              {/* Reminder Type */}
              <View className="mb-3">
                <Text className="text-sm text-muted mb-2">Alert Type</Text>
                <View className="flex-row gap-2">
                  {reminderTypeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setReminderType(option.value)}
                      className={`flex-1 py-2 px-2 rounded-lg flex-row items-center justify-center gap-1 ${
                        reminderType === option.value
                          ? "bg-primary"
                          : "bg-background border border-border"
                      }`}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={14}
                        color={reminderType === option.value ? "white" : colors.primary}
                      />
                      <Text
                        className={`text-xs font-medium ${
                          reminderType === option.value ? "text-white" : "text-foreground"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Repeat */}
              <View>
                <Text className="text-sm text-muted mb-2">Repeat</Text>
                <View className="flex-row flex-wrap gap-2">
                  {repeatOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setReminderRepeat(option.value)}
                      className={`py-2 px-3 rounded-lg ${
                        reminderRepeat === option.value
                          ? "bg-primary"
                          : "bg-background border border-border"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          reminderRepeat === option.value ? "text-white" : "text-foreground"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving || !title.trim()}
            className={`flex-1 py-3 rounded-lg ${
              title.trim() ? "bg-primary" : "bg-primary/50"
            }`}
          >
            <Text className="text-white text-center font-semibold">
              {isSaving ? "Saving..." : isNewNote ? "Create Note" : "Save Changes"}
            </Text>
          </TouchableOpacity>

          {!isNewNote && (
            <TouchableOpacity
              onPress={handleDelete}
              className="px-4 py-3 rounded-lg bg-error/10 border border-error"
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
