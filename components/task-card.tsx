import { View, Text, Pressable, TouchableOpacity, Platform } from "react-native";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onToggleComplete?: () => void;
  onToggleInProgress?: () => void;
  onEdit?: () => void;
  onUpdateReminder?: (time: number) => void;
}

export function TaskCard({ 
  task, 
  onPress, 
  onToggleComplete, 
  onToggleInProgress,
  onEdit, 
  onUpdateReminder 
}: TaskCardProps) {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showReminderOptions, setShowReminderOptions] = useState(false);

  const priorityColor = {
    [TaskPriority.LOW]: "bg-green-100 text-green-700",
    [TaskPriority.MEDIUM]: "bg-yellow-100 text-yellow-700",
    [TaskPriority.HIGH]: "bg-red-100 text-red-700",
  };

  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isInProgress = task.status === TaskStatus.IN_PROGRESS;

  const handleCardPress = () => {
    setShowQuickActions(!showQuickActions);
    setShowReminderOptions(false);
  };

  const handleQuickReminder = (minutes: number) => {
    const reminderTime = Date.now() + minutes * 60 * 1000;
    onUpdateReminder?.(reminderTime);
    setShowReminderOptions(false);
    setShowQuickActions(false);
  };

  return (
    <View className="mb-3">
      <Pressable
        onPress={handleCardPress}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        className="bg-surface rounded-lg p-4 border border-border"
      >
        <View className="flex-row items-start gap-3">
          {/* Checkbox / Status Indicator */}
          <Pressable
            onPress={onToggleComplete}
            className={cn(
              "w-6 h-6 rounded border-2 mt-1 flex items-center justify-center",
              isCompleted ? "bg-success border-success" : 
              isInProgress ? "bg-primary/20 border-primary" : "border-border"
            )}
          >
            {isCompleted && <Ionicons name="checkmark" size={16} color="white" />}
            {isInProgress && <View className="w-2 h-2 rounded-full bg-primary" />}
          </Pressable>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <Text
                className={cn(
                  "text-base font-semibold flex-1",
                  isCompleted ? "text-muted line-through" : "text-foreground"
                )}
              >
                {task.title}
              </Text>
              
              {/* Pencil Edit Button */}
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="p-1"
              >
                <Ionicons name="pencil-outline" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            {task.description && (
              <Text className="text-sm text-muted mt-1 line-clamp-1">{task.description}</Text>
            )}

            {/* Meta Info */}
            <View className="flex-row items-center gap-2 mt-2">
              {isInProgress && (
                <View className="bg-primary/10 px-1.5 py-0.5 rounded mr-1">
                  <Text className="text-[10px] text-primary font-bold">IN PROGRESS</Text>
                </View>
              )}
              {task.dueDate && (
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={12} color="#888" className="mr-1" />
                  <Text className="text-xs text-muted">{formatDate(task.dueDate)}</Text>
                </View>
              )}
              {task.dueTime && (
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={12} color="#888" className="mr-1" />
                  <Text className="text-xs text-muted">{formatTime(task.dueTime)}</Text>
                </View>
              )}
              <View className={cn("px-2 py-0.5 rounded text-xs font-medium", priorityColor[task.priority])}>
                <Text className={cn("text-[10px] font-bold", priorityColor[task.priority].split(" ")[1])}>
                  {task.priority}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Quick Actions Overlay/Menu */}
      {showQuickActions && (
        <View className="flex-row bg-surface border-x border-b border-border rounded-b-lg p-2 justify-around items-center -mt-1">
          <TouchableOpacity 
            onPress={() => {
              setShowQuickActions(false);
              onToggleComplete?.();
            }}
            className="flex-row items-center px-2 py-2"
          >
            <Ionicons name={isCompleted ? "refresh-outline" : "checkmark-circle-outline"} size={20} color={isCompleted ? "#666" : "#4caf50"} />
            <Text className="ml-1 text-[10px] font-medium text-foreground">{isCompleted ? "Undo" : "Done"}</Text>
          </TouchableOpacity>

          {!isCompleted && (
            <TouchableOpacity 
              onPress={() => {
                setShowQuickActions(false);
                onToggleInProgress?.();
              }}
              className="flex-row items-center px-2 py-2"
            >
              <Ionicons name={isInProgress ? "pause-circle-outline" : "play-circle-outline"} size={20} color="#2196f3" />
              <Text className="ml-1 text-[10px] font-medium text-foreground">{isInProgress ? "Pause" : "Start"}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={() => {
              setShowReminderOptions(true);
            }}
            className="flex-row items-center px-2 py-2"
          >
            <Ionicons name="alarm-outline" size={20} color="#673ab7" />
            <Text className="ml-1 text-[10px] font-medium text-foreground">Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              setShowQuickActions(false);
              onEdit?.();
            }}
            className="flex-row items-center px-2 py-2"
          >
            <Ionicons name="create-outline" size={20} color="#ff9800" />
            <Text className="ml-1 text-[10px] font-medium text-foreground">Edit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Reminder Options */}
      {showReminderOptions && (
        <View className="bg-surface border-x border-b border-border rounded-b-lg p-3 -mt-1">
          <Text className="text-sm text-muted mb-2">Remind me in:</Text>
          <View className="flex-row gap-2">
            {[5, 10, 15].map((minutes) => (
              <TouchableOpacity
                key={minutes}
                onPress={() => handleQuickReminder(minutes)}
                className="flex-1 py-2 px-2 rounded-lg bg-primary/10 border border-primary/30"
              >
                <Text className="text-center text-primary font-medium text-sm">
                  {minutes} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => setShowReminderOptions(false)}
            className="mt-2 py-2"
          >
            <Text className="text-center text-muted text-sm">Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
