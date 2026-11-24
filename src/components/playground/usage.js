const STORAGE_KEY = "sakuta-zanstore-usage";
const EVENT = "zanstore-usage";

function emptyUsage() {
  return { apps: {} };
}

export function readUsage() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!raw || typeof raw !== "object" || !raw.apps || typeof raw.apps !== "object") return emptyUsage();
    const apps = {};
    for (const [id, entry] of Object.entries(raw.apps)) {
      if (!entry || typeof entry !== "object") continue;
      apps[id] = {
        ms: Number.isFinite(entry.ms) ? entry.ms : 0,
        opens: Number.isFinite(entry.opens) ? entry.opens : 0,
      };
    }
    return { apps };
  } catch {
    return emptyUsage();
  }
}

function writeUsage(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage can be unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
}

function touch(id, patch) {
  if (!id) return;
  const current = readUsage();
  const prev = current.apps[id] || { ms: 0, opens: 0 };
  current.apps[id] = { ...prev, ...patch(prev) };
  writeUsage(current);
}

export function noteOpen(id) {
  touch(id, (prev) => ({ opens: prev.opens + 1 }));
}

export function addPlayMs(id, ms) {
  if (!ms) return;
  touch(id, (prev) => ({ ms: prev.ms + ms }));
}

export function subscribeUsage(listener) {
  const onEvent = () => listener(readUsage());
  window.addEventListener(EVENT, onEvent);
  window.addEventListener("storage", onEvent);
  return () => {
    window.removeEventListener(EVENT, onEvent);
    window.removeEventListener("storage", onEvent);
  };
}
