import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bomb, ChevronLeft, Flag, Grid3x3, MousePointer2, Play, RotateCcw, Timer, Trophy, X } from "lucide-react";
import { prefersReducedMotion } from "@/hooks/hooks";
import {
  DIFFICULTIES,
  chordReveal,
  elapsedMs,
  formatMs,
  remainingFlags,
  revealCell,
  startBoard,
  toggleFlag,
} from "./bombsweeper-logic";
import "./css/bombsweeper.css";

export const playgroundMeta = {
  title: "BombSweeper",
  width: 880,
  height: 720,
};

const LOG_KEY = "sakuta-bombsweeper-board";
const PB_KEY = "sakuta-bombsweeper-pb";
const LONG_PRESS_MS = 420;

function loadPersonalBests() {
  try {
    const raw = JSON.parse(localStorage.getItem(PB_KEY) || "{}");
    if (!raw || typeof raw !== "object") return {};
    const out = {};
    for (const id of Object.keys(DIFFICULTIES)) {
      if (Number.isFinite(raw[id])) out[id] = raw[id];
    }
    return out;
  } catch {
    return {};
  }
}

function bestForDifficulty(scores, difficultyId) {
  let best = null;
  for (const row of scores) {
    if (row.difficulty !== difficultyId) continue;
    if (best == null || row.timeMs < best) best = row.timeMs;
  }
  return best;
}

function loadScores() {
  try {
    const raw = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (row) =>
        row &&
        typeof row.name === "string" &&
        typeof row.difficulty === "string" &&
        Number.isFinite(row.timeMs)
    );
  } catch {
    return [];
  }
}

function formatWhen(at) {
  return new Date(at).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function enterVariants(reduced) {
  return {
    hidden: {},
    show: {
      transition: reduced ? { duration: 0 } : { staggerChildren: 0.1, delayChildren: 0.06 },
    },
  };
}

function enterItem(reduced) {
  return {
    hidden: reduced ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 22, scale: 0.94 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 26 },
    },
  };
}

function MineIcon({ pop }) {
  return (
    <svg className={`bsw-bomb${pop ? " bsw-bomb-pop" : ""}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="13" r="7" fill="#1c1c1f" stroke="#f4f4f5" strokeWidth="1.2" />
      <path d="M11 6V3" stroke="#f4f4f5" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="13.5" cy="4.5" r="1.2" fill="#fbbf24" />
      <ellipse cx="8.5" cy="11" rx="1.2" ry="1.6" fill="rgba(255,255,255,0.22)" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="bsw-flag" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4v17" stroke="#d4d4d8" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 5h11l-2.5 3.5L17 12H6" fill="#f87171" stroke="#fca5a5" strokeWidth="0.6" />
    </svg>
  );
}

function Cell({
  index,
  board,
  reduced,
  onFlag,
  onChord,
  onPressStart,
  onPressEnd,
  pressed,
  cellPx,
}) {
  const revealed = board.revealed[index];
  const flagged = board.flagged[index];
  const isMine = board.seeded && board.mineSet.has(index);
  const value = board.adjacency[index];
  const exploded = board.exploded === index;
  const showWrongFlag = board.status === "lost" && flagged && !isMine;

  const showFace = revealed || (board.status === "lost" && isMine);
  const showCover = !showFace && !flagged;

  return (
    <button
      type="button"
      className="bsw-cell"
      style={{ width: cellPx, height: cellPx }}
      data-pressed={pressed === index || undefined}
      data-wrong-flag={showWrongFlag || undefined}
      disabled={board.status === "won"}
      aria-label={
        flagged ? "Flagged" : revealed ? (isMine ? "Mine" : value ? `${value} adjacent mines` : "Clear") : "Hidden"
      }
      onContextMenu={(event) => {
        event.preventDefault();
        onFlag(index);
      }}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        onPressStart(index);
      }}
      onPointerUp={(event) => {
        onPressEnd(index, event);
      }}
      onPointerCancel={() => onPressEnd(index, null)}
      onPointerLeave={() => onPressEnd(index, null)}
      onClick={(event) => {
        if (revealed && value > 0) {
          onChord(index);
          return;
        }
        if (event.detail === 0) return;
      }}
    >
      <span className="bsw-cell-inner">
        {showCover && <span className="bsw-cell-cover" aria-hidden="true" />}

        <AnimatePresence mode="popLayout">
          {flagged && !revealed && (
            <motion.span
              key="flag"
              className="bsw-cell-face"
              initial={reduced ? false : { scale: 0.2, rotate: -28, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 520, damping: 22 }}
            >
              <FlagIcon />
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showFace && (
            <motion.span
              key={revealed ? "open" : "end"}
              className="bsw-cell-face"
              data-mine={isMine || undefined}
              initial={reduced ? false : { rotateY: -88, scale: 0.92, opacity: 0.4 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
            >
              {isMine ? (
                <>
                  {exploded && <span className="bsw-burst" aria-hidden="true" />}
                  <MineIcon pop={exploded} />
                </>
              ) : value > 0 ? (
                <span className={`bsw-num-${value}`}>{value}</span>
              ) : null}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}

const BOARD_GAP = 2;

function fitCellSize(shellEl, playEl, spec) {
  if (!shellEl) return 28;

  const shellRect = shellEl.getBoundingClientRect();
  const narrow = shellRect.width < 520;
  const shellPad = narrow ? 12 : 18;
  let chrome = narrow ? 118 : 138;

  if (playEl) {
    const hud = playEl.querySelector(".bsw-arcade-hud");
    const dock = playEl.querySelector(".bsw-tool-dock");
    const framePad = narrow ? 10 : 14;
    chrome =
      (hud?.getBoundingClientRect().height ?? 64) +
      (dock?.getBoundingClientRect().height ?? 52) +
      framePad * 2;
  }

  const maxW = Math.max(96, shellRect.width - shellPad);
  const maxH = Math.max(96, shellRect.height - chrome - shellPad);
  let cap = spec.cols >= 16 ? 30 : spec.cols >= 12 ? 34 : 40;
  if (narrow) cap -= spec.cols >= 16 ? 4 : spec.cols >= 12 ? 2 : 0;

  let cell = cap;
  for (let i = 0; i < 24; i += 1) {
    const pad = Math.min(10, Math.max(4, cell * 0.16));
    const boardW = spec.cols * cell + (spec.cols - 1) * BOARD_GAP + pad * 2;
    const boardH = spec.rows * cell + (spec.rows - 1) * BOARD_GAP + pad * 2;
    if (boardW <= maxW && boardH <= maxH) {
      return Math.max(11, cell);
    }
    cell = Math.floor(cell * 0.93);
  }

  const pad = 4;
  const byW = Math.floor((maxW - pad * 2 - (spec.cols - 1) * BOARD_GAP) / spec.cols);
  const byH = Math.floor((maxH - pad * 2 - (spec.rows - 1) * BOARD_GAP) / spec.rows);
  return Math.max(11, Math.min(byW, byH, cap));
}

function useCellSize(shellRef, playRef, spec, active, playKey) {
  const [cellPx, setCellPx] = useState(28);

  useLayoutEffect(() => {
    if (!active || !shellRef.current) return undefined;

    const measure = () => {
      setCellPx(fitCellSize(shellRef.current, playRef.current, spec));
    };

    measure();
    const afterPaint = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(measure);
    });
    const ro = new ResizeObserver(measure);
    ro.observe(shellRef.current);
    if (playRef.current) ro.observe(playRef.current);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(afterPaint);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [active, spec, shellRef, playRef, playKey]);

  return cellPx;
}

const MODE_PREVIEW = {
  scout: "hhhhfhh2h11hmh3hfc2h12h1h",
  ranger: "ffffff2112f1fm312ff1m22313ff211fhh1h",
  breach: "fffff2m1ff3f1m22h31fm1fff2m3f1h2mfff",
};

function ModePreview({ id, size }) {
  const raw = MODE_PREVIEW[id] ?? MODE_PREVIEW.scout;
  const cells = raw.split("").filter((c) => c !== "");
  return (
    <motion.div
      className="bsw-mode-preview"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      aria-hidden
      initial={{ opacity: 0.4, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 24 }}
    >
      {cells.map((cell, index) => (
        <span key={index} className={`bsw-mp bsw-mp-${cell}`} data-i={index}>
          {cell === "f" && <FlagIcon />}
          {cell === "m" && <MineIcon pop={false} />}
          {/^[1-8]$/.test(cell) ? cell : null}
        </span>
      ))}
    </motion.div>
  );
}

function MenuScreen({ difficulty, reduced, onSelectMode, onPlay, onScores }) {
  const stage = useMemo(() => enterVariants(reduced), [reduced]);
  const item = useMemo(() => enterItem(reduced), [reduced]);

  return (
    <motion.section
      className="bsw-menu"
      initial={false}
      aria-label="BombSweeper start"
    >
      <motion.div
        className="bsw-menu-cabinet"
        variants={stage}
        initial={reduced ? "show" : "hidden"}
        animate="show"
      >
        <motion.div className="bsw-menu-hero" variants={item}>
          <div className="bsw-menu-aurora" aria-hidden="true" />
          <div className="bsw-menu-logo" aria-hidden="true">
            <Bomb size={34} strokeWidth={1.6} />
            <span className="bsw-menu-spark" />
          </div>
          <h1 className="bsw-title">BombSweeper</h1>
        </motion.div>

        <motion.div className="bsw-mode-grid" role="group" aria-label="Difficulty" variants={item}>
          {Object.values(DIFFICULTIES).map((mode) => {
            const previewSize = mode.id === "scout" ? 5 : 6;
            return (
              <motion.button
                key={mode.id}
                type="button"
                className="bsw-mode-card"
                variants={item}
                aria-pressed={difficulty === mode.id}
                aria-label={`${mode.label}, ${mode.cols} by ${mode.rows}, ${mode.mines} mines`}
                onClick={() => onSelectMode(mode.id)}
              >
                <ModePreview id={mode.id} size={previewSize} />
                <span className="bsw-mode-card-foot">
                  <strong>{mode.label}</strong>
                  <span className="bsw-mode-meta" aria-hidden="true">
                    <span className="bsw-mode-grid-ico" />
                    {mode.mines}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        <p className="bsw-sr-only">Dig to reveal tiles, flag suspected mines, chord on numbers when flags match.</p>

        <motion.div className="bsw-menu-glyphs" aria-hidden="true" variants={item}>
          <span>
            <MousePointer2 size={16} />
          </span>
          <span>
            <Flag size={16} />
          </span>
          <span>
            <Grid3x3 size={16} />
          </span>
        </motion.div>

        <motion.div className="bsw-menu-actions" variants={item}>
          <motion.button type="button" className="bsw-play-mega" variants={item} onClick={onPlay}>
            <Play size={18} fill="currentColor" />
            Play
          </motion.button>
          <motion.button
            type="button"
            className="bsw-rank-fab"
            variants={item}
            aria-label="Leaderboard"
            onClick={onScores}
          >
            <Trophy size={18} />
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

function LeaderboardDrawer({ open, reduced, leaderboard, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="bsw-drawer-backdrop"
            aria-label="Close leaderboard"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="bsw-drawer"
            aria-label="Leaderboard"
            initial={reduced ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <header className="bsw-side-head">
              <p className="bsw-kicker">
                <Trophy size={12} style={{ marginRight: 6, verticalAlign: "-1px" }} />
                Leaderboard
              </p>
              <button type="button" className="bsw-side-close" aria-label="Close leaderboard" onClick={onClose}>
                <X size={16} />
              </button>
            </header>
            {leaderboard.length === 0 ? (
              <p className="bsw-empty">Win a game and save your time to appear here. Fastest runs rank higher.</p>
            ) : (
              <ol className="bsw-board-list">
                {leaderboard.map((entry, rank) => (
                  <li key={entry.id} data-rank={rank < 3 ? rank + 1 : undefined}>
                    <span>
                      <strong>
                        #{rank + 1} {entry.name}
                      </strong>
                      <small>
                        {DIFFICULTIES[entry.difficulty]?.label ?? entry.difficulty} · {entry.mines} mines ·{" "}
                        {formatWhen(entry.at)}
                      </small>
                    </span>
                    <time dateTime={`PT${entry.timeMs / 1000}S`}>{formatMs(entry.timeMs)}</time>
                  </li>
                ))}
              </ol>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default function BombSweeper() {
  const reduced = prefersReducedMotion();
  const shellRef = useRef(null);
  const playRef = useRef(null);
  const [screen, setScreen] = useState("menu");
  const [playKey, setPlayKey] = useState(0);
  const [difficulty, setDifficulty] = useState("scout");
  const [board, setBoard] = useState(() => startBoard("scout"));
  const [flagMode, setFlagMode] = useState(false);
  const [pressed, setPressed] = useState(null);
  const [tick, setTick] = useState(() => Date.now());
  const [scores, setScores] = useState(loadScores);
  const [saveName, setSaveName] = useState("");
  const [savedWin, setSavedWin] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [recordBeat, setRecordBeat] = useState(null);
  const winAlertedRef = useRef(false);
  const pressRef = useRef({ index: null, timer: null, long: false, pointerId: null });

  const spec = DIFFICULTIES[difficulty];
  const cellPx = useCellSize(shellRef, playRef, spec, screen === "play", playKey);
  const boardSize = spec.cols >= 16 ? "xlarge" : spec.cols >= 12 ? "large" : "compact";
  const stageMotion = useMemo(() => enterVariants(reduced), [reduced]);
  const itemMotion = useMemo(() => enterItem(reduced), [reduced]);

  useEffect(() => {
    if (board.status !== "playing") return;
    const id = window.setInterval(() => setTick(Date.now()), 40);
    return () => window.clearInterval(id);
  }, [board.status]);

  useEffect(() => {
    localStorage.setItem(LOG_KEY, JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    if (board.status !== "won") {
      winAlertedRef.current = false;
      return;
    }
    if (winAlertedRef.current) return;
    winAlertedRef.current = true;

    const time = elapsedMs(board);
    const pb = loadPersonalBests();
    const prior = pb[board.difficulty] ?? bestForDifficulty(scores, board.difficulty);
    const isRecord = prior == null || time < prior;

    if (isRecord) {
      const nextPb = { ...pb, [board.difficulty]: time };
      localStorage.setItem(PB_KEY, JSON.stringify(nextPb));
      setRecordBeat({ prior, current: time, difficulty: board.difficulty });
    } else {
      setRecordBeat(null);
    }
  }, [board, scores]);

  const elapsed = useMemo(() => elapsedMs(board, tick), [board, tick]);

  const leaderboard = useMemo(() => {
    return [...scores].sort((a, b) => a.timeMs - b.timeMs || b.at - a.at).slice(0, 24);
  }, [scores]);

  const resetBoard = useCallback(
    (nextDifficulty = difficulty) => {
      setBoard(startBoard(nextDifficulty));
      setSavedWin(false);
      setSaveName("");
      setPressed(null);
      setRecordBeat(null);
      winAlertedRef.current = false;
      setFlagMode(false);
    },
    [difficulty]
  );

  function beginPlay() {
    resetBoard(difficulty);
    setPlayKey((k) => k + 1);
    setScreen("play");
  }

  function leaveToMenu() {
    setScreen("menu");
    setPressed(null);
    setSavedWin(false);
    setSaveName("");
    setRecordBeat(null);
    winAlertedRef.current = false;
  }

  const applyReveal = useCallback((index) => {
    setBoard((current) => revealCell(current, index));
  }, []);

  const applyFlag = useCallback((index) => {
    setBoard((current) => toggleFlag(current, index));
  }, []);

  const applyChord = useCallback((index) => {
    setBoard((current) => chordReveal(current, index));
  }, []);

  function clearPress() {
    const ref = pressRef.current;
    if (ref.timer) window.clearTimeout(ref.timer);
    pressRef.current = { index: null, timer: null, long: false, pointerId: null };
    setPressed(null);
  }

  function onPressStart(index) {
    clearPress();
    pressRef.current.index = index;
    setPressed(index);
    pressRef.current.timer = window.setTimeout(() => {
      pressRef.current.long = true;
      applyFlag(index);
    }, LONG_PRESS_MS);
  }

  function onPressEnd(index, event) {
    const ref = pressRef.current;
    if (ref.index !== index) {
      clearPress();
      return;
    }
    if (ref.timer) window.clearTimeout(ref.timer);

    const wasLong = ref.long;
    clearPress();

    if (wasLong) return;
    if (flagMode) applyFlag(index);
    else applyReveal(index);
    void event;
  }

  function saveScore(event) {
    event.preventDefault();
    if (board.status !== "won" || savedWin) return;
    const name = saveName.trim() || "Anonymous";
    const entry = {
      id: `bsw-${Date.now().toString(36)}`,
      name,
      difficulty: board.difficulty,
      timeMs: elapsedMs(board),
      mines: board.mines,
      at: board.endedAt ?? Date.now(),
    };
    setScores((current) => [entry, ...current].slice(0, 80));
    setSavedWin(true);
  }

  const pad = Math.min(10, Math.max(4, cellPx * 0.16));
  const boardStyle = {
    gridTemplateColumns: `repeat(${spec.cols}, ${cellPx}px)`,
    gridTemplateRows: `repeat(${spec.rows}, ${cellPx}px)`,
    padding: pad,
  };

  const playState =
    board.status === "won" ? "won" : board.status === "lost" ? "lost" : board.status === "playing" ? "live" : "ready";

  return (
    <div className="bsw-app" data-screen={screen}>
      <div className="bsw-shell" ref={shellRef}>
        <AnimatePresence mode="wait">
          {screen === "menu" ? (
            <MenuScreen
              key="menu"
              difficulty={difficulty}
              reduced={reduced}
              onSelectMode={setDifficulty}
              onPlay={beginPlay}
              onScores={() => setShowBoard(true)}
            />
          ) : (
            <motion.section
              key={`play-${playKey}`}
              className="bsw-play"
              ref={playRef}
              data-state={playState}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="BombSweeper game"
            >
              <motion.div
                className="bsw-arcade"
                variants={stageMotion}
                initial={reduced ? "show" : "hidden"}
                animate="show"
              >
                <motion.header className="bsw-arcade-hud" variants={itemMotion}>
                  <div className="bsw-arcade-hud-top">
                    <button type="button" className="bsw-menu-back" onClick={leaveToMenu}>
                      <ChevronLeft size={16} aria-hidden="true" />
                      Menu
                    </button>
                    <span className="bsw-mode-chip">{spec.label}</span>
                    <span className="bsw-live-pill" data-state={playState}>
                      <span className="bsw-live-dot" aria-hidden="true" />
                      {playState === "won"
                        ? "Cleared"
                        : playState === "lost"
                          ? "Detonated"
                          : playState === "live"
                            ? "Live"
                            : "Stand by"}
                    </span>
                  </div>
                  <div className="bsw-led-row">
                    <div className="bsw-led bsw-led-mines" key={`mines-${remainingFlags(board)}`}>
                      <Flag size={14} aria-hidden="true" />
                      <div>
                        <span className="bsw-led-label">Mines left</span>
                        <strong>{String(remainingFlags(board)).padStart(3, "0")}</strong>
                      </div>
                    </div>
                    <div className="bsw-led bsw-led-time">
                      <Timer size={14} aria-hidden="true" />
                      <div>
                        <span className="bsw-led-label">Clear time</span>
                        <strong>{formatMs(elapsed)}</strong>
                      </div>
                    </div>
                  </div>
                </motion.header>

                <motion.div className="bsw-arcade-stage" variants={itemMotion}>
                  <div className="bsw-board-wrap">
                    <div
                      className="bsw-board"
                      style={boardStyle}
                      data-size={boardSize}
                      data-flag-mode={flagMode || undefined}
                    >
                      {Array.from({ length: board.rows * board.cols }, (_, index) => (
                        <Cell
                          key={index}
                          index={index}
                          board={board}
                          reduced={reduced}
                          cellPx={cellPx}
                          onFlag={applyFlag}
                          onChord={applyChord}
                          onPressStart={onPressStart}
                          onPressEnd={onPressEnd}
                          pressed={pressed}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.div className="bsw-tool-dock" variants={stageMotion} initial={reduced ? "show" : "hidden"} animate="show">
                  <motion.button
                    type="button"
                    className="bsw-tool"
                    variants={itemMotion}
                    data-active={!flagMode}
                    onClick={() => setFlagMode(false)}
                    aria-pressed={!flagMode}
                  >
                    <MousePointer2 size={15} />
                    Dig
                  </motion.button>
                  <motion.button
                    type="button"
                    className="bsw-tool"
                    variants={itemMotion}
                    data-active={flagMode}
                    onClick={() => setFlagMode(true)}
                    aria-pressed={flagMode}
                  >
                    <Flag size={15} />
                    Flag
                  </motion.button>
                  <motion.button
                    type="button"
                    className="bsw-tool bsw-tool-reset"
                    variants={itemMotion}
                    onClick={() => {
                      resetBoard(difficulty);
                      setPlayKey((k) => k + 1);
                    }}
                  >
                    <RotateCcw size={15} />
                    Restart
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <LeaderboardDrawer open={showBoard} reduced={reduced} leaderboard={leaderboard} onClose={() => setShowBoard(false)} />

      <AnimatePresence>
        {board.status === "won" && screen === "play" && (
          <motion.div
            className="bsw-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Victory"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bsw-overlay-card"
              initial={reduced ? false : { scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              <p className="bsw-kicker">Cleared</p>
              <p className="bsw-overlay-title">{formatMs(elapsed)}</p>
              {recordBeat && (
                <p className="bsw-record bsw-record-inline">
                  {recordBeat.prior == null
                    ? `New personal best on ${DIFFICULTIES[recordBeat.difficulty]?.label ?? "this mode"}!`
                    : `New record — you beat ${formatMs(recordBeat.prior)}.`}
                </p>
              )}
              {!savedWin && (
                <form className="bsw-win-form" onSubmit={saveScore}>
                  <input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Name for leaderboard"
                    maxLength={32}
                    aria-label="Leaderboard name"
                  />
                  <button type="submit">Save</button>
                </form>
              )}
              {savedWin && <p className="bsw-note">Saved to leaderboard.</p>}
              <div className="bsw-overlay-actions">
                <button type="button" className="bsw-overlay-menu" onClick={leaveToMenu}>
                  Main menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="bsw-sr-only" aria-live="polite">
        {board.status === "lost" ? "Mine hit. Restart to play again." : ""}
      </p>
    </div>
  );
}