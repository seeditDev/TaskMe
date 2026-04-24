export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  const todayOnly = new Date(today);
  todayOnly.setHours(0, 0, 0, 0);

  const yesterdayOnly = new Date(yesterday);
  yesterdayOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Today";
  }

  if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Yesterday";
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowOnly = new Date(tomorrow);
  tomorrowOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return "Tomorrow";
  }

  // Check if within 7 days
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  if (dateOnly.getTime() < sevenDaysFromNow.getTime()) {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)} at ${formatTime(timestamp)}`;
}

export function isToday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isTomorrow(timestamp: number): boolean {
  const date = new Date(timestamp);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

export function isOverdue(timestamp: number): boolean {
  const now = new Date();
  const date = new Date(timestamp);
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date.getTime() < now.getTime();
}

export function getDaysDifference(timestamp: number): number {
  const now = new Date();
  const date = new Date(timestamp);
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getStartOfDay(timestamp?: number): number {
  const date = timestamp ? new Date(timestamp) : new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function getEndOfDay(timestamp?: number): number {
  const date = timestamp ? new Date(timestamp) : new Date();
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function getStartOfWeek(timestamp?: number): number {
  const date = timestamp ? new Date(timestamp) : new Date();
  const day = date.getDay();
  const diff = date.getDate() - day;
  const sunday = new Date(date.setDate(diff));
  sunday.setHours(0, 0, 0, 0);
  return sunday.getTime();
}

export function getEndOfWeek(timestamp?: number): number {
  const date = timestamp ? new Date(timestamp) : new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + 6;
  const saturday = new Date(date.setDate(diff));
  saturday.setHours(23, 59, 59, 999);
  return saturday.getTime();
}

export function getStartOfMonth(timestamp?: number): number {
  const date = timestamp ? new Date(timestamp) : new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function getEndOfMonth(timestamp?: number): number {
  const date = timestamp ? new Date(timestamp) : new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function addMinutes(timestamp: number, minutes: number): number {
  return timestamp + minutes * 60 * 1000;
}

export function addHours(timestamp: number, hours: number): number {
  return timestamp + hours * 60 * 60 * 1000;
}

export function addDays(timestamp: number, days: number): number {
  return timestamp + days * 24 * 60 * 60 * 1000;
}

export function addWeeks(timestamp: number, weeks: number): number {
  return addDays(timestamp, weeks * 7);
}

export function addMonths(timestamp: number, months: number): number {
  const date = new Date(timestamp);
  date.setMonth(date.getMonth() + months);
  return date.getTime();
}

export function addYears(timestamp: number, years: number): number {
  const date = new Date(timestamp);
  date.setFullYear(date.getFullYear() + years);
  return date.getTime();
}
