import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { TaskCard } from "@/components/task-card";
import { NoteCard } from "@/components/note-card";
import { useApp } from "@/lib/app-context";
import { Task, TaskStatus } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import { formatDate } from "@/lib/date-utils";

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
          <Text className="text-4xl font-bold text-foreground">Today</Text>
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

        {/* Today's Tasks */}
        {dashboardData && dashboardData.todaysTasks.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Today's Tasks</Text>
            {dashboardData.todaysTasks.map((task) => (
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

        {/* Upcoming Tasks */}
        {dashboardData && dashboardData.upcomingTasks.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Upcoming</Text>
            {dashboardData.upcomingTasks.slice(0, 5).map((task) => (
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

        {/* Completed Today Summary */}
        {dashboardData && dashboardData.completedTodayCount > 0 && (
          <View className="bg-success/10 rounded-lg p-4 mb-6">
            <Text className="text-success font-semibold">
              ✓ {dashboardData.completedTodayCount} task{dashboardData.completedTodayCount !== 1 ? "s" : ""} completed today
            </Text>
          </View>
        )}

        {/* Recent Notes */}
        {dashboardData && dashboardData.recentNotes.length > 0 && (
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
          dashboardData.todaysTasks.length === 0 &&
          dashboardData.upcomingTasks.length === 0 &&
          dashboardData.recentNotes.length === 0 && (
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
