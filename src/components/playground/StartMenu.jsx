import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Power, RotateCcw, Search } from "lucide-react";
import { flattenPlaygroundItems, playgroundRoot } from "@/pages/playground/registry";
import logo from "@/assets/images/logo.png";
import { AppGlyph, FolderGlyph } from "./MacWindow";
import { useItemGestures } from "./gestures";

function StartAppButton({ item, onOpen, onContext, onClose }) {
  const gestures = useItemGestures({
    item,
    onOpen: (next, el) => {
      onOpen(next, el);
      onClose();
    },
    onContext,
  });

  return (
    <button type="button" className="pg-start-app" {...gestures}>
      <span className="pg-start-app-icon">
        {item.type === "folder" ? <FolderGlyph size={42} /> : <AppGlyph name={item.name} size={42} />}
      </span>
      <span>{item.name}</span>
    </button>
  );
}

export default function StartMenu({
  open,
  apps,
  onClose,
  onOpen,
  onContext,
  onShutdown,
  onRestart,
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const allowSearchFocus = useRef(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      allowSearchFocus.current = false;
      return undefined;
    }

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    if (!mobile) {
      const focus = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(focus);
    }

    allowSearchFocus.current = false;
    const blurIfStolen = () => {
      if (!allowSearchFocus.current && document.activeElement === inputRef.current) {
        inputRef.current.blur();
      }
    };
    blurIfStolen();
    const timers = [0, 60, 180, 400].map((delay) => window.setTimeout(blurIfStolen, delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [open]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return apps;
    return apps.filter((item) => item.name.toLowerCase().includes(needle));
  }, [apps, query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <button key="scrim" type="button" className="pg-start-scrim" aria-label="Close start menu" onClick={onClose} />
          <div key="menu" className="pg-start-wrap">
          <motion.section
            className="pg-start"
            role="dialog"
            aria-label="SakutaOS start menu"
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
          >
            <form
              className="pg-start-search"
              onSubmit={(event) => {
                event.preventDefault();
                if (results[0]) {
                  onOpen(results[0]);
                  onClose();
                }
              }}
            >
              <Search size={15} strokeWidth={1.8} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onPointerDown={() => {
                  allowSearchFocus.current = true;
                }}
                placeholder="Search apps"
                aria-label="Search apps"
                autoComplete="off"
                spellCheck={false}
              />
            </form>

            <p className="pg-start-label">{query ? "Results" : "Apps"}</p>
            <div className="pg-start-grid">
              {results.length ? (
                results.map((item) => (
                  <StartAppButton
                    key={item.id}
                    item={item}
                    onOpen={onOpen}
                    onContext={onContext}
                    onClose={onClose}
                  />
                ))
              ) : (
                <p className="pg-start-empty">No apps match “{query}”.</p>
              )}
            </div>

            <footer className="pg-start-foot">
              <div className="pg-start-user">
                <img src={logo} alt="" width={28} height={28} draggable={false} />
                <div>
                  <strong>SakutaOS</strong>
                  <span>
                    {flattenPlaygroundItems(playgroundRoot).length}{" "}
                    {flattenPlaygroundItems(playgroundRoot).length === 1 ? "experiment" : "experiments"}
                  </span>
                </div>
              </div>
              <div className="pg-start-power">
                <button type="button" onClick={onRestart} aria-label="Restart">
                  <RotateCcw size={16} strokeWidth={1.8} />
                </button>
                <button type="button" onClick={onShutdown} aria-label="Shut down">
                  <Power size={16} strokeWidth={1.8} />
                </button>
              </div>
            </footer>
          </motion.section>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
