const STORAGE_KEY = "sakutaos.appearance";
export const MEMO_STORAGE_KEY = "sakutaos-memobook";
export const MEMOS_CLEARED_EVENT = "sakutaos-memos-cleared";

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export const THEMES = [
  {
    id: "night",
    name: "Night",
    tone: "dark",
    accent: "#ff5b3e",
    accent2: "#ffd84d",
    screen: "#090909",
    body: "#1c1c1c",
    chassis: "radial-gradient(120% 90% at 50% 0%, #2c2c2c 0%, #101010 48%, #050505 100%)",
    bezel: "linear-gradient(180deg, #3f3f3f 0%, #1c1c1c 40%, #101010 100%)",
    glitch: ["#ffffff", "#ff8a72"],
    crt: "#ff6a4d",
    ascii: ["#24110e", "#ff5b3e", "#ffd84d", "#fff1e4"],
    topo: "#ff8a72",
    waves: { horizon: "#ff5b3e", crest: "#ffe7c2", background: "#140c0a" },
    laser: "#ff5b3e",
  },
  {
    id: "ember",
    name: "Ember",
    tone: "dark",
    accent: "#ff8a3d",
    accent2: "#ffd29a",
    screen: "#120c09",
    body: "#1c1410",
    chassis: "radial-gradient(120% 90% at 50% 0%, #3a2418 0%, #140d09 48%, #070504 100%)",
    bezel: "linear-gradient(180deg, #5a3a28 0%, #24160f 40%, #120c09 100%)",
    glitch: ["#ffe1c4", "#ff8a3d"],
    crt: "#ff9a4a",
    ascii: ["#2a140c", "#ff8a3d", "#ffd29a", "#fff4e8"],
    topo: "#ffb067",
    waves: { horizon: "#ff8a3d", crest: "#ffe2c2", background: "#1a0e09" },
    laser: "#ff7a2e",
  },
  {
    id: "glacier",
    name: "Glacier",
    tone: "dark",
    accent: "#7ad7ff",
    accent2: "#e7f8ff",
    screen: "#070d12",
    body: "#101820",
    chassis: "radial-gradient(120% 90% at 50% 0%, #1a3344 0%, #0b141c 48%, #04080c 100%)",
    bezel: "linear-gradient(180deg, #2a4a5e 0%, #12202b 40%, #0a1218 100%)",
    glitch: ["#e7f8ff", "#7ad7ff"],
    crt: "#7ad7ff",
    ascii: ["#071420", "#1e6f9a", "#7ad7ff", "#f2fbff"],
    topo: "#8fdfff",
    waves: { horizon: "#1a6f99", crest: "#e7f8ff", background: "#071018" },
    laser: "#3ec6ff",
  },
  {
    id: "violet",
    name: "Violet",
    tone: "dark",
    accent: "#c084fc",
    accent2: "#f3d9ff",
    screen: "#0d0912",
    body: "#16111c",
    chassis: "radial-gradient(120% 90% at 50% 0%, #342248 0%, #120c18 48%, #07040c 100%)",
    bezel: "linear-gradient(180deg, #4c3268 0%, #1c1228 40%, #100a16 100%)",
    glitch: ["#f6e8ff", "#c084fc"],
    crt: "#d2a4ff",
    ascii: ["#160e22", "#7c3aed", "#c084fc", "#f8efff"],
    topo: "#c89bff",
    waves: { horizon: "#7c3aed", crest: "#f3d9ff", background: "#120c18" },
    laser: "#a855f7",
  },
  {
    id: "phosphor",
    name: "Phosphor",
    tone: "dark",
    accent: "#3dff8a",
    accent2: "#d8ffe8",
    screen: "#070d09",
    body: "#0d1611",
    chassis: "radial-gradient(120% 90% at 50% 0%, #163324 0%, #0a140e 48%, #040806 100%)",
    bezel: "linear-gradient(180deg, #24543c 0%, #102016 40%, #08140e 100%)",
    glitch: ["#d8ffe8", "#3dff8a"],
    crt: "#3dff8a",
    ascii: ["#07140d", "#14914a", "#3dff8a", "#e9fff2"],
    topo: "#5dff9d",
    waves: { horizon: "#14914a", crest: "#d8ffe8", background: "#07140d" },
    laser: "#22c55e",
  },
  {
    id: "paper",
    name: "Paper",
    tone: "light",
    accent: "#c2410c",
    accent2: "#1d4ed8",
    screen: "#efeae3",
    body: "#f7f4ef",
    chassis: "radial-gradient(120% 90% at 50% 0%, #f7f4ef 0%, #e4ddd3 48%, #cfc6ba 100%)",
    bezel: "linear-gradient(180deg, #f8f5f0 0%, #ddd4c8 40%, #c9bfb2 100%)",
    ink: "#1c1917",
    muted: "rgba(28, 25, 23, 0.55)",
    glass: "rgba(255, 252, 247, 0.72)",
    glassStrong: "rgba(255, 252, 247, 0.82)",
    line: "rgba(28, 25, 23, 0.12)",
    window: "rgba(255, 252, 247, 0.88)",
    windowFocus: "rgba(255, 252, 247, 0.96)",
    glitch: ["#1c1917", "#c2410c"],
    crt: "#c2410c",
    ascii: ["#fffaf3", "#fdba74", "#c2410c", "#1c1917"],
    topo: "#9a3412",
    waves: { horizon: "#fdba74", crest: "#fff7ed", background: "#f3ece4" },
    laser: "#c2410c",
  },
];

export const BACKGROUNDS = [
  { id: "glitch", name: "Letter Glitch", hint: "Glyph field" },
  { id: "crt", name: "CRT Warp", hint: "Curved scanlines" },
  { id: "ascii", name: "Gradient ASCII", hint: "Horizon type" },
  { id: "topo", name: "Topography", hint: "Contour lines" },
  { id: "waves", name: "Gradient Waves", hint: "Lit swell" },
  { id: "laser", name: "Laser Flow", hint: "Beam and dust" },
  { id: "solid", name: "Solid", hint: "Quiet color" },
];

const DEFAULTS = {
  theme: "night",
  background: "glitch",
  vhs: true,
  brightness: 100,
  volume: 0.85,
  muted: false,
};

export function displayDefaults() {
  return {
    theme: DEFAULTS.theme,
    background: DEFAULTS.background,
    vhs: DEFAULTS.vhs,
    brightness: DEFAULTS.brightness,
  };
}

export function getTheme(id) {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function getBackground(id) {
  return BACKGROUNDS.find((item) => item.id === id) ?? BACKGROUNDS[0];
}

export function readAppearance() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "");
    return {
      theme: getTheme(raw.theme).id,
      background: getBackground(raw.background).id,
      vhs: typeof raw.vhs === "boolean" ? raw.vhs : DEFAULTS.vhs,
      brightness: clamp(raw.brightness, 35, 100, DEFAULTS.brightness),
      volume: clamp(raw.volume, 0, 1, DEFAULTS.volume),
      muted: typeof raw.muted === "boolean" ? raw.muted : DEFAULTS.muted,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeAppearance(appearance) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    /* private mode or a full disk should not block the desktop */
  }
}

export function themeStyle(theme) {
  return {
    "--pg-accent": theme.accent,
    "--pg-accent-2": theme.accent2,
    "--pg-body": theme.body,
    "--pg-screen-bg": theme.screen,
    "--pg-chassis-bg": theme.chassis,
    "--pg-bezel-bg": theme.bezel,
    "--pg-ink": theme.ink || "#f4f4f4",
    "--pg-muted": theme.muted || "rgba(255, 255, 255, 0.5)",
    "--pg-glass": theme.glass || "rgba(30, 30, 30, 0.48)",
    "--pg-glass-strong": theme.glassStrong || "rgba(22, 22, 22, 0.42)",
    "--pg-line": theme.line || "rgba(255, 255, 255, 0.16)",
    "--pg-window": theme.window || "rgba(36, 36, 36, 0.78)",
    "--pg-window-focus": theme.windowFocus || "rgba(42, 42, 42, 0.86)",
  };
}

export function nextBackground(id) {
  const index = BACKGROUNDS.findIndex((item) => item.id === id);
  return BACKGROUNDS[(index + 1) % BACKGROUNDS.length].id;
}

