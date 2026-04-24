import { Task, Note, TaskPriority, TaskStatus } from "./types";

export interface SearchFilters {
  query?: string;
  tags?: string[];
  priority?: TaskPriority[];
  status?: TaskStatus[];
  dateFrom?: number;
  dateTo?: number;
  type?: "task" | "note" | "all";
}

export interface SearchResult {
  type: "task" | "note";
  id: string;
  title: string;
  preview: string;
  tags?: string[];
  date: number;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export function searchTasks(tasks: Task[], filters: SearchFilters): Task[] {
  return tasks.filter((task) => {
    // Query filter
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(query);
      const descriptionMatch = task.description?.toLowerCase().includes(query);
      if (!titleMatch && !descriptionMatch) return false;
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(task.priority)) return false;
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(task.status)) return false;
    }

    // Date range filter
    if (filters.dateFrom && task.dueDate && task.dueDate < filters.dateFrom) return false;
    if (filters.dateTo && task.dueDate && task.dueDate > filters.dateTo) return false;

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      if (!task.tags || !filters.tags.some((tag) => task.tags?.includes(tag))) {
        return false;
      }
    }

    return true;
  });
}

export function searchNotes(notes: Note[], filters: SearchFilters): Note[] {
  return notes.filter((note) => {
    // Query filter
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.content.toLowerCase().includes(query);
      if (!titleMatch && !contentMatch) return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      if (!note.tags || !filters.tags.some((tag) => note.tags?.includes(tag))) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateFrom && note.createdAt < filters.dateFrom) return false;
    if (filters.dateTo && note.createdAt > filters.dateTo) return false;

    // Exclude archived notes
    if (note.isArchived) return false;

    return true;
  });
}

export function search(
  tasks: Task[],
  notes: Note[],
  filters: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = [];

  if (filters.type !== "note") {
    const filteredTasks = searchTasks(tasks, filters);
    results.push(
      ...filteredTasks.map((task) => ({
        type: "task" as const,
        id: task.id,
        title: task.title,
        preview: task.description || "",
        tags: task.tags,
        date: task.dueDate || task.createdAt,
        priority: task.priority,
        status: task.status,
      }))
    );
  }

  if (filters.type !== "task") {
    const filteredNotes = searchNotes(notes, filters);
    results.push(
      ...filteredNotes.map((note) => ({
        type: "note" as const,
        id: note.id,
        title: note.title,
        preview: note.content.substring(0, 100),
        tags: note.tags,
        date: note.updatedAt,
      }))
    );
  }

  // Sort by date (most recent first)
  return results.sort((a, b) => b.date - a.date);
}

export function getPreviewText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function highlightQuery(text: string, query: string): string {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}
