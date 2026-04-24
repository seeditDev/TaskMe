import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { TaskCard } from "@/components/task-card";
import { useApp } from "@/lib/app-context";
import { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { useState } from "react";

export default function TasksScreen() {
  const router = useRouter();
  const { state, updateTask, deleteTask } = useApp();
  const { tasks, isLoading } = state;
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "ALL">("ALL");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "ALL">("ALL");

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "ALL" && task.status !== filterStatus) return false;
    if (filterPriority !== "ALL" && task.priority !== filterPriority) return false;
    return true;
  });

  const handleToggleTaskComplete = async (task: Task) => {
    const newStatus =
      task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
    await updateTask({
      ...task,
      status: newStatus,
      updatedAt: Date.now(),
    });
  };

  const handleToggleTaskInProgress = async (task: Task) => {
    const newStatus =
      task.status === TaskStatus.IN_PROGRESS ? TaskStatus.PENDING : TaskStatus.IN_PROGRESS;
    await updateTask({
      ...task,
      status: newStatus,
      updatedAt: Date.now(),
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleEditTask = (taskId: string) => {
    router.push(`/task/${taskId}`);
  };

  const handleUpdateReminder = async (task: Task, newTime: number) => {
    await updateTask({
      ...task,
      dueDate: newTime,
      dueTime: newTime,
      updatedAt: Date.now(),
    });
  };

  const handleAddTask = () => {
    router.push("/task/new");
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground text-lg">Loading tasks...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground">Tasks</Text>
        <TouchableOpacity
          onPress={handleAddTask}
          className="bg-primary rounded-full w-12 h-12 items-center justify-center"
        >
          <Text className="text-white text-2xl">+</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View className="mb-4 gap-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {["ALL", TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED].map(
            (status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setFilterStatus(status as TaskStatus | "ALL")}
                className={`px-3 py-2 rounded-full mr-2 ${
                  filterStatus === status
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    filterStatus === status ? "text-white" : "text-foreground"
                  }`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {["ALL", TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH].map(
            (priority) => (
              <TouchableOpacity
                key={priority}
                onPress={() => setFilterPriority(priority as TaskPriority | "ALL")}
                className={`px-3 py-2 rounded-full mr-2 ${
                  filterPriority === priority
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    filterPriority === priority ? "text-white" : "text-foreground"
                  }`}
                >
                  {priority}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {/* Tasks List */}
      {filteredTasks.length > 0 ? (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onToggleComplete={() => handleToggleTaskComplete(item)}
              onToggleInProgress={() => handleToggleTaskInProgress(item)}
              onEdit={() => handleEditTask(item.id)}
              onUpdateReminder={(time) => handleUpdateReminder(item, time)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center py-12">
          <Text className="text-2xl mb-2">📋</Text>
          <Text className="text-lg font-semibold text-foreground">No tasks</Text>
          <Text className="text-sm text-muted mt-2">Create a task to get started</Text>
        </View>
      )}
    </ScreenContainer>
  );
}
