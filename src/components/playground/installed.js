const STORAGE_KEY = "sakuta-zanstore";

export function loadInstalledIds(validIds = []) {
  const valid = new Set(validIds);
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((id) => typeof id === "string" && valid.has(id));
  } catch {
    return [];
  }
}

export function saveInstalledIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* storage can be unavailable */
  }
}
