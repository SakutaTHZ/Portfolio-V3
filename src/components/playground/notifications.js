const STORAGE_KEY = "sakuta-notifications";
const LIMIT = 80;

export const NOTIFICATION_RANGES = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "all", label: "All" },
];

export function loadNotifications() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (row) =>
          row &&
          typeof row.id === "string" &&
          typeof row.title === "string" &&
          typeof row.body === "string" &&
          Number.isFinite(row.at)
      )
      .slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function saveNotifications(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.slice(0, LIMIT)));
  } catch {
    /* storage can be unavailable */
  }
}

export function createNotification({ title, body, app } = {}) {
  const name = String(title || "SakutaOS").slice(0, 48);
  return {
    id: `nt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: name,
    body: String(body || "").slice(0, 180),
    app: String(app || name).slice(0, 48),
    at: Date.now(),
  };
}

export function startOfWeek(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function inNotificationRange(at, range, now = Date.now()) {
  if (range === "all") return true;
  const date = new Date(at);
  const current = new Date(now);
  if (range === "today") {
    return (
      date.getFullYear() === current.getFullYear() &&
      date.getMonth() === current.getMonth() &&
      date.getDate() === current.getDate()
    );
  }
  return date >= startOfWeek(current);
}

export function formatAgo(at, now = Date.now()) {
  const delta = Math.max(0, now - at);
  if (delta < 15000) return "Now";
  if (delta < 60000) return `${Math.floor(delta / 1000)}s`;
  if (delta < 3600000) return `${Math.floor(delta / 60000)}m`;
  if (delta < 86400000) return `${Math.floor(delta / 3600000)}h`;
  const date = new Date(at);
  const current = new Date(now);
  if (date.getFullYear() === current.getFullYear()) {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "2-digit" });
}

export function emptyNotificationCopy(range) {
  if (range === "today") return "Nothing from today.";
  if (range === "week") return "Nothing from this week.";
  return "No notifications yet.";
}
