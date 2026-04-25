import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { Task, Note, DashboardData, AppSettings, TaskStatus } from "./types";
import { taskStorage, noteStorage, settingsStorage } from "./storage";
import { taskDueEvents } from "./task-due-monitor";
import { historyService } from "./history-service";

interface AppState {
  tasks: Task[];
  notes: Note[];
  dashboardData: DashboardData | null;
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_TASKS"; payload: Task[] }
  | { type: "SET_NOTES"; payload: Note[] }
  | { type: "SET_DASHBOARD_DATA"; payload: DashboardData }
  | { type: "SET_SETTINGS"; payload: AppSettings }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: string }
  | { type: "ADD_NOTE"; payload: Note }
  | { type: "UPDATE_NOTE"; payload: Note }
  | { type: "DELETE_NOTE"; payload: string };

const initialState: AppState = {
  tasks: [],
  notes: [],
  dashboardData: null,
  settings: null,
  isLoading: true,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_TASKS":
      return { ...state, tasks: action.payload };
    case "SET_NOTES":
      return { ...state, notes: action.payload };
    case "SET_DASHBOARD_DATA":
      return { ...state, dashboardData: action.payload };
    case "SET_SETTINGS":
      return { ...state, settings: action.payload };
    case "ADD_TASK":
      return { ...state, tasks: [...state.tasks, action.payload] };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case "DELETE_TASK":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };
    case "ADD_NOTE":
      return { ...state, notes: [...state.notes, action.payload] };
    case "UPDATE_NOTE":
      return {
        ...state,
        notes: state.notes.map((n) => (n.id === action.payload.id ? action.payload : n)),
      };
    case "DELETE_NOTE":
      return { ...state, notes: state.notes.filter((n) => n.id !== action.payload) };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadAppData: () => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addNote: (note: Note) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadAppData = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const [tasks, notes, settings] = await Promise.all([
        taskStorage.getAllTasks(),
        noteStorage.getAllNotes(),
        settingsStorage.getSettings(),
      ]);

      dispatch({ type: "SET_TASKS", payload: tasks });
      dispatch({ type: "SET_NOTES", payload: notes });
      dispatch({ type: "SET_SETTINGS", payload: settings });

      await refreshDashboard();
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to load app data",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const refreshDashboard = async () => {
    try {
      const [todaysTasks, upcomingTasks, completedTodayCount, completedTodayTasks, inProgressTasks, pendingTasks, recentNotes] = await Promise.all([
        taskStorage.getTodaysTasks(),
        taskStorage.getUpcomingTasks(),
        taskStorage.getCompletedTodayCount(),
        taskStorage.getCompletedTodayTasks(),
        taskStorage.getTasksByStatus(TaskStatus.IN_PROGRESS),
        taskStorage.getTasksByStatus(TaskStatus.PENDING),
        noteStorage.getRecentNotes(5),
      ]);

      dispatch({
        type: "SET_DASHBOARD_DATA",
        payload: {
          todaysTasks,
          upcomingTasks,
          completedTodayCount,
          completedTodayTasks,
          inProgressTasks,
          pendingTasks,
          recentNotes,
        },
      });
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    }
  };

  const addTask = async (task: Task) => {
    try {
      await taskStorage.saveTask(task);
      await historyService.logTaskCreated(task.title, task.id);
      dispatch({ type: "ADD_TASK", payload: task });
      await refreshDashboard();
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to add task",
      });
    }
  };

  const updateTask = async (task: Task) => {
    try {
      await taskStorage.saveTask(task);
      
      // Log specific activity based on status change
      if (task.status === TaskStatus.COMPLETED) {
        await historyService.logTaskCompleted(task.title, task.id);
      } else if (task.status === TaskStatus.IN_PROGRESS) {
        await historyService.logTaskStarted(task.title, task.id);
      } else if (task.status === TaskStatus.PENDING) {
        await historyService.logTaskPaused(task.title, task.id);
      } else {
        await historyService.logTaskUpdated(task.title, task.id, "Status or details updated");
      }
      
      dispatch({ type: "UPDATE_TASK", payload: task });
      await refreshDashboard();
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to update task",
      });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      // Get task name before deleting for history
      const tasks = await taskStorage.getAllTasks();
      const task = tasks.find(t => t.id === id);
      
      await taskStorage.deleteTask(id);
      if (task) {
        await historyService.logTaskDeleted(task.title, id);
      }
      dispatch({ type: "DELETE_TASK", payload: id });
      await refreshDashboard();
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to delete task",
      });
    }
  };

  const addNote = async (note: Note) => {
    try {
      await noteStorage.saveNote(note);
      await historyService.logNoteCreated(note.title, note.id);
      dispatch({ type: "ADD_NOTE", payload: note });
      await refreshDashboard();
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to add note",
      });
    }
  };

  const updateNote = async (note: Note) => {
    try {
      await noteStorage.saveNote(note);
      await historyService.logNoteUpdated(note.title, note.id);
      dispatch({ type: "UPDATE_NOTE", payload: note });
      await refreshDashboard();
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to update note",
      });
    }
  };

  const deleteNote = async (id: string) => {
    try {
      // Get note title before deleting for history
      const notes = await noteStorage.getAllNotes();
      const note = notes.find(n => n.id === id);
      
      await noteStorage.deleteNote(id);
      if (note) {
        await historyService.logNoteDeleted(note.title, id);
      }
      dispatch({ type: "DELETE_NOTE", payload: id });
      await refreshDashboard();
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to delete note",
      });
    }
  };

  const updateSettings = async (settings: AppSettings) => {
    try {
      await settingsStorage.saveSettings(settings);
      dispatch({ type: "SET_SETTINGS", payload: settings });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to update settings",
      });
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  // Listen for task updates from notification actions
  useEffect(() => {
    const handleTaskUpdated = () => {
      console.log("Task updated from notification, refreshing UI...");
      loadAppData();
    };
    
    taskDueEvents.on('taskUpdated', handleTaskUpdated);
    
    return () => {
      taskDueEvents.off('taskUpdated', handleTaskUpdated);
    };
  }, []);

  const value: AppContextType = {
    state,
    dispatch,
    loadAppData,
    addTask,
    updateTask,
    deleteTask,
    addNote,
    updateNote,
    deleteNote,
    updateSettings,
    refreshDashboard,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
