import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Layers, X } from "lucide-react";
import { desktopWithInstalled, findPlaygroundItem, flattenPlaygroundItems, playgroundRoot, storeApps, storeItem } from "@/pages/playground/registry";
import { prefersReducedMotion } from "@/hooks/hooks";
import logo from "@/assets/images/logo.png";
import { VHS } from "@/components/canvasui/VHS";
import { getTheme, nextBackground, readAppearance, themeStyle, writeAppearance } from "./appearance";
import Wallpaper from "./Wallpaper";
import SettingsApp, { DesktopMenu } from "./SettingsApp";
import { DesktopContext, WindowFrameContext } from "./desktopContext";
import { loadInstalledIds, saveInstalledIds } from "./installed";
import { createNotification, loadNotifications, saveNotifications } from "./notifications";
import GatoJumpscare from "@/components/GatoJumpscare";
import PlaygroundTerminal from "./PlaygroundTerminal";
import MacWindow, { AppGlyph, DesktopIcon, FinderBody, FolderGlyph } from "./MacWindow";
import SakutaBoot from "./SakutaBoot";
import StartMenu from "./StartMenu";
import ContextMenu, { InfoCard, PowerOverlay } from "./ContextMenu";
import MusicPlayer from "./MusicPlayer";
import StatusCluster from "./StatusCluster";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import "./playground-desktop.css";

const TERMINAL_ID = "__sakuta-terminal";
const SETTINGS_ID = "__sakuta-settings";
const bleedItem = flattenPlaygroundItems().find((item) => item.name === "Bleed");

const terminalItem = {
  type: "app",
  id: TERMINAL_ID,
  name: "Terminal",
  width: 520,
  height: 440,
  sourcePath: "src/components/PortfolioTerminal.jsx",
};

const settingsItem = {
  type: "app",
  id: SETTINGS_ID,
  name: "Settings",
  width: 780,
  height: 640,
  sourcePath: "src/components/playground/SettingsApp.jsx",
};

function DockTip({ label, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={12} className="z-[80]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function screenBox(screenEl) {
  const rect = screenEl?.getBoundingClientRect();
  return {
    width: rect?.width || window.innerWidth,
    height: rect?.height || window.innerHeight,
  };
}

function originFromEl(el, box, screenEl) {
  if (!el) return "50% 50%";
  const icon = el.getBoundingClientRect();
  const screen = screenEl?.getBoundingClientRect();
  const left = screen?.left ?? 0;
  const top = screen?.top ?? 0;
  return `${icon.left + icon.width / 2 - left - box.x}px ${icon.top + icon.height / 2 - top - box.y}px`;
}

function clampWindow(x, y, width, height, screenEl) {
  const { width: maxW, height: maxH } = screenBox(screenEl);
  const nextWidth = Math.min(Math.max(320, width), Math.max(320, maxW - 16));
  const nextHeight = Math.min(Math.max(220, height), Math.max(220, maxH - 16));
  return {
    x: Math.min(Math.max(-nextWidth + 168, x), Math.max(0, maxW - nextWidth)),
    y: Math.min(Math.max(8, y), Math.max(8, maxH - 48)),
    width: nextWidth,
    height: nextHeight,
  };
}

function nextBox(count, item, screenEl) {
  const { width, height } = screenBox(screenEl);
  const mobile = width < 768;
  if (mobile) {
    return clampWindow(8, 12, width - 16, height - 118, screenEl);
  }

  const offset = (count % 7) * 26;
  return clampWindow(
    72 + offset,
    36 + offset,
    item.width || 720,
    item.height || 480,
    screenEl
  );
}

function useMobileDock() {
  const query = "(max-width: 767px)";
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMobile(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return mobile;
}

function RunningGlyph({ win, size }) {
  if (win.type === "folder") return size ? <FolderGlyph size={size} /> : <FolderGlyph />;
  return <AppGlyph name={win.title} size={size} />;
}

function RecentApps({ apps, onDismiss, onActivate, onCloseApp, onCloseAll }) {
  return (
    <motion.div
      className="pg-recents-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <button type="button" className="pg-recents-scrim" aria-label="Close open apps" onClick={onDismiss} />
      <motion.section
        className="pg-recents"
        role="dialog"
        aria-label="Open apps"
        initial={{ y: 28 }}
        animate={{ y: 0 }}
        exit={{ y: 24 }}
        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
      >
        <div className="pg-recents-head">
          <p className="pg-recents-label">Open apps</p>
          <button type="button" className="pg-recents-close-all" onClick={onCloseAll}>
            <X size={14} strokeWidth={2.2} />
            Close all
          </button>
        </div>
        <div className="pg-recents-track">
          {apps.map((win) => (
            <article key={win.id} className="pg-recent-card" data-minimized={win.minimized || undefined}>
              <header>
                <RunningGlyph win={win} size={22} />
                <span>{win.title}</span>
                <button type="button" aria-label={`Close ${win.title}`} onClick={() => onCloseApp(win.id)}>
                  <X size={14} strokeWidth={2} />
                </button>
              </header>
              <button
                type="button"
                className="pg-recent-open"
                aria-label={win.minimized ? `Restore ${win.title}` : `Show ${win.title}`}
                onClick={() => onActivate(win.item)}
              >
                <span className="pg-recent-stage">
                  <RunningGlyph win={win} size={68} />
                  {win.minimized && <em>Minimized</em>}
                </span>
              </button>
            </article>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}

function maximizedBox(screenEl) {
  const { width, height } = screenBox(screenEl);
  return {
    x: 0,
    y: 0,
    width,
    height,
  };
}

export default function PlaygroundDesktop() {
  const reducedMotion = prefersReducedMotion();
  const screenRef = useRef(null);
  const [booting, setBooting] = useState(() => !prefersReducedMotion());
  const [windows, setWindows] = useState([]);
  const [focusedId, setFocusedId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [startOpen, setStartOpen] = useState(false);
  const [recentsOpen, setRecentsOpen] = useState(false);
  const mobile = useMobileDock();
  const [contextMenu, setContextMenu] = useState(null);
  const [infoItem, setInfoItem] = useState(null);
  const [power, setPower] = useState(null);
  const [appearance, setAppearance] = useState(readAppearance);
  const [settingsSection, setSettingsSection] = useState("display");
  const [desktopMenu, setDesktopMenu] = useState(null);
  const [notes, setNotes] = useState(loadNotifications);
  const [installedIds, setInstalledIds] = useState(() => loadInstalledIds(storeApps.map((app) => app.id)));
  const zRef = useRef(20);
  const theme = getTheme(appearance.theme);

  const patchAppearance = useCallback((patch) => {
    setAppearance((current) => {
      const next = { ...current, ...patch };
      writeAppearance(next);
      return next;
    });
  }, []);

  const notify = useCallback((input) => {
    const note = createNotification(input);
    setNotes((current) => [note, ...current].slice(0, 80));
  }, []);

  const clearNotes = useCallback(() => {
    setNotes([]);
  }, []);

  useEffect(() => {
    saveNotifications(notes);
  }, [notes]);

  useEffect(() => {
    saveInstalledIds(installedIds);
  }, [installedIds]);

  const desktopRoot = useMemo(() => desktopWithInstalled(installedIds), [installedIds]);
  const finderItem = useMemo(
    () => ({
      ...desktopRoot,
      name: "Folder",
      sourcePath: "src/pages/playground",
    }),
    [desktopRoot]
  );

  const startApps = useMemo(() => {
    const folders = desktopRoot.children.filter((item) => item.type === "folder");
    return [finderItem, settingsItem, terminalItem, ...folders, ...flattenPlaygroundItems(desktopRoot)];
  }, [desktopRoot, finderItem]);

  const openItems = useMemo(() => {
    const seen = new Map();
    windows.forEach((win) => {
      if (!seen.has(win.itemId)) seen.set(win.itemId, win);
    });
    return [...seen.values()];
  }, [windows]);

  const bringToFront = useCallback((id) => {
    zRef.current += 1;
    const nextZ = zRef.current;
    setFocusedId(id);
    setWindows((current) =>
      current.map((win) => (win.id === id ? { ...win, z: nextZ, minimized: false } : win))
    );
  }, []);

  const openContext = useCallback((item, point) => {
    setStartOpen(false);
    setRecentsOpen(false);
    setContextMenu({ item, x: point.x, y: point.y });
  }, []);

  const openItem = useCallback((item, sourceEl) => {
    setStartOpen(false);
    setRecentsOpen(false);
    setDesktopMenu(null);
    setContextMenu(null);
    const id = `${item.type}:${item.id}`;
    setSelectedId(item.id);
    zRef.current += 1;
    const nextZ = zRef.current;
    setFocusedId(id);
    setWindows((current) => {
      const existing = current.find((win) => win.itemId === item.id);
      if (existing) {
        return current.map((win) =>
          win.id === existing.id ? { ...win, minimized: false, z: nextZ } : win
        );
      }

      const box = nextBox(current.filter((win) => !win.minimized).length, item, screenRef.current);
      return [
        ...current,
        {
          id,
          itemId: item.id,
          type: item.type,
          title: item.name,
          item,
          origin: originFromEl(sourceEl, box, screenRef.current),
          maximized: false,
          minimized: false,
          restore: box,
          z: nextZ,
          ...box,
        },
      ];
    });
  }, []);

  const closeWindow = useCallback((id) => {
    setWindows((current) => current.filter((win) => win.id !== id));
    setFocusedId((current) => (current === id ? null : current));
  }, []);

  const installApp = useCallback((storeId) => {
    if (!storeApps.some((app) => app.id === storeId)) return;
    setInstalledIds((current) => (current.includes(storeId) ? current : [...current, storeId]));
  }, []);

  const uninstallApp = useCallback((storeId) => {
    if (!storeId) return;
    setInstalledIds((current) => current.filter((id) => id !== storeId));
    setWindows((current) => {
      const closing = current.filter((win) => win.item?.storeId === storeId).map((win) => win.id);
      if (closing.length) {
        setFocusedId((focused) => (closing.includes(focused) ? null : focused));
      }
      return current.filter((win) => win.item?.storeId !== storeId);
    });
  }, []);

  const openStoreApp = useCallback(
    (storeId) => {
      if (!installedIds.includes(storeId)) return;
      const app = storeApps.find((entry) => entry.id === storeId);
      if (app) openItem(storeItem(app));
    },
    [installedIds, openItem]
  );

  const closeAllWindows = useCallback(() => {
    setWindows([]);
    setFocusedId(null);
    setStartOpen(false);
    setRecentsOpen(false);
    setContextMenu(null);
    setDesktopMenu(null);
  }, []);

  const minimizeWindow = useCallback((id) => {
    setWindows((current) =>
      current.map((win) => (win.id === id ? { ...win, minimized: true } : win))
    );
    setFocusedId((current) => (current === id ? null : current));
  }, []);

  const pressDockItem = useCallback((item, sourceEl) => {
    setStartOpen(false);
    setRecentsOpen(false);
    setDesktopMenu(null);
    setContextMenu(null);
    const existing = windows.find((win) => win.itemId === item.id);
    if (!existing) {
      openItem(item, sourceEl);
      return;
    }
    if (!existing.minimized && focusedId === existing.id) {
      minimizeWindow(existing.id);
      return;
    }
    bringToFront(existing.id);
  }, [bringToFront, focusedId, minimizeWindow, openItem, windows]);

  const toggleMaximize = useCallback((id) => {
    setStartOpen(false);
    setWindows((current) =>
      current.map((win) => {
        if (win.id !== id) return win;
        if (win.maximized) {
          return { ...win, maximized: false, minimized: false, ...win.restore };
        }
        const restore = { x: win.x, y: win.y, width: win.width, height: win.height };
        return { ...win, maximized: true, minimized: false, restore, ...maximizedBox(screenRef.current) };
      })
    );
    setFocusedId(id);
  }, []);

  const moveWindow = useCallback((id, x, y) => {
    setWindows((current) =>
      current.map((win) => {
        if (win.id !== id) return win;
        const next = clampWindow(x, y, win.width, win.height, screenRef.current);
        return { ...win, x: next.x, y: next.y };
      })
    );
  }, []);

  const resizeWindow = useCallback((id, width, height) => {
    setWindows((current) =>
      current.map((win) => {
        if (win.id !== id) return win;
        const next = clampWindow(win.x, win.y, width, height, screenRef.current);
        return { ...win, width: next.width, height: next.height };
      })
    );
  }, []);

  const shutdown = useCallback(() => {
    setStartOpen(false);
    setPower("shutdown");
    window.setTimeout(() => {
      window.location.assign("/");
    }, 1100);
  }, []);

  const restart = useCallback(() => {
    setStartOpen(false);
    setPower("restart");
    window.setTimeout(() => {
      window.location.reload();
    }, 1100);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (infoItem) {
        setInfoItem(null);
        return;
      }
      if (desktopMenu) {
        setDesktopMenu(null);
        return;
      }
      if (contextMenu) {
        setContextMenu(null);
        return;
      }
      if (recentsOpen) {
        setRecentsOpen(false);
        return;
      }
      if (startOpen) {
        setStartOpen(false);
        return;
      }
      if (focusedId) closeWindow(focusedId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeWindow, contextMenu, desktopMenu, focusedId, infoItem, recentsOpen, startOpen]);

  const openSettings = useCallback((section = "display", sourceEl) => {
    setSettingsSection(section);
    openItem(settingsItem, sourceEl);
  }, [openItem]);

  const openDesktopMenu = useCallback((event) => {
    const blocked = event.target.closest(
      ".pg-window, .pg-shelf, .pg-status, .pg-start, .pg-menu, .pg-icon, .pg-display, .pg-display-scrim, .pg-info, .pg-player, .pg-recents"
    );
    if (blocked) return;
    event.preventDefault();
    setStartOpen(false);
    setRecentsOpen(false);
    setContextMenu(null);
    setDesktopMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const terminalOpen = openItems.some((win) => win.itemId === TERMINAL_ID);
  const bleedOpen = openItems.some((win) => win.itemId === bleedItem?.id);
  const runningApps = useMemo(() => {
    const pinned = new Set([playgroundRoot.id, TERMINAL_ID, bleedItem?.id].filter(Boolean));
    return openItems.filter((win) => !pinned.has(win.itemId));
  }, [openItems]);
  const dockAppCount = (bleedItem ? 3 : 2) + runningApps.length;
  const stackRunning = mobile && dockAppCount > (bleedItem ? 3 : 2);

  useEffect(() => {
    if (!stackRunning) setRecentsOpen(false);
  }, [stackRunning]);
  const fullscreen = windows.some((win) => win.maximized && !win.minimized);

  const stage = (
    <>
          <div className="pg-screen-wallpaper" aria-hidden="true">
            <Wallpaper
              key={`${appearance.background}:${theme.id}`}
              backgroundId={appearance.background}
              theme={theme}
            />
          </div>

          <div
            className="pg-desktop"
            data-fullscreen={fullscreen || undefined}
            onContextMenu={openDesktopMenu}
          >
            <div
              className="pg-desktop-icons"
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) setSelectedId(null);
              }}
            >
              {desktopRoot.children.map((item) => (
                <DesktopIcon
                  key={item.id}
                  item={item}
                  selected={selectedId === item.id}
                  onSelect={setSelectedId}
                  onOpen={openItem}
                  onContext={openContext}
                />
              ))}
            </div>

            {!windows.length && !booting && (
              <p className="pg-hint">
                {playgroundRoot.children.length
                  ? "Click an icon to open it in a window."
                  : "Add a component in src/pages/playground to see it here."}
              </p>
            )}

            <div className="pg-windows">
            <AnimatePresence>
              {windows.map((win) => {
                const App = win.item.component;
                return (
                  <MacWindow
                    key={win.id}
                    win={win}
                    focused={focusedId === win.id}
                    reducedMotion={reducedMotion}
                    onFocus={() => bringToFront(win.id)}
                    onClose={() => closeWindow(win.id)}
                    onMinimize={() => minimizeWindow(win.id)}
                    onMaximize={() => toggleMaximize(win.id)}
                    onMove={(x, y) => moveWindow(win.id, x, y)}
                    onResize={(width, height) => resizeWindow(win.id, width, height)}
                  >
                    {win.itemId === SETTINGS_ID ? (
                      <SettingsApp />
                    ) : win.itemId === TERMINAL_ID ? (
                      <PlaygroundTerminal
                        extras={[finderItem, settingsItem, terminalItem, bleedItem].filter(Boolean)}
                        onOpen={openItem}
                        onExit={() => closeWindow(win.id)}
                      />
                    ) : win.type === "file" ? (
                      <pre className="pg-file-view">{win.item.source}</pre>
                    ) : win.type === "folder" ? (
                      <FinderBody
                        folder={findPlaygroundItem(win.item.id, desktopRoot) || win.item}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onOpen={openItem}
                        onContext={openContext}
                      />
                    ) : App ? (
                      <WindowFrameContext.Provider
                        value={{
                          minimized: win.minimized,
                          minimize: () => minimizeWindow(win.id),
                          restore: () => bringToFront(win.id),
                        }}
                      >
                        <App />
                      </WindowFrameContext.Provider>
                    ) : (
                      <p className="pg-window-fallback">This file has no default export.</p>
                    )}
                  </MacWindow>
                );
              })}
            </AnimatePresence>
            </div>

            <StartMenu
              open={startOpen}
              apps={startApps}
              onClose={() => setStartOpen(false)}
              onOpen={openItem}
              onContext={openContext}
              onShutdown={shutdown}
              onRestart={restart}
            />

            <ContextMenu
              menu={contextMenu}
              screenRef={screenRef}
              onOpen={openItem}
              onClose={() => setContextMenu(null)}
              onInfo={setInfoItem}
              onUninstall={(item) => uninstallApp(item.storeId)}
            />
            {infoItem && <InfoCard item={infoItem} onClose={() => setInfoItem(null)} />}

            <AnimatePresence>
              {stackRunning && recentsOpen && (
                <RecentApps
                  key="recents"
                  apps={runningApps}
                  onDismiss={() => setRecentsOpen(false)}
                  onActivate={pressDockItem}
                  onCloseApp={closeWindow}
                  onCloseAll={closeAllWindows}
                />
              )}
            </AnimatePresence>

            <div className="pg-shelf">
            <MusicPlayer />
            <TooltipProvider delayDuration={280}>
            <nav className="pg-dock" aria-label="SakutaOS dock">
              <button
                type="button"
                className="pg-dock-item"
                aria-label="Open start menu"
                aria-expanded={startOpen}
                onClick={() => {
                  setContextMenu(null);
                  setDesktopMenu(null);
                  setRecentsOpen(false);
                  setStartOpen((value) => !value);
                }}
              >
                <span className="pg-dock-glyph pg-dock-home">
                  <img src={logo} alt="" width={28} height={28} draggable={false} />
                </span>
              </button>
              <span className="pg-dock-separator" aria-hidden="true" />
              <DockTip label="Folder">
              <button
                type="button"
                className="pg-dock-item"
                aria-label="Open Folder"
                onClick={(event) => pressDockItem(finderItem, event.currentTarget)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  openContext(finderItem, { x: event.clientX, y: event.clientY });
                }}
              >
                <span className="pg-dock-glyph">
                  <FolderGlyph />
                </span>
                {openItems.some((win) => win.itemId === playgroundRoot.id) && (
                  <span
                    className="pg-dock-dot"
                    data-minimized={openItems.find((win) => win.itemId === playgroundRoot.id)?.minimized || undefined}
                  />
                )}
              </button>
              </DockTip>
              <DockTip label="Terminal">
              <button
                type="button"
                className="pg-dock-item"
                aria-label="Open Terminal"
                onClick={(event) => pressDockItem(terminalItem, event.currentTarget)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  openContext(terminalItem, { x: event.clientX, y: event.clientY });
                }}
              >
                <span className="pg-dock-glyph">
                  <AppGlyph name="Terminal" />
                </span>
                {terminalOpen && (
                  <span
                    className="pg-dock-dot"
                    data-minimized={openItems.find((win) => win.itemId === TERMINAL_ID)?.minimized || undefined}
                  />
                )}
              </button>
              </DockTip>
              {bleedItem && (
                <DockTip label="Bleed">
                <button
                  type="button"
                  className="pg-dock-item"
                  aria-label="Open Bleed"
                  onClick={(event) => pressDockItem(bleedItem, event.currentTarget)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    openContext(bleedItem, { x: event.clientX, y: event.clientY });
                  }}
                >
                  <span className="pg-dock-glyph">
                    <AppGlyph name="Bleed" />
                  </span>
                  {bleedOpen && (
                    <span
                      className="pg-dock-dot"
                      data-minimized={openItems.find((win) => win.itemId === bleedItem.id)?.minimized || undefined}
                    />
                  )}
                </button>
                </DockTip>
              )}
              {stackRunning ? (
                <button
                  type="button"
                  className="pg-dock-item"
                  aria-label={`Open apps, ${runningApps.length} open`}
                  aria-expanded={recentsOpen}
                  onClick={() => {
                    setStartOpen(false);
                    setContextMenu(null);
                    setDesktopMenu(null);
                    setRecentsOpen((value) => !value);
                  }}
                >
                  <span className="pg-dock-glyph pg-dock-stack">
                    <Layers size={18} strokeWidth={1.8} />
                  </span>
                  <span className="pg-dock-count">{runningApps.length}</span>
                </button>
              ) : (
                runningApps.map((win) => (
                  <DockTip key={win.id} label={win.title}>
                  <button
                    type="button"
                    className="pg-dock-item"
                    aria-label={win.minimized ? `Restore ${win.title}` : win.title}
                    onClick={(event) => pressDockItem(win.item, event.currentTarget)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      openContext(win.item, { x: event.clientX, y: event.clientY });
                    }}
                  >
                    <span className="pg-dock-glyph">
                      <RunningGlyph win={win} />
                    </span>
                    <span className="pg-dock-dot" data-minimized={win.minimized || undefined} />
                  </button>
                  </DockTip>
                ))
              )}
              {!mobile && windows.length > 0 && (
                <>
                  <span className="pg-dock-separator" aria-hidden="true" />
                  <DockTip label="Close all">
                  <button
                    type="button"
                    className="pg-dock-item"
                    aria-label="Close all windows"
                    onClick={closeAllWindows}
                  >
                    <span className="pg-dock-glyph pg-dock-close-all">
                      <X size={16} strokeWidth={2.2} />
                    </span>
                  </button>
                  </DockTip>
                </>
              )}
            </nav>
            </TooltipProvider>
            </div>
            <StatusCluster
              notes={notes}
              onClear={clearNotes}
              onOpenNote={(note, sourceEl) => {
                if (note.app === "Settings") {
                  openSettings("display", sourceEl);
                  return;
                }
                const item = flattenPlaygroundItems().find((entry) => entry.name === note.app);
                if (item) openItem(item, sourceEl);
              }}
              onOpenTimer={(sourceEl) => {
                const timer = flattenPlaygroundItems().find((item) => item.name === "Timer");
                if (timer) openItem(timer, sourceEl);
              }}
            />
            <DesktopMenu
              menu={desktopMenu}
              screenRef={screenRef}
              onClose={() => setDesktopMenu(null)}
              onCycle={() => {
                patchAppearance({ background: nextBackground(appearance.background) });
                setDesktopMenu(null);
              }}
              onOpenSettings={() => {
                setDesktopMenu(null);
                openSettings("display");
              }}
            />
            <div
              className="pg-dimmer"
              style={{ opacity: (100 - appearance.brightness) / 115 }}
              aria-hidden="true"
            />
          </div>

          <GatoJumpscare />
          {booting && <SakutaBoot onDone={() => setBooting(false)} />}
          {power && <PowerOverlay mode={power} />}
    </>
  );

  const desktopApi = {
    settings: appearance,
    patchSettings: patchAppearance,
    section: settingsSection,
    setSection: setSettingsSection,
    notify,
    installedIds,
    installApp,
    uninstallApp,
    openStoreApp,
  };

  return (
    <DesktopContext.Provider value={desktopApi}>
    <div className="pg-chassis" data-theme={theme.id} data-tone={theme.tone} style={themeStyle(theme)}>
      <div className="pg-bezel">
        <div className="pg-screen" ref={screenRef}>
          {appearance.vhs ? (
            <VHS
              className="pg-vhs"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              speed={0.1}
              wave={1}
              jitter={0.1}
              crease={0.05}
              switching={0.05}
              switchingHeight={0.02}
              bloom={0.4}
              aberration={2}
              acBeat={1}
              grain={0.02}
              scanlines={0.1}
              vignette={0}
              barrel={0}
              saturation={1}
              exposure={1}
            >
              {stage}
            </VHS>
          ) : (
            stage
          )}
        </div>
      </div>
      <div className="pg-chin">
        <span className="pg-led" data-on={!booting || undefined} />
        <span>SakutaOS</span>
      </div>
    </div>
    </DesktopContext.Provider>
  );
}
