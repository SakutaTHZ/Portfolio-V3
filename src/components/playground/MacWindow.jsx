import { Component, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { prefersReducedMotion } from "@/hooks/hooks";
import { useItemGestures } from "./gestures";

class WindowErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="pg-window-error">
          <p>This experiment crashed while rendering.</p>
          <pre>{this.state.error.message}</pre>
        </div>
      );
    }

    return <div className="pg-window-content">{this.props.children}</div>;
  }
}

export function FolderGlyph({ size = 58 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M6 18c0-3.3 2.7-6 6-6h14.2c1.4 0 2.7.6 3.6 1.7l2.4 2.8c.9 1.1 2.2 1.7 3.6 1.7H52c3.3 0 6 2.7 6 6v24c0 3.3-2.7 6-6 6H12c-3.3 0-6-2.7-6-6V18z"
        fill="#5ac8ff"
      />
      <path
        d="M6 26h52v24c0 3.3-2.7 6-6 6H12c-3.3 0-6-2.7-6-6V26z"
        fill="#32ade6"
      />
      <path
        d="M6 26h52v4.5H6V26z"
        fill="#7ad7ff"
        opacity="0.55"
      />
    </svg>
  );
}

export function AppGlyph({ name, size = 52 }) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const hue = hash % 360;

  return (
    <span
      className="pg-icon-app"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(180deg, hsl(${hue} 72% 64%), hsl(${hue} 64% 42%))`,
      }}
    >
      <span className="pg-icon-letter">{name.slice(0, 1)}</span>
    </span>
  );
}

export function DesktopIcon({ item, selected, onSelect, onOpen, onContext }) {
  const gestures = useItemGestures({ item, onSelect, onOpen, onContext });

  return (
    <button
      type="button"
      className="pg-icon"
      data-selected={selected || undefined}
      {...gestures}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen?.(item, event.currentTarget);
        }
      }}
    >
      <span className="pg-icon-mark">
        {item.type === "folder" ? <FolderGlyph /> : <AppGlyph name={item.name} />}
      </span>
      <span className="pg-icon-label">{item.name}</span>
    </button>
  );
}

export function FinderBody({ folder, selectedId, onSelect, onOpen, onContext }) {
  if (!folder.children.length) {
    return <p className="pg-finder-empty">This folder is empty</p>;
  }

  return (
    <div className="pg-finder">
      {folder.children.map((item) => (
        <DesktopIcon
          key={item.id}
          item={item}
          selected={selectedId === item.id}
          onSelect={onSelect}
          onOpen={onOpen}
          onContext={onContext}
        />
      ))}
    </div>
  );
}

export default function MacWindow({
  win,
  focused,
  reducedMotion,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  onResize,
  children,
}) {
  const dragging = useRef(null);
  const resizing = useRef(null);
  const instant = reducedMotion || prefersReducedMotion();

  const onTitlePointerDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      onFocus();
      if (win.maximized) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragging.current = {
        x: event.clientX - win.x,
        y: event.clientY - win.y,
      };
    },
    [onFocus, win.maximized, win.x, win.y]
  );

  const onTitlePointerMove = useCallback(
    (event) => {
      if (!dragging.current) return;
      onMove(event.clientX - dragging.current.x, event.clientY - dragging.current.y);
    },
    [onMove]
  );

  const endDrag = useCallback(() => {
    dragging.current = null;
  }, []);

  const onResizePointerDown = useCallback(
    (event) => {
      if (event.button !== 0 || win.maximized) return;
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      resizing.current = {
        x: event.clientX,
        y: event.clientY,
        width: win.width,
        height: win.height,
      };
    },
    [win.height, win.maximized, win.width]
  );

  const onResizePointerMove = useCallback(
    (event) => {
      if (!resizing.current) return;
      onResize(
        resizing.current.width + (event.clientX - resizing.current.x),
        resizing.current.height + (event.clientY - resizing.current.y)
      );
    },
    [onResize]
  );

  const endResize = useCallback(() => {
    resizing.current = null;
  }, []);

  return (
    <motion.section
      className="pg-window"
      data-focused={focused || undefined}
      data-maximized={win.maximized || undefined}
      role="dialog"
      aria-label={win.title}
      aria-hidden={win.minimized || undefined}
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.z,
        transformOrigin: win.origin,
        pointerEvents: win.minimized ? "none" : "auto",
      }}
      initial={instant ? false : { opacity: 0, scale: 0.18 }}
      animate={
        win.minimized
          ? { opacity: 0, scale: 0.12, y: 90 }
          : { opacity: 1, scale: 1, y: 0 }
      }
      exit={instant ? { opacity: 0 } : { opacity: 0, scale: 0.2 }}
      transition={{ type: "spring", stiffness: 430, damping: 32, mass: 0.72 }}
      onPointerDown={onFocus}
    >
      <header
        className="pg-titlebar"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={onMaximize}
      >
        <h2 className="pg-window-title">{win.title}</h2>
        <div className="pg-traffic" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" className="pg-traffic-min" aria-label="Minimize" onClick={onMinimize}>
            <span>−</span>
          </button>
          <button type="button" className="pg-traffic-max" aria-label={win.maximized ? "Restore" : "Maximize"} onClick={onMaximize}>
            <span>{win.maximized ? "⤢" : "□"}</span>
          </button>
          <button type="button" className="pg-traffic-close" aria-label="Close" onClick={onClose}>
            <span>×</span>
          </button>
        </div>
      </header>
      <div className="pg-window-body">
        <WindowErrorBoundary>{children}</WindowErrorBoundary>
      </div>
      {!win.maximized && (
        <div
          className="pg-resize"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
        />
      )}
    </motion.section>
  );
}
