import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Terminal } from "lucide-react";
import { playgroundRoot } from "@/pages/playground/registry";
import { prefersReducedMotion } from "@/hooks/hooks";
import logo from "@/assets/images/logo.png";
import GradientWaves from "@/components/GradientWaves";
import GatoJumpscare from "@/components/GatoJumpscare";
import PortfolioTerminal from "@/components/PortfolioTerminal";
import MacWindow, { AppGlyph, DesktopIcon, FinderBody, FolderGlyph } from "./MacWindow";
import SakutaBoot from "./SakutaBoot";
import "./playground-desktop.css";

const TERMINAL_ID = "__sakuta-terminal";

const terminalItem = {
  type: "app",
  id: TERMINAL_ID,
  name: "Terminal",
  width: 520,
  height: 440,
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
  const maxX = Math.max(8, maxW - 80);
  const maxY = Math.max(48, maxH - 80);
  return {
    x: Math.min(Math.max(-width + 80, x), maxX),
    y: Math.min(Math.max(8, y), maxY),
    width: Math.min(Math.max(320, width), maxW - 16),
    height: Math.min(Math.max(220, height), maxH - 72),
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
  const mobile = width < 768;
  const top = 8;
  const bottom = mobile ? 86 : 96;
  return {
    x: 8,
    y: top,
    width: width - 16,
    height: height - top - bottom,
  };
}

export default function PlaygroundDesktop() {
  const reducedMotion = prefersReducedMotion();
  const screenRef = useRef(null);
  const [booting, setBooting] = useState(() => !prefersReducedMotion());
  const [windows, setWindows] = useState([]);
  const [focusedId, setFocusedId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const zRef = useRef(20);

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

  const openItem = useCallback((item, sourceEl) => {
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

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && focusedId) closeWindow(focusedId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeWindow, focusedId]);

  const terminalOpen = openItems.some((win) => win.itemId === TERMINAL_ID);

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

          <div className="pg-desktop">
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

            <nav className="pg-dock" aria-label="SakutaOS dock">
              <a className="pg-dock-item" href="/" aria-label="Close playground and go home">
                <span className="pg-dock-glyph pg-dock-home">
                  <img src={logo} alt="" width={28} height={28} draggable={false} />
                </span>
              </a>
              <span className="pg-dock-separator" aria-hidden="true" />
              <button
                type="button"
                className="pg-dock-item"
                aria-label="Open Finder"
                onClick={(event) => openItem(playgroundRoot, event.currentTarget)}
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
        </div>
      </div>
      <div className="pg-chin">
        <span className="pg-led" data-on={!booting || undefined} />
        <span>SakutaOS</span>
      </div>
    </div>
  );
}
