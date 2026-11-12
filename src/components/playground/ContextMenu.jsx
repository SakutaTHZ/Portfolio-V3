import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export function sourceUrl(item) {
  if (!item?.sourcePath) return null;
  const isFile = /\.[a-z0-9]+$/i.test(item.sourcePath);
  return `https://github.com/SakutaTHZ/Portfolio-V3/${isFile ? "blob" : "tree"}/main/${item.sourcePath}`;
}

export default function ContextMenu({ menu, screenRef, onOpen, onClose, onInfo }) {
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
    if (!menu) return;
    const close = () => onClose();
    window.addEventListener("pointerdown", close);
    window.addEventListener("blur", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("blur", close);
    };
  }, [menu, onClose]);

  const href = menu ? sourceUrl(menu.item) : null;

  return (
    <AnimatePresence>
      {menu && (
        <motion.div
          ref={nodeRef}
          className="pg-menu"
          role="menu"
          aria-label={`${menu.item.name} options`}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          style={{ left: pos.x, top: pos.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button type="button" role="menuitem" onClick={() => { onOpen(menu.item); onClose(); }}>
            Open
          </button>
          {href && (
            <a role="menuitem" href={href} target="_blank" rel="noreferrer" onClick={onClose}>
              Open source code
            </a>
          )}
          <button type="button" role="menuitem" onClick={() => { onInfo(menu.item); onClose(); }}>
            Get Info
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function InfoCard({ item, onClose }) {
  if (!item) return null;
  const href = sourceUrl(item);

  return (
    <div className="pg-info-scrim" onClick={onClose}>
      <section
        className="pg-info"
        role="dialog"
        aria-label={`${item.name} info`}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h3>{item.name}</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <dl>
          <div>
            <dt>Kind</dt>
            <dd>{item.type === "folder" ? "Folder" : item.type === "file" ? "File" : "Application"}</dd>
          </div>
          {item.sourcePath && (
            <div>
              <dt>Path</dt>
              <dd>{item.sourcePath}</dd>
            </div>
          )}
        </dl>
        {href && (
          <a href={href} target="_blank" rel="noreferrer">
            View on GitHub
          </a>
        )}
      </section>
    </div>
  );
}

export function PowerOverlay({ mode }) {
  return (
    <div className="pg-power" role="status" aria-live="polite">
      <p>{mode === "restart" ? "Restarting SakutaOS…" : "Shutting down SakutaOS…"}</p>
    </div>
  );
}
