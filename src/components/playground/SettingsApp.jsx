import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HardDrive, Monitor, Volume2 } from "lucide-react";
import {
  BACKGROUNDS,
  displayDefaults,
  MEMO_STORAGE_KEY,
  MEMOS_CLEARED_EVENT,
  THEMES,
} from "./appearance";
import { useDesktop } from "./desktopContext";

const PANES = [
  { id: "display", name: "Display", icon: Monitor },
  { id: "sound", name: "Sound", icon: Volume2 },
  { id: "storage", name: "Storage", icon: HardDrive },
];

function formatBytes(bytes) {
  if (!bytes) return "Empty";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function storedBytes(key) {
  try {
    const value = localStorage.getItem(key);
    if (value == null) return 0;
    return new Blob([value]).size;
  } catch {
    return 0;
  }
}

export function DesktopMenu({ menu, screenRef, onClose, onCycle, onOpenSettings }) {
  const nodeRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!menu || !nodeRef.current) return;
    const screen = screenRef.current?.getBoundingClientRect();
    const box = nodeRef.current.getBoundingClientRect();
    const maxX = (screen?.width || window.innerWidth) - box.width - 10;
    const maxY = (screen?.height || window.innerHeight) - box.height - 10;
    const localX = menu.x - (screen?.left ?? 0);
    const localY = menu.y - (screen?.top ?? 0);
    setPos({
      x: Math.min(Math.max(8, localX), Math.max(8, maxX)),
      y: Math.min(Math.max(8, localY), Math.max(8, maxY)),
    });
  }, [menu, screenRef]);

  useEffect(() => {
    if (!menu) return undefined;
    const close = () => onClose();
    window.addEventListener("pointerdown", close);
    window.addEventListener("blur", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("blur", close);
    };
  }, [menu, onClose]);

  return (
    <AnimatePresence>
      {menu && (
        <motion.div
          ref={nodeRef}
          className="pg-menu"
          role="menu"
          aria-label="Desktop"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          style={{ left: pos.x, top: pos.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button type="button" role="menuitem" onClick={onCycle}>
            Next background
          </button>
          <button type="button" role="menuitem" onClick={onOpenSettings}>
            Settings
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DisplayPane({ settings, patchSettings, theme }) {
  return (
    <>
      <header className="pg-settings-head">
        <div>
          <h2>Display</h2>
          <p>Theme, wallpaper, and how bright the desktop looks.</p>
        </div>
        <span className="pg-display-now">
          {theme.name}
          <i style={{ background: theme.accent }} />
        </span>
      </header>

      <p className="pg-display-label">Theme</p>
      <div className="pg-theme-row" role="listbox" aria-label="Theme">
        {THEMES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={settings.theme === item.id}
            className="pg-theme-swatch"
            style={{ "--swatch": item.accent, "--swatch-2": item.accent2 }}
            onClick={() => patchSettings({ theme: item.id })}
          >
            <span />
            {item.name}
          </button>
        ))}
      </div>

      <p className="pg-display-label">Background</p>
      <div className="pg-wall-grid" role="listbox" aria-label="Background">
        {BACKGROUNDS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={settings.background === item.id}
            className="pg-wall-card"
            data-wall={item.id}
            onClick={() => patchSettings({ background: item.id })}
          >
            <span className="pg-wall-preview" style={{ "--swatch": theme.accent, "--swatch-2": theme.accent2 }} />
            <span>
              <strong>{item.name}</strong>
              <em>{item.hint}</em>
            </span>
          </button>
        ))}
      </div>

      <label className="pg-settings-slider">
        <span>
          <strong>Brightness</strong>
          <em>{Math.round(settings.brightness)}%</em>
        </span>
        <input
          type="range"
          min={35}
          max={100}
          step={1}
          value={settings.brightness}
          aria-label="Brightness"
          onChange={(event) => patchSettings({ brightness: Number(event.target.value) })}
        />
      </label>

      <label className="pg-settings-toggle">
        <span>
          <strong>CRT filter</strong>
          <em>Scanlines, bloom, and color bleed over the desktop</em>
        </span>
        <input
          type="checkbox"
          checked={settings.vhs}
          onChange={(event) => patchSettings({ vhs: event.target.checked })}
        />
      </label>
    </>
  );
}

function SoundPane({ settings, patchSettings }) {
  const level = settings.muted ? 0 : settings.volume;

  return (
    <>
      <header className="pg-settings-head">
        <div>
          <h2>Sound</h2>
          <p>The shelf player uses this output level.</p>
        </div>
      </header>

      <label className="pg-settings-slider">
        <span>
          <strong>Volume</strong>
          <em>{settings.muted ? "Muted" : `${Math.round(level * 100)}%`}</em>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={level}
          aria-label="Volume"
          onChange={(event) => patchSettings({ volume: Number(event.target.value), muted: false })}
        />
      </label>

      <label className="pg-settings-toggle">
        <span>
          <strong>Mute</strong>
          <em>Silence the player without losing the volume level</em>
        </span>
        <input
          type="checkbox"
          checked={settings.muted}
          onChange={(event) => patchSettings({ muted: event.target.checked })}
        />
      </label>
    </>
  );
}

function StoragePane({ patchSettings }) {
  const [revision, setRevision] = useState(0);
  const [caches, setCaches] = useState([]);
  const [note, setNote] = useState("");
  const displayBytes = storedBytes("sakutaos.appearance");
  const memoBytes = storedBytes(MEMO_STORAGE_KEY);

  useEffect(() => {
    let alive = true;
    if (!window.caches?.keys) {
      setCaches([]);
      return undefined;
    }
    window.caches.keys().then((keys) => {
      if (alive) setCaches(keys);
    }).catch(() => {
      if (alive) setCaches([]);
    });
    return () => {
      alive = false;
    };
  }, [revision]);

  function flash(message) {
    setNote(message);
    window.setTimeout(() => setNote(""), 1600);
  }

  return (
    <>
      <header className="pg-settings-head">
        <div>
          <h2>Storage</h2>
          <p>Everything here stays in this browser. Nothing is uploaded.</p>
        </div>
      </header>

      <ul className="pg-store-list">
        <li>
          <span>
            <strong>Display & sound</strong>
            <em>{formatBytes(displayBytes)} · theme, wallpaper, brightness, volume</em>
          </span>
          <button
            type="button"
            onClick={() => {
              patchSettings(displayDefaults());
              setRevision((value) => value + 1);
              flash("Display settings reset.");
            }}
          >
            Reset
          </button>
        </li>
        <li>
          <span>
            <strong>memoBook</strong>
            <em>{formatBytes(memoBytes)} · pages saved on this browser</em>
          </span>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(MEMO_STORAGE_KEY);
              window.dispatchEvent(new Event(MEMOS_CLEARED_EVENT));
              setRevision((value) => value + 1);
              flash("Memos cleared.");
            }}
          >
            Clear
          </button>
        </li>
        <li>
          <span>
            <strong>Cached files</strong>
            <em>
              {window.caches
                ? caches.length
                  ? `${caches.length} cache${caches.length === 1 ? "" : "s"} for offline pages`
                  : "No cached files"
                : "This browser does not expose a cache"}
            </em>
          </span>
          <button
            type="button"
            disabled={!window.caches || !caches.length}
            onClick={async () => {
              const keys = await window.caches.keys();
              await Promise.all(keys.map((key) => window.caches.delete(key)));
              setRevision((value) => value + 1);
              flash("Cached files cleared.");
            }}
          >
            Clear
          </button>
        </li>
      </ul>
      <p className="pg-settings-note" aria-live="polite">{note || "Clearing memos restores the starter page."}</p>
    </>
  );
}

export default function SettingsApp() {
  const { settings, patchSettings, section, setSection } = useDesktop();
  const [pane, setPane] = useState(section || "display");
  const theme = THEMES.find((item) => item.id === settings.theme) ?? THEMES[0];

  useEffect(() => {
    if (section) setPane(section);
  }, [section]);

  return (
    <div className="pg-settings">
      <nav className="pg-settings-nav" aria-label="Settings">
        <p className="pg-display-kicker">SakutaOS</p>
        {PANES.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={pane === item.id ? "page" : undefined}
              onClick={() => {
                setPane(item.id);
                setSection(item.id);
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
              {item.name}
            </button>
          );
        })}
      </nav>
      <div className="pg-settings-pane">
        {pane === "sound" ? (
          <SoundPane settings={settings} patchSettings={patchSettings} />
        ) : pane === "storage" ? (
          <StoragePane patchSettings={patchSettings} />
        ) : (
          <DisplayPane settings={settings} patchSettings={patchSettings} theme={theme} />
        )}
      </div>
    </div>
  );
}
