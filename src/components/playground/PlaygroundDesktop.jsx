import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Terminal } from "lucide-react";
import { flattenPlaygroundItems, playgroundRoot } from "@/pages/playground/registry";
import { prefersReducedMotion } from "@/hooks/hooks";
import logo from "@/assets/images/logo.png";
import GradientWaves from "@/components/GradientWaves";
import GatoJumpscare from "@/components/GatoJumpscare";
import PortfolioTerminal from "@/components/PortfolioTerminal";
import MacWindow, { AppGlyph, DesktopIcon, FinderBody, FolderGlyph } from "./MacWindow";
import SakutaBoot from "./SakutaBoot";
import StartMenu from "./StartMenu";
import ContextMenu, { InfoCard, PowerOverlay } from "./ContextMenu";
import "./playground-desktop.css";

const TERMINAL_ID = "__sakuta-terminal";

const terminalItem = {
  type: "app",
  id: TERMINAL_ID,
  name: "Terminal",
  width: 520,
  height: 440,
  sourcePath: "src/components/PortfolioTerminal.jsx",
};

const finderItem = {
  ...playgroundRoot,
  name: "Finder",
  sourcePath: "src/pages/playground",
};

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
  const [contextMenu, setContextMenu] = useState(null);
  const [infoItem, setInfoItem] = useState(null);
  const [power, setPower] = useState(null);
  const zRef = useRef(20);

  const startApps = useMemo(() => {
    const folders = playgroundRoot.children.filter((item) => item.type === "folder");
    return [finderItem, terminalItem, ...folders, ...flattenPlaygroundItems(playgroundRoot)];
  }, []);

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
    setContextMenu({ item, x: point.x, y: point.y });
  }, []);

  const openItem = useCallback((item, sourceEl) => {
    setStartOpen(false);
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

  const minimizeWindow = useCallback((id) => {
    setWindows((current) =>
      current.map((win) => (win.id === id ? { ...win, minimized: true } : win))
    );
    setFocusedId((current) => (current === id ? null : current));
  }, []);

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
      if (contextMenu) {
        setContextMenu(null);
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
  }, [closeWindow, contextMenu, focusedId, infoItem, startOpen]);

  const terminalOpen = openItems.some((win) => win.itemId === TERMINAL_ID);
  const fullscreen = windows.some((win) => win.maximized && !win.minimized);

  return (
    <div className="pg-chassis">
      <div className="pg-bezel">
        <div className="pg-screen" ref={screenRef}>
          <div className="pg-screen-wallpaper" aria-hidden="true">
            <GradientWaves
              speed={0.5}
              amplitude={1.15}
              relief={1}
              lightAngle={150}
              mouseInteraction={false}
              swellOnClick={false}
              lightMode
              waveScale={0.68}
              waveRatio={0.9}
              swell={25}
              turbulence={23.5}
              tilt={64}
              zoom={1}
              height={2.3}
              fogDepth={13.5}
              sheen={0}
              brightness={0.68}
              opacity={1}
              grain={0.2}
              quality="low"
              intro
              parallaxStrength={0.5}
              mouseStrength={0.6}
              paused={false}
            />
          </div>

          <div className="pg-desktop" data-fullscreen={fullscreen || undefined}>
            <div
              className="pg-desktop-icons"
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) setSelectedId(null);
              }}
            >
              {playgroundRoot.children.map((item) => (
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
                    {win.itemId === TERMINAL_ID ? (
                      <PortfolioTerminal
                        embedded
                        title="sakutaos / terminal"
                        note="SAKUTAOS"
                        welcomeMessage="Welcome to SakutaOS. Type help, or ask about this portfolio."
                        onExit={() => closeWindow(win.id)}
                      />
                    ) : win.type === "folder" ? (
                      <FinderBody
                        folder={win.item}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onOpen={openItem}
                        onContext={openContext}
                      />
                    ) : App ? (
                      <App />
                    ) : (
                      <p className="pg-window-fallback">This file has no default export.</p>
                    )}
                  </MacWindow>
                );
              })}
            </AnimatePresence>

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
            />
            {infoItem && <InfoCard item={infoItem} onClose={() => setInfoItem(null)} />}

            <nav className="pg-dock" aria-label="SakutaOS dock">
              <button
                type="button"
                className="pg-dock-item"
                aria-label="Open start menu"
                aria-expanded={startOpen}
                onClick={() => {
                  setContextMenu(null);
                  setStartOpen((value) => !value);
                }}
              >
                <span className="pg-dock-glyph pg-dock-home">
                  <img src={logo} alt="" width={28} height={28} draggable={false} />
                </span>
              </button>
              <span className="pg-dock-separator" aria-hidden="true" />
              <button
                type="button"
                className="pg-dock-item"
                aria-label="Open Finder"
                onClick={(event) => openItem(finderItem, event.currentTarget)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  openContext(finderItem, { x: event.clientX, y: event.clientY });
                }}
              >
                <span className="pg-dock-glyph" style={{ background: "transparent", boxShadow: "none" }}>
                  <FolderGlyph size={44} />
                </span>
                {openItems.some((win) => win.itemId === playgroundRoot.id) && <span className="pg-dock-dot" />}
              </button>
              <button
                type="button"
                className="pg-dock-item"
                aria-label="Open Terminal"
                onClick={(event) => openItem(terminalItem, event.currentTarget)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  openContext(terminalItem, { x: event.clientX, y: event.clientY });
                }}
              >
                <span className="pg-dock-glyph pg-dock-terminal">
                  <Terminal size={18} strokeWidth={1.8} />
                </span>
                {terminalOpen && <span className="pg-dock-dot" />}
              </button>
              {openItems
                .filter((win) => win.itemId !== playgroundRoot.id && win.itemId !== TERMINAL_ID)
                .map((win) => (
                  <button
                    key={win.id}
                    type="button"
                    className="pg-dock-item"
                    aria-label={win.title}
                    onClick={() => bringToFront(win.id)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      openContext(win.item, { x: event.clientX, y: event.clientY });
                    }}
                  >
                    <span className="pg-dock-glyph">
                      {win.type === "folder" ? (
                        <span
                          className="pg-icon-app"
                          style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #7ad7ff, #32ade6)" }}
                        />
                      ) : (
                        <AppGlyph name={win.title} size={43} />
                      )}
                    </span>
                    <span className="pg-dock-dot" />
                  </button>
                ))}
            </nav>
          </div>

          <GatoJumpscare />
          {booting && <SakutaBoot onDone={() => setBooting(false)} />}
          {power && <PowerOverlay mode={power} />}
        </div>
      </div>
      <div className="pg-chin">
        <span className="pg-led" data-on={!booting || undefined} />
        <span>SakutaOS</span>
      </div>
    </div>
  );
}
