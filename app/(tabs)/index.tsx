import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { TaskCard } from "@/components/task-card";
import { NoteCard } from "@/components/note-card";
import { useApp } from "@/lib/app-context";
import { Task, TaskStatus } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import { formatDate, formatTime } from "@/lib/date-utils";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state, updateTask, refreshDashboard } = useApp();
  const { dashboardData, isLoading } = state;

  const handleTaskPress = (taskId: string) => {
    router.push(`/task/${taskId}`);
  };

  const handleNotePress = (noteId: string) => {
    router.push(`/note/${noteId}`);
  };

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

  const handleAddTask = () => {
    router.push("/task/new");
  };

  const handleAddNote = () => {
    router.push("/note/new");
  };

  const handleUpdateReminder = async (task: Task, newTime: number) => {
    await updateTask({
      ...task,
      dueDate: newTime,
      dueTime: newTime,
      updatedAt: Date.now(),
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground text-lg">Loading...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-4xl font-bold text-foreground">TaskMe</Text>
          <Text className="text-sm text-muted mt-1">{formatDate(Date.now())}</Text>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={handleAddTask}
            className="flex-1 bg-primary rounded-lg p-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">+ Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddNote}
            className="flex-1 bg-surface border border-border rounded-lg p-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-foreground font-semibold">+ Add Note</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Stats */}
        {dashboardData && (
          <View className="flex-row gap-2 mb-6">
            <View className="flex-1 bg-warning/10 rounded-lg p-3 items-center">
              <Text className="text-2xl font-bold text-warning">
                {dashboardData.inProgressTasks?.length || 0}
              </Text>
              <Text className="text-xs text-muted">In Progress</Text>
            </View>
            <View className="flex-1 bg-surface border border-border rounded-lg p-3 items-center">
              <Text className="text-2xl font-bold text-foreground">
                {dashboardData.pendingTasks?.length || 0}
              </Text>
              <Text className="text-xs text-muted">Yet to Start</Text>
            </View>
            <View className="flex-1 bg-success/10 rounded-lg p-3 items-center">
              <Text className="text-2xl font-bold text-success">
                {dashboardData.completedTodayCount || 0}
              </Text>
              <Text className="text-xs text-muted">Completed</Text>
            </View>
          </View>
        )}

        {/* In Progress Tasks */}
        {dashboardData && dashboardData.inProgressTasks && dashboardData.inProgressTasks.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-3 h-3 rounded-full bg-warning mr-2" />
              <Text className="text-lg font-semibold text-foreground">In Progress</Text>
              <Text className="text-sm text-muted ml-2">({dashboardData.inProgressTasks.length})</Text>
            </View>
            {dashboardData.inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => handleTaskPress(task.id)}
                onToggleComplete={() => handleToggleTaskComplete(task)}
                onToggleInProgress={() => handleToggleTaskInProgress(task)}
                onEdit={() => handleTaskPress(task.id)}
                onUpdateReminder={(time) => handleUpdateReminder(task, time)}
              />
            ))}
          </View>
        )}

        {/* Yet to Start (Pending) Tasks */}
        {dashboardData && dashboardData.pendingTasks && dashboardData.pendingTasks.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-3 h-3 rounded-full bg-primary mr-2" />
              <Text className="text-lg font-semibold text-foreground">Yet to Start</Text>
              <Text className="text-sm text-muted ml-2">({dashboardData.pendingTasks.length})</Text>
            </View>
            {dashboardData.pendingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => handleTaskPress(task.id)}
                onToggleComplete={() => handleToggleTaskComplete(task)}
                onToggleInProgress={() => handleToggleTaskInProgress(task)}
                onEdit={() => handleTaskPress(task.id)}
                onUpdateReminder={(time) => handleUpdateReminder(task, time)}
              />
            ))}
          </View>
        )}

        {/* Completed Today Tasks */}
        {dashboardData && dashboardData.completedTodayTasks && dashboardData.completedTodayTasks.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-3 h-3 rounded-full bg-success mr-2" />
              <Text className="text-lg font-semibold text-foreground">Completed Today</Text>
              <Text className="text-sm text-muted ml-2">({dashboardData.completedTodayTasks.length})</Text>
            </View>
            {dashboardData.completedTodayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => handleTaskPress(task.id)}
                onToggleComplete={() => handleToggleTaskComplete(task)}
                onToggleInProgress={() => handleToggleTaskInProgress(task)}
                onEdit={() => handleTaskPress(task.id)}
                onUpdateReminder={(time) => handleUpdateReminder(task, time)}
              />
            ))}
          </View>
        )}

        {/* Recent Notes */}
        {dashboardData && dashboardData.recentNotes && dashboardData.recentNotes.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Recent Notes</Text>
            {dashboardData.recentNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPress={() => handleNotePress(note.id)}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {dashboardData &&
          (!dashboardData.inProgressTasks || dashboardData.inProgressTasks.length === 0) &&
          (!dashboardData.pendingTasks || dashboardData.pendingTasks.length === 0) &&
          (!dashboardData.completedTodayTasks || dashboardData.completedTodayTasks.length === 0) &&
          (!dashboardData.recentNotes || dashboardData.recentNotes.length === 0) && (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-2xl mb-2">📝</Text>
              <Text className="text-lg font-semibold text-foreground">No tasks or notes yet</Text>
              <Text className="text-sm text-muted mt-2">Create your first task or note to get started</Text>
            </View>
          )}
      </ScrollView>
    </ScreenContainer>
  );
}
