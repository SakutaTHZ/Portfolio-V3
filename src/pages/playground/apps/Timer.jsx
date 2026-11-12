import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Minus, Pause, Play, Plus, Square } from "lucide-react";
import CountUp from "@/components/CountUp";
import { prefersReducedMotion } from "@/hooks/hooks";
import { useWindowFrame } from "@/components/playground/desktopContext";
import "./css/timer.css";

export const playgroundMeta = {
  title: "Timer",
  width: 940,
  height: 640,
};

const PRESETS = [
  "Asia/Yangon",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const LOG_KEY = "sakuta-timer-log";

const CITY_ALIASES = {
  Rangoon: "Yangon",
  Calcutta: "Kolkata",
  Saigon: "Ho Chi Minh City",
};

function cityName(timeZone) {
  const raw = timeZone.split("/").pop().replaceAll("_", " ");
  return CITY_ALIASES[raw] || raw;
}

function zoneParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZoneName: "shortOffset",
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const second = Number(get("second"));

  return {
    hour,
    minute,
    second,
    offset: get("timeZoneName").replace("GMT", "UTC"),
    dateLabel: `${get("weekday")}, ${get("month")} ${get("day")}`,
    clock: `${get("hour")}:${get("minute")}:${get("second")}`,
    day: hour >= 7 && hour < 19,
  };
}

function splitSeconds(total) {
  const safe = Math.max(0, total);
  return {
    hours: Math.floor(safe / 3600),
    minutes: Math.floor((safe % 3600) / 60),
    seconds: safe % 60,
  };
}

function RollDigit({ value, size }) {
  return (
    <CountUp
      to={value}
      mode="roll"
      duration={0.55}
      easing="easeOut"
      trigger="load"
      className={`timer-digit timer-digit-${size}`}
    />
  );
}

function RollTime({ seconds, size }) {
  const parts = splitSeconds(seconds);
  const chunks = [parts.hours, parts.minutes, parts.seconds].map((unit) =>
    String(unit).padStart(2, "0")
  );

  return (
    <span className={`timer-readout timer-readout-${size}`}>
      {chunks.map((chunk, index) => (
        <span key={index} className="timer-chunk">
          {index > 0 && <span className="timer-colon">:</span>}
          {[...chunk].map((digit, digitIndex) => (
            <RollDigit key={`${index}-${digitIndex}`} value={Number(digit)} size={size} />
          ))}
        </span>
      ))}
    </span>
  );
}

function ClockFace({ date, timeZone }) {
  const parts = zoneParts(date, timeZone);
  const minute = parts.minute + parts.second / 60;
  const hour = (parts.hour % 12) + minute / 60;

  return (
    <span className="timer-face" aria-hidden="true">
      {[0, 90, 180, 270].map((angle) => (
        <span key={angle} className="timer-tick" style={{ transform: `rotate(${angle}deg)` }} />
      ))}
      <span className="timer-hand timer-hand-hour" style={{ transform: `rotate(${hour * 30}deg)` }} />
      <span className="timer-hand timer-hand-minute" style={{ transform: `rotate(${minute * 6}deg)` }} />
      <span className="timer-hand timer-hand-second" style={{ transform: `rotate(${parts.second * 6}deg)` }} />
    </span>
  );
}

function UnitStepper({ label, value, max, disabled, onChange }) {
  return (
    <div className="timer-unit">
      <button
        type="button"
        disabled={disabled}
        aria-label={`Increase ${label}`}
        onClick={() => onChange(value >= max ? 0 : value + 1)}
      >
        <Plus size={14} />
      </button>
      <strong>{String(value).padStart(2, "0")}</strong>
      <span>{label}</span>
      <button
        type="button"
        disabled={disabled}
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(value <= 0 ? max : value - 1)}
      >
        <Minus size={14} />
      </button>
    </div>
  );
}

function formatSpent(total) {
  const { hours, minutes, seconds } = splitSeconds(total);
  const clock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours ? `${hours}:${clock}` : clock;
}

function formatWhen(at) {
  return new Date(at).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function loadLogs() {
  try {
    const raw = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((item) => item && typeof item.title === "string" && Number.isFinite(item.seconds));
  } catch {
    return [];
  }
}

function playChime(ctx) {
  if (!ctx) return;
  const start = ctx.currentTime;
  [880, 1318].forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const at = start + index * 0.16;
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.045, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.34);
  });
}

export default function Timer() {
  const frame = useWindowFrame();
  const audioRef = useRef(null);
  const [host, setHost] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [extraZones, setExtraZones] = useState([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("up");
  const [status, setStatus] = useState("idle");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [baseMs, setBaseMs] = useState(0);
  const [anchor, setAnchor] = useState(null);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(null);
  const [logs, setLogs] = useState(loadLogs);
  const titleRef = useRef(null);
  const reduced = prefersReducedMotion();

  useLayoutEffect(() => {
    setHost(document.querySelector(".pg-desktop"));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (status === "naming") titleRef.current?.focus();
  }, [status]);

  const configured = hours * 3600 + minutes * 60 + seconds;
  const elapsedMs = status === "running" && anchor != null ? now.getTime() - anchor : 0;

  let displaySeconds = 0;
  if (status === "naming" && pending) {
    displaySeconds = pending.shown;
  } else if (mode === "up") {
    const ms = status === "running" ? baseMs + elapsedMs : baseMs;
    displaySeconds = Math.floor(ms / 1000);
  } else if (status === "idle") {
    displaySeconds = configured;
  } else if (status === "done") {
    displaySeconds = 0;
  } else {
    const remain = status === "running" ? baseMs - elapsedMs : baseMs;
    displaySeconds = Math.max(0, Math.ceil(remain / 1000));
  }

  useEffect(() => {
    if (status !== "running" || mode !== "down" || anchor == null) return;
    if (baseMs - (now.getTime() - anchor) > 0) return;
    playChime(audioRef.current);
    setAnchor(null);
    setBaseMs(0);
    setPending({ seconds: configured, shown: 0, mode, at: Date.now() });
    setStatus("naming");
    if (frame?.minimized) frame.restore();
  }, [anchor, baseMs, configured, frame, mode, now, status]);

  const zones = useMemo(() => {
    const seen = new Set([localZone]);
    const localCity = cityName(localZone);
    return [...PRESETS, ...extraZones].filter((zone) => {
      if (seen.has(zone) || cityName(zone) === localCity) return false;
      seen.add(zone);
      return true;
    });
  }, [extraZones]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const taken = new Set([localZone, ...zones]);
    const catalog = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : PRESETS;
    return catalog
      .filter((zone) => !taken.has(zone) && zone.toLowerCase().replaceAll("_", " ").includes(needle))
      .slice(0, 5);
  }, [query, zones]);

  function armAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioRef.current) audioRef.current = new Ctx();
    audioRef.current.resume().catch(() => {});
  }

  function changeMode(next) {
    if (status === "running" || status === "naming") return;
    setMode(next);
    setStatus("idle");
    setBaseMs(0);
    setAnchor(null);
    setPending(null);
  }

  function spentSeconds() {
    const delta = anchor != null ? Date.now() - anchor : 0;
    if (mode === "up") {
      const ms = status === "running" ? baseMs + delta : baseMs;
      return Math.floor(ms / 1000);
    }
    if (status === "done") return configured;
    const remainMs = status === "running" ? Math.max(0, baseMs - delta) : baseMs;
    return Math.max(0, configured - Math.ceil(remainMs / 1000));
  }

  function commitLog(name, entry) {
    const next = {
      id: `tm-${Date.now().toString(36)}`,
      title: name,
      seconds: entry.seconds,
      mode: entry.mode,
      at: entry.at,
    };
    setLogs((current) => [next, ...current].slice(0, 40));
    setTitle("");
    setPending(null);
    setStatus("idle");
    setBaseMs(0);
    setAnchor(null);
  }

  function resetTimer() {
    setPending(null);
    setStatus("idle");
    setBaseMs(0);
    setAnchor(null);
  }

  function start() {
    if (status === "running") return;
    if (mode === "down" && status !== "paused") {
      const ms = configured * 1000;
      if (ms <= 0) return;
      setBaseMs(ms);
    }
    armAudio();
    setAnchor(Date.now());
    setStatus("running");
  }

  function pause() {
    if (status !== "running" || anchor == null) return;
    const delta = Date.now() - anchor;
    setBaseMs((current) => (mode === "up" ? current + delta : Math.max(0, current - delta)));
    setAnchor(null);
    setStatus("paused");
  }

  function stop({ restore = false } = {}) {
    if (status === "idle" || status === "naming") return;
    const seconds = spentSeconds();
    const entry = { seconds, shown: displaySeconds, mode, at: Date.now() };
    if (restore) frame?.restore();
    if (seconds <= 0) {
      resetTimer();
      return;
    }
    const name = title.trim();
    if (name) {
      commitLog(name, entry);
      return;
    }
    setPending(entry);
    setAnchor(null);
    setBaseMs(0);
    setStatus("naming");
  }

  function savePending() {
    const name = title.trim();
    if (!name || !pending) return;
    commitLog(name, pending);
  }

  function onTimerKey(event) {
    if (event.target.closest("input, textarea, button")) return;
    if (event.key !== " ") return;
    event.preventDefault();
    if (status === "running") pause();
    else start();
  }

  const statusLabel =
    status === "running"
      ? mode === "up"
        ? "Counting up"
        : "Counting down"
      : status === "paused"
        ? "Paused"
        : status === "naming"
          ? "Add a title"
          : status === "done"
            ? "Time's up"
            : mode === "up"
              ? "Ready"
              : "Set a duration";

  const canStart = status !== "running" && status !== "naming" && (mode === "up" || status === "paused" || configured > 0);
  const steppersLocked = mode === "down" && (status === "running" || status === "paused");
  const showNotch = Boolean(host && frame?.minimized && status !== "idle");

  const notch = showNotch
    ? createPortal(
        <div className="timer-notch-anchor">
          <motion.div
            className="timer-notch"
            data-state={status}
            initial={reduced ? false : { opacity: 0, y: -14, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            <button type="button" className="timer-notch-time" onClick={() => frame.restore()} aria-label="Open Timer">
              <span className="timer-notch-dot" data-state={status} />
              <RollTime seconds={displaySeconds} size="notch" />
            </button>
            <button type="button" className="timer-notch-stop" onClick={() => stop({ restore: true })}>
              <Square size={10} fill="currentColor" />
              Stop
            </button>
          </motion.div>
        </div>,
        host
      )
    : null;

  const local = zoneParts(now, localZone);

  return (
    <div className="timer-app">
      {notch}
      <div className="timer-layout">
        <section className="timer-clocks" aria-label="World clocks">
          <header className="timer-hero">
            <p className="timer-kicker">Local · {cityName(localZone)}</p>
            <p className="timer-hero-time">{local.clock}</p>
            <p className="timer-hero-meta">
              <span>{local.dateLabel}</span>
              <span>{local.offset}</span>
            </p>
          </header>

          <ul className="timer-zones">
            {zones.map((zone) => {
              const parts = zoneParts(now, zone);
              return (
                <li key={zone} data-day={parts.day || undefined}>
                  <ClockFace date={now} timeZone={zone} />
                  <span className="timer-zone-copy">
                    <strong>{cityName(zone)}</strong>
                    <small>
                      {parts.dateLabel} · {parts.offset}
                    </small>
                  </span>
                  <time dateTime={now.toISOString()}>{parts.clock}</time>
                  {extraZones.includes(zone) && (
                    <button
                      type="button"
                      className="timer-zone-remove"
                      aria-label={`Remove ${cityName(zone)}`}
                      onClick={() => setExtraZones((current) => current.filter((item) => item !== zone))}
                    >
                      ×
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <form
            className="timer-search"
            onSubmit={(event) => {
              event.preventDefault();
              if (!matches[0]) return;
              setExtraZones((current) => [...current, matches[0]]);
              setQuery("");
            }}
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Add a city"
              aria-label="Add a city"
            />
            {matches.length > 0 && (
              <ul className="timer-matches">
                {matches.map((zone) => (
                  <li key={zone}>
                    <button
                      type="button"
                      onClick={() => {
                        setExtraZones((current) => [...current, zone]);
                        setQuery("");
                      }}
                    >
                      <strong>{cityName(zone)}</strong>
                      <small>{zone}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </section>

        <section className="timer-panel" aria-label="Timer" tabIndex={0} onKeyDown={onTimerKey}>
          <div className="timer-switch" role="tablist" aria-label="Timer mode">
            <button type="button" role="tab" aria-selected={mode === "up"} onClick={() => changeMode("up")}>
              Count up
            </button>
            <button type="button" role="tab" aria-selected={mode === "down"} onClick={() => changeMode("down")}>
              Countdown
            </button>
          </div>

          {mode === "down" && (
            <div className="timer-units">
              <UnitStepper label="hr" value={hours} max={23} disabled={steppersLocked} onChange={setHours} />
              <UnitStepper label="min" value={minutes} max={59} disabled={steppersLocked} onChange={setMinutes} />
              <UnitStepper label="sec" value={seconds} max={59} disabled={steppersLocked} onChange={setSeconds} />
            </div>
          )}

          <div className="timer-stage" data-state={status}>
            <RollTime seconds={displaySeconds} size="hero" />
            <p className="timer-status">{statusLabel}</p>
          </div>

          <form
            className="timer-title"
            onSubmit={(event) => {
              event.preventDefault();
              if (status === "naming") savePending();
            }}
          >
            <input
              ref={titleRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What did you do?"
              aria-label="Session title"
              maxLength={80}
            />
          </form>

          <div className="timer-actions">
            {status === "naming" ? (
              <button type="button" className="timer-go" onClick={savePending} disabled={!title.trim()}>
                Save
              </button>
            ) : status === "running" ? (
              <button type="button" className="timer-go" onClick={pause}>
                <Pause size={16} fill="currentColor" />
                Pause
              </button>
            ) : (
              <button type="button" className="timer-go" onClick={start} disabled={!canStart}>
                <Play size={16} fill="currentColor" />
                {status === "paused" ? "Resume" : "Start"}
              </button>
            )}
            {status === "naming" ? (
              <button type="button" className="timer-halt" onClick={resetTimer}>
                Discard
              </button>
            ) : (
              <button type="button" className="timer-halt" onClick={() => stop()} disabled={status === "idle"}>
                <Square size={12} fill="currentColor" />
                Stop
              </button>
            )}
          </div>

          <div className="timer-log">
            <p className="timer-kicker">Log</p>
            {logs.length === 0 ? (
              <p className="timer-note">Stopped sessions land here with the title you give them.</p>
            ) : (
              <ul>
                {logs.map((entry) => (
                  <li key={entry.id}>
                    <span>
                      <strong>{entry.title}</strong>
                      <small>
                        {formatWhen(entry.at)} · {entry.mode === "down" ? "Countdown" : "Count up"}
                      </small>
                    </span>
                    <time dateTime={`PT${entry.seconds}S`}>{formatSpent(entry.seconds)}</time>
                    <button
                      type="button"
                      aria-label={`Remove ${entry.title}`}
                      onClick={() => setLogs((current) => current.filter((item) => item.id !== entry.id))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {frame && (
            <button type="button" className="timer-tuck" onClick={frame.minimize}>
              Minimize
            </button>
          )}
          <p className="timer-note">
            Click the time in the notch, or the clock in notifications, to open this window.
          </p>
        </section>
      </div>
    </div>
  );
}
