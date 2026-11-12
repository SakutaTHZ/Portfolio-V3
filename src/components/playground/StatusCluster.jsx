import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Bell, X } from "lucide-react";
import { prefersReducedMotion } from "@/hooks/hooks";

const NOTES = [
  { id: "ready", title: "SakutaOS", body: "Desktop is ready.", ago: "Now" },
  { id: "memo", title: "memoBook", body: "A page is waiting on the desktop.", ago: "1m" },
];

const CLOSED = {
  desktop: { width: 228, height: 64, radius: 32 },
  mobile: { width: 58, height: 58, radius: 29 },
};

function formatClock(date) {
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const period = parts.find((part) => part.type === "dayPeriod")?.value ?? "";
  return { hour, minute, period };
}

function formatDay(date) {
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function useMobileStatus() {
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

function useScreenBox() {
  const [box, setBox] = useState({ width: 0, height: 0, right: 14, bottom: 14 });

  useLayoutEffect(() => {
    const desktop = document.querySelector(".pg-desktop");
    const shelf = document.querySelector(".pg-shelf");
    if (!desktop) return undefined;

    const measure = () => {
      const screen = desktop.getBoundingClientRect();
      const dock = shelf?.getBoundingClientRect();
      setBox({
        width: screen.width,
        height: screen.height,
        right: dock ? Math.max(0, screen.right - dock.right) : 14,
        bottom: dock ? Math.max(0, screen.bottom - dock.bottom) : 14,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(desktop);
    if (shelf) observer.observe(shelf);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return box;
}

function cornerRadii(open, mobile, radius) {
  if (!open) {
    return {
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
      borderBottomRightRadius: radius,
      borderBottomLeftRadius: radius,
    };
  }
  if (mobile) {
    return {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0,
    };
  }
  return {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 22,
  };
}

export default function StatusCluster({ onOpenTimer }) {
  const rootRef = useRef(null);
  const closeTimer = useRef(0);
  const [now, setNow] = useState(() => new Date());
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const mobile = useMobileStatus();
  const box = useScreenBox();
  const open = mobile ? pinned : hover || pinned;
  const clock = formatClock(now);
  const closed = CLOSED[mobile ? "mobile" : "desktop"];
  const shape = {
    width: open && box.width ? (mobile ? box.width : Math.round(box.width * 0.3)) : closed.width,
    height: open && box.height ? box.height : closed.height,
    right: open ? 0 : box.right,
    bottom: open ? 0 : box.bottom,
    ...cornerRadii(open, mobile, closed.radius),
  };

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!pinned) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setPinned(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [pinned]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (mobile) setHover(false);
  }, [mobile]);

  function show(event) {
    if (mobile || event.pointerType === "touch") return;
    window.clearTimeout(closeTimer.current);
    setHover(true);
  }

  function hide(event) {
    if (mobile || event.pointerType === "touch") return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setHover(false), 160);
  }

  function close() {
    window.clearTimeout(closeTimer.current);
    setHover(false);
    setPinned(false);
  }

  function openTimer(event) {
    event.stopPropagation();
    close();
    onOpenTimer?.(event.currentTarget);
  }

  return (
    <motion.aside
      ref={rootRef}
      className="pg-status"
      data-open={open || undefined}
      data-mobile={mobile || undefined}
      initial={false}
      animate={shape}
      transition={prefersReducedMotion() ? { duration: 0 } : { duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      onPointerEnter={show}
      onPointerLeave={hide}
    >
      <div className="pg-status-panel" inert={open ? undefined : true}>
        <div className="pg-status-head">
          <p className="pg-status-label">Notifications</p>
          <button type="button" className="pg-status-close" aria-label="Close notifications" onClick={close}>
            <X size={16} />
          </button>
        </div>
        <ul>
          {NOTES.map((note) => (
            <li key={note.id}>
              <span>
                <strong>{note.title}</strong>
                <span>{note.body}</span>
              </span>
              <button type="button" className="pg-status-note-time" onClick={openTimer}>
                <time>{note.ago}</time>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="pg-status-bar">
        <button
          type="button"
          className="pg-status-clock"
          aria-label={`Open Timer, ${clock.hour}:${clock.minute} ${clock.period}`}
          onClick={openTimer}
        >
          <span className="pg-status-time">
            {clock.hour}:{clock.minute}
            {clock.period ? <span className="pg-status-period"> {clock.period}</span> : null}
          </span>
          <span className="pg-status-date">{formatDay(now)}</span>
        </button>
        <button
          type="button"
          className="pg-status-bell"
          aria-expanded={open}
          aria-label={`${NOTES.length} notifications`}
          onClick={() => setPinned((value) => !value)}
        >
          <Bell size={16} />
          <span className="pg-status-count">{NOTES.length}</span>
        </button>
      </div>
    </motion.aside>
  );
}
