import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import {
  Task,
  TaskPriority,
  TaskStatus,
  Reminder,
  ReminderType,
  ReminderRepeatType,
  ReminderAssociatedType,
} from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { formatDate, formatTime } from "@/lib/date-utils";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { reminderManager } from "@/lib/reminder-manager";
import { reminderStorage } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { speechRecognitionService } from "@/lib/voice-service";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, addTask, updateTask, deleteTask } = useApp();
  const { tasks, settings } = state;
  const colors = useColors();
  const isNewTask = id === "new";

  const existingTask = isNewTask ? null : tasks.find((t: Task) => t.id === id);

  // Form state
  const [title, setTitle] = useState(existingTask?.title || "");
  const [description, setDescription] = useState(existingTask?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(
    existingTask?.priority || TaskPriority.MEDIUM
  );
  const [status, setStatus] = useState<TaskStatus>(
    existingTask?.status || TaskStatus.PENDING
  );
  const [dueDate, setDueDate] = useState<Date | null>(
    existingTask?.dueDate ? new Date(existingTask.dueDate) : null
  );
  const [dueTime, setDueTime] = useState<Date | null>(
    existingTask?.dueTime ? new Date(existingTask.dueTime) : null
  );

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isListeningDesc, setIsListeningDesc] = useState(false);

  // Subtask state
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  // Load existing reminder and subtasks
  useEffect(() => {
    if (existingTask?.reminderId) {
      reminderStorage.getAllReminders().then((reminders) => {
        const reminder = reminders.find((r) => r.id === existingTask.reminderId);
        if (reminder) {
          setHasReminder(reminder.isActive);
          setReminderTime(new Date(reminder.reminderTime));
          setReminderType(reminder.reminderType);
          setReminderRepeat(reminder.repeatType);
        }
      });
    }

    // Load subtasks
    if (existingTask) {
      const taskSubtasks = tasks.filter((t: Task) => t.parentTaskId === existingTask.id);
      setSubtasks(taskSubtasks);
    }
  }, [existingTask, tasks]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;

    setIsSaving(true);

    try {
      const now = Date.now();
      const taskId = isNewTask ? `task-${now}-${Math.random().toString(36).substr(2, 9)}` : existingTask!.id;

      let reminderId = existingTask?.reminderId;

      // Handle reminder
      if (hasReminder && reminderTime) {
        const reminder: Reminder = {
          id: reminderId || `reminder-${now}-${Math.random().toString(36).substr(2, 9)}`,
          associatedId: taskId,
          associatedType: ReminderAssociatedType.TASK,
          reminderTime: reminderTime.getTime(),
          repeatType: reminderRepeat,
          reminderType: reminderType,
          isActive: true,
          createdAt: reminderId ? existingTask!.createdAt : now,
        };

        await reminderStorage.saveReminder(reminder);
        await reminderManager.scheduleReminder(reminder);
        reminderId = reminder.id;
      } else if (reminderId) {
        // Cancel existing reminder
        await reminderManager.cancelReminder(reminderId);
        await reminderStorage.deleteReminder(reminderId);
        reminderId = undefined;
      }

      const task: Task = {
        id: taskId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate?.getTime(),
        dueTime: dueTime?.getTime(),
        reminderId,
        createdAt: existingTask?.createdAt || now,
        updatedAt: now,
      };

      if (isNewTask) {
        await addTask(task);
      } else {
        await updateTask(task);
      }

      router.back();
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    title,
    description,
    priority,
    status,
    dueDate,
    dueTime,
    hasReminder,
    reminderTime,
    reminderType,
    reminderRepeat,
    isNewTask,
    existingTask,
    addTask,
    updateTask,
    router,
  ]);

  const handleDelete = useCallback(async () => {
    if (!existingTask) return;

    if (existingTask.reminderId) {
      await reminderManager.cancelReminder(existingTask.reminderId);
    }

    // Delete all subtasks
    const taskSubtasks = tasks.filter((t: Task) => t.parentTaskId === existingTask.id);
    for (const subtask of taskSubtasks) {
      await deleteTask(subtask.id);
    }

    await deleteTask(existingTask.id);
    router.back();
  }, [existingTask, deleteTask, router, tasks]);

  // Subtask handlers
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !existingTask) return;

    const now = Date.now();
    const subtask: Task = {
      id: `subtask-${now}-${Math.random().toString(36).substr(2, 9)}`,
      title: newSubtaskTitle.trim(),
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      parentTaskId: existingTask.id,
    };

    await addTask(subtask);
    setSubtasks([...subtasks, subtask]);
    setNewSubtaskTitle("");
    setShowAddSubtask(false);
  };

  const handleToggleSubtask = async (subtask: Task) => {
    const newStatus =
      subtask.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
    const updatedSubtask = { ...subtask, status: newStatus, updatedAt: Date.now() };
    await updateTask(updatedSubtask);
    setSubtasks(subtasks.map((st: Task) => (st.id === subtask.id ? updatedSubtask : st)));
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    await deleteTask(subtaskId);
    setSubtasks(subtasks.filter((st: Task) => st.id !== subtaskId));
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setDueTime(selectedTime);
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

  const handleVoiceInputDesc = async () => {
    if (isListeningDesc) {
      await speechRecognitionService.stopListening();
      setIsListeningDesc(false);
      return;
    }

    setIsListeningDesc(true);
    try {
      await speechRecognitionService.startListening(
        (text, isFinal) => {
          if (isFinal) {
            setDescription((prev: string) => prev + (prev ? " " : "") + text);
            setIsListeningDesc(false);
          }
        },
        (error) => {
          console.error("Voice input error:", error);
          setIsListeningDesc(false);
        }
      );
    } catch (error) {
      console.error("Failed to start voice input:", error);
      setIsListeningDesc(false);
    }
  };

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      speechRecognitionService.abort();
    };
  }, []);

  const priorityOptions = [
    { value: TaskPriority.LOW, label: "Low", color: "bg-green-100 text-green-700" },
    { value: TaskPriority.MEDIUM, label: "Medium", color: "bg-yellow-100 text-yellow-700" },
    { value: TaskPriority.HIGH, label: "High", color: "bg-red-100 text-red-700" },
  ];

  const statusOptions = [
    { value: TaskStatus.PENDING, label: "Pending" },
    { value: TaskStatus.IN_PROGRESS, label: "In Progress" },
    { value: TaskStatus.COMPLETED, label: "Completed" },
  ];

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
          headerTitle: isNewTask ? "New Task" : "Edit Task",
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
            placeholder="Enter task title..."
            placeholderTextColor="#687076"
            className="bg-surface rounded-lg p-3 text-foreground text-base border border-border"
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-muted">Description</Text>
            <TouchableOpacity
              onPress={handleVoiceInputDesc}
              className={`flex-row items-center px-2 py-1 rounded-full ${
                isListeningDesc ? "bg-red-100" : "bg-primary/10"
              }`}
            >
              <Ionicons
                name={isListeningDesc ? "mic" : "mic-outline"}
                size={14}
                color={isListeningDesc ? "#ef4444" : colors.primary}
              />
              <Text className={`text-xs ml-1 ${isListeningDesc ? "text-red-500" : "text-primary"}`}>
                {isListeningDesc ? "Listening..." : "Voice"}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter task description..."
            placeholderTextColor="#687076"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="bg-surface rounded-lg p-3 text-foreground text-base border border-border min-h-[80px]"
          />
        </View>

        {/* Priority */}
        <View className="mb-4">
          <Text className="text-sm text-muted mb-2">Priority</Text>
          <View className="flex-row gap-2">
            {priorityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setPriority(option.value)}
                className={`flex-1 py-2 px-3 rounded-lg ${
                  priority === option.value ? option.color : "bg-surface border border-border"
                }`}
              >
                <Text
                  className={`text-center text-sm font-medium ${
                    priority === option.value
                      ? option.color.split(" ")[1]
                      : "text-foreground"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status */}
        <View className="mb-4">
          <Text className="text-sm text-muted mb-2">Status</Text>
          <View className="flex-row gap-2">
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setStatus(option.value)}
                className={`flex-1 py-2 px-3 rounded-lg ${
                  status === option.value
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
              >
                <Text
                  className={`text-center text-sm font-medium ${
                    status === option.value ? "text-white" : "text-foreground"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Date */}
        <View className="mb-4">
          <Text className="text-sm text-muted mb-2">Due Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-surface rounded-lg p-3 border border-border flex-row items-center justify-between"
          >
            <Text className={dueDate ? "text-foreground" : "text-muted"}>
              {dueDate ? formatDate(dueDate.getTime()) : "Select date..."}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Due Time */}
        <View className="mb-4">
          <Text className="text-sm text-muted mb-2">Due Time</Text>
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            className="bg-surface rounded-lg p-3 border border-border flex-row items-center justify-between"
          >
            <Text className={dueTime ? "text-foreground" : "text-muted"}>
              {dueTime ? formatTime(dueTime.getTime()) : "Select time..."}
            </Text>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={dueTime || new Date()}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
            />
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
                    {reminderTime ? formatTime(reminderTime.getTime()) : "Select time..."}
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

        {/* Subtasks Section - only for existing tasks */}
        {!isNewTask && (
          <View className="mb-4 bg-surface rounded-lg border border-border overflow-hidden">
            <View className="p-4 flex-row items-center justify-between border-b border-border">
              <View className="flex-row items-center">
                <Ionicons name="list-outline" size={20} color={colors.primary} />
                <Text className="text-foreground font-medium ml-2">Subtasks</Text>
                {subtasks.length > 0 && (
                  <Text className="text-muted text-sm ml-2">({subtasks.filter((st: Task) => st.status === TaskStatus.COMPLETED).length}/{subtasks.length})</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setShowAddSubtask(!showAddSubtask)}
                className="bg-primary/10 px-3 py-1 rounded-full"
              >
                <Text className="text-primary text-sm font-medium">
                  {showAddSubtask ? "Cancel" : "+ Add"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Add Subtask Input */}
            {showAddSubtask && (
              <View className="p-4 border-b border-border">
                <View className="flex-row gap-2">
                  <TextInput
                    value={newSubtaskTitle}
                    onChangeText={setNewSubtaskTitle}
                    placeholder="Enter subtask title..."
                    placeholderTextColor="#687076"
                    className="flex-1 bg-background rounded-lg p-3 text-foreground text-base border border-border"
                  />
                  <TouchableOpacity
                    onPress={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className={`px-4 py-3 rounded-lg ${
                      newSubtaskTitle.trim() ? "bg-primary" : "bg-primary/50"
                    }`}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Subtasks List */}
            {subtasks.length > 0 ? (
              <View className="p-4">
                {subtasks.map((subtask: Task) => (
                  <View
                    key={subtask.id}
                    className="flex-row items-center justify-between py-2 border-b border-border last:border-b-0"
                  >
                    <TouchableOpacity
                      onPress={() => handleToggleSubtask(subtask)}
                      className="flex-row items-center flex-1"
                    >
                      <Ionicons
                        name={
                          subtask.status === TaskStatus.COMPLETED
                            ? "checkbox-outline"
                            : "square-outline"
                        }
                        size={22}
                        color={
                          subtask.status === TaskStatus.COMPLETED
                            ? colors.success
                            : colors.muted
                        }
                      />
                      <Text
                        className={`ml-2 flex-1 ${
                          subtask.status === TaskStatus.COMPLETED
                            ? "text-muted line-through"
                            : "text-foreground"
                        }`}
                      >
                        {subtask.title}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteSubtask(subtask.id)}
                      className="p-2"
                    >
                      <Ionicons name="close-outline" size={18} color={colors.muted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View className="p-4 items-center">
                <Text className="text-muted text-sm">No subtasks yet</Text>
              </View>
            )}
          </View>
        )}

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
              {isSaving ? "Saving..." : isNewTask ? "Create Task" : "Save Changes"}
            </Text>
          </TouchableOpacity>

          {!isNewTask && (
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
