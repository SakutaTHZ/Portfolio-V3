import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Music, Settings, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { prefersReducedMotion } from "@/hooks/hooks";
import { useNotify, useWindowFrame } from "@/components/playground/desktopContext";
import bgMusic from "./sound/bgmusic.mp3";
import loseSound from "./sound/lose-chips.wav";
import winSound from "./sound/win-chips.wav";
import "./felt.css";

export const playgroundMeta = {
  title: "Felt",
  width: 820,
  height: 700,
};

const CHIP_KEY = "sakuta-felt-chips";
const BEST_KEY = "sakuta-felt-best";
const BOARD_KEY = "sakuta-felt-board";
const MUSIC_KEY = "sakuta-felt-music";
const SFX_KEY = "sakuta-felt-sfx";

let feltMusic = null;
let musicTicket = 0;

function readToggle(key) {
  try {
    return localStorage.getItem(key) !== "0";
  } catch {
    return true;
  }
}

function writeToggle(key, on) {
  try {
    localStorage.setItem(key, on ? "1" : "0");
  } catch {
    /* storage can be blocked */
  }
}

function silence(audio) {
  if (!audio) return;
  musicTicket += 1;
  audio.loop = false;
  audio.pause();
  audio.currentTime = 0;
  audio.removeAttribute("src");
  audio.load();
  audio.remove();
}
const STAKES = [25, 50, 100];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = [
  { id: "s", label: "♠", red: false },
  { id: "h", label: "♥", red: true },
  { id: "d", label: "♦", red: true },
  { id: "c", label: "♣", red: false },
];

function readNumber(key, fallback) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function loadBoard() {
  try {
    const raw = JSON.parse(localStorage.getItem(BOARD_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((row) => row && typeof row.name === "string" && Number.isFinite(row.chips));
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

function freshDeck() {
  const cards = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => cards.push({ rank, suit: suit.id, label: suit.label, red: suit.red }));
  });
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards;
}

function valueOf(rank) {
  if (rank === "A") return 11;
  if (rank === "K" || rank === "Q" || rank === "J") return 10;
  return Number(rank);
}

function handTotal(cards) {
  let total = cards.reduce((sum, card) => sum + valueOf(card.rank), 0);
  let aces = cards.filter((card) => card.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function wait(ms, reduced) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, reduced ? 40 : ms);
  });
}

function DealerHand() {
  return (
    <svg className="felt-palm-svg" viewBox="0 0 200 168" aria-hidden="true">
      <g fill="#f0c2a0" stroke="#b78462" strokeWidth="1.6">
        <rect x="46" y="78" width="20" height="46" rx="10" transform="rotate(-48 56 101)" />
        <rect x="62" y="22" width="18" height="62" rx="9" transform="rotate(-16 71 53)" />
        <rect x="84" y="10" width="18" height="70" rx="9" transform="rotate(-4 93 45)" />
        <rect x="106" y="10" width="18" height="68" rx="9" transform="rotate(8 115 44)" />
        <rect x="126" y="20" width="16" height="56" rx="8" transform="rotate(20 134 48)" />
      </g>
      <ellipse cx="104" cy="96" rx="42" ry="32" fill="#f3c7a6" stroke="#b78462" strokeWidth="1.6" />
      <path d="M78 118c6 10 22 18 42 18 16 0 30-6 38-14 8 8 10 22 4 30-16 18-62 20-86 6-8-4-6-28 2-40z" fill="#1a0e0c" />
      <path d="M92 128h58" stroke="#5c4030" strokeWidth="3" strokeLinecap="round" />
      <g fill="#f8e4d4">
        <ellipse cx="58" cy="20" rx="5" ry="3.2" transform="rotate(-16 58 20)" />
        <ellipse cx="86" cy="8" rx="5" ry="3.2" transform="rotate(-4 86 8)" />
        <ellipse cx="112" cy="10" rx="5" ry="3.2" transform="rotate(8 112 10)" />
        <ellipse cx="138" cy="24" rx="4.4" ry="3" transform="rotate(20 138 24)" />
        <ellipse cx="40" cy="92" rx="4" ry="3" transform="rotate(-48 40 92)" />
      </g>
    </svg>
  );
}

function CardFace({ card, hidden }) {
  if (hidden || !card) {
    return (
      <span className="felt-card felt-card-back" aria-hidden="true">
        <span>FELT</span>
      </span>
    );
  }
  return (
    <span className="felt-card" data-red={card.red || undefined}>
      <strong>{card.rank}</strong>
      <em>{card.label}</em>
    </span>
  );
}

const SHORTCUTS = [
  ["1  2  3", "Stake 25, 50, or 100"],
  ["D or Enter", "Deal"],
  ["H", "Hit"],
  ["S", "Stand"],
  ["M", "Background music"],
  ["E", "Sound effects"],
  ["R", "Rankings"],
  ["Esc", "Close a panel"],
];

const TIPS = [
  "Get closer to 21 than the dealer without going over.",
  "Face cards count as 10. An ace is 11 until that would bust, then it counts as 1.",
  "The hole card stays down until you stand. The dealer then hits until 17.",
  "Blackjack pays 3 to 2. A win pays even money. A push returns the stake.",
  "Every card comes off the shoe, and the dealer sweeps the cards back when the hand ends.",
  "If the stack cannot cover 25, buy back in from the cage.",
];

function SettingsPanel({ open, reduced, music, effects, onToggleMusic, onToggleEffects, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="felt-backdrop"
            aria-label="Close settings"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="felt-drawer felt-settings"
            aria-label="Settings"
            initial={reduced ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <header className="felt-drawer-head">
              <p>
                <Settings size={13} aria-hidden="true" />
                Settings
              </p>
              <button type="button" aria-label="Close settings" onClick={onClose}>
                <X size={16} />
              </button>
            </header>
            <section className="felt-setting">
              <h3>Sound</h3>
              <div className="felt-sound-row">
                <button type="button" className="felt-mute" data-muted={!music || undefined} onClick={onToggleMusic}>
                  <Music size={15} aria-hidden="true" />
                  {music ? "Music on" : "Music off"}
                </button>
                <button type="button" className="felt-mute" data-muted={!effects || undefined} onClick={onToggleEffects}>
                  {effects ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}
                  {effects ? "Effects on" : "Effects off"}
                </button>
              </div>
              <p>Music plays only while Felt is open. Effects are the chip sounds for a win or a loss.</p>
            </section>
            <section className="felt-setting">
              <h3>Shortcuts</h3>
              <ul className="felt-keys">
                {SHORTCUTS.map(([key, label]) => (
                  <li key={key}>
                    <kbd>{key}</kbd>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="felt-setting">
              <h3>How to play</h3>
              <ul className="felt-tips">
                {TIPS.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </section>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Rankings({ open, reduced, rows, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="felt-backdrop"
            aria-label="Close rankings"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="felt-drawer"
            aria-label="Rankings"
            initial={reduced ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <header className="felt-drawer-head">
              <p>
                <Trophy size={13} aria-hidden="true" />
                Rankings
              </p>
              <button type="button" aria-label="Close rankings" onClick={onClose}>
                <X size={16} />
              </button>
            </header>
            {rows.length === 0 ? (
              <p className="felt-empty">Grow a stack past your best and put a name on it. Bigger stacks rank higher.</p>
            ) : (
              <ol className="felt-board">
                {rows.map((entry, rank) => (
                  <li key={entry.id} data-rank={rank < 3 ? rank + 1 : undefined}>
                    <span>
                      <strong>
                        #{rank + 1} {entry.name}
                      </strong>
                      <small>{formatWhen(entry.at)}</small>
                    </span>
                    <b>{entry.chips.toLocaleString()} chips</b>
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

export default function Felt() {
  const reduced = prefersReducedMotion();
  const notify = useNotify();
  const frame = useWindowFrame();
  const [chips, setChips] = useState(() => readNumber(CHIP_KEY, 500));
  const [bestMark, setBest] = useState(() => Math.max(500, readNumber(BEST_KEY, 0), readNumber(CHIP_KEY, 500)));
  const bestRef = useRef(bestMark);
  const [board, setBoard] = useState(loadBoard);
  const [stake, setStake] = useState(25);
  const shoeRef = useRef(freshDeck());
  const runRef = useRef(0);
  const aliveRef = useRef(true);
  const [shoeCount, setShoeCount] = useState(52);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [phase, setPhase] = useState("bet");
  const [note, setNote] = useState("The pit is open. Place a stake.");
  const [palm, setPalm] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [offer, setOffer] = useState(null);
  const [name, setName] = useState("");
  const [showBoard, setShowBoard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [musicOn, setMusicOn] = useState(() => readToggle(MUSIC_KEY));
  const [effectsOn, setEffectsOn] = useState(() => readToggle(SFX_KEY));
  const [lost, setLost] = useState(false);
  const appRef = useRef(null);
  const bgRef = useRef(null);
  const musicRef = useRef(musicOn);
  const effectsRef = useRef(effectsOn);
  const liveRef = useRef({});
  const lossTimer = useRef(0);

  useEffect(() => {
    aliveRef.current = true;
    silence(feltMusic);
    const audio = document.createElement("audio");
    audio.src = bgMusic;
    audio.loop = true;
    audio.volume = 0.32;
    audio.preload = "auto";
    audio.dataset.feltMusic = "true";
    document.body.appendChild(audio);
    feltMusic = audio;
    bgRef.current = audio;
    return () => {
      aliveRef.current = false;
      runRef.current += 1;
      window.clearTimeout(lossTimer.current);
      if (feltMusic === audio) feltMusic = null;
      silence(audio);
      if (bgRef.current === audio) bgRef.current = null;
    };
  }, []);

  function playMusic() {
    const audio = bgRef.current;
    if (!audio || !musicRef.current || !aliveRef.current || frame?.minimized) return;
    audio.loop = true;
    if (!audio.getAttribute("src")) audio.src = bgMusic;
    const ticket = ++musicTicket;
    const pending = audio.play();
    pending?.then(() => {
      if (ticket !== musicTicket || !musicRef.current || !aliveRef.current || bgRef.current !== audio) {
        audio.pause();
      }
    }).catch(() => {});
  }

  function stopMusic() {
    musicTicket += 1;
    const audio = bgRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  function playCue(src) {
    if (!effectsRef.current || !aliveRef.current) return;
    const cue = new Audio(src);
    cue.volume = 0.85;
    const pending = cue.play();
    pending?.then(() => {
      if (!effectsRef.current || !aliveRef.current) {
        cue.pause();
        cue.removeAttribute("src");
      }
    }).catch(() => {});
  }

  function flashLoss() {
    setLost(true);
    window.clearTimeout(lossTimer.current);
    lossTimer.current = window.setTimeout(() => {
      if (aliveRef.current) setLost(false);
    }, reduced ? 80 : 720);
  }

  function toggleMusic() {
    setMusicOn((current) => {
      const next = !current;
      musicRef.current = next;
      writeToggle(MUSIC_KEY, next);
      if (next) playMusic();
      else stopMusic();
      return next;
    });
  }

  function toggleEffects() {
    setEffectsOn((current) => {
      const next = !current;
      effectsRef.current = next;
      writeToggle(SFX_KEY, next);
      return next;
    });
  }

  useEffect(() => {
    musicRef.current = musicOn;
    if (!musicOn || frame?.minimized) stopMusic();
    else playMusic();
  }, [musicOn, frame?.minimized]);

  const playerTotal = useMemo(() => handTotal(player), [player]);
  const dealerTotal = useMemo(() => handTotal(dealer), [dealer]);
  const rankings = useMemo(
    () => [...board].sort((a, b) => b.chips - a.chips || b.at - a.at).slice(0, 24),
    [board]
  );

  function persist(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* storage can be blocked */
    }
  }

  function remember(next) {
    setChips(next);
    persist(CHIP_KEY, next);
    if (next <= bestRef.current) return;
    bestRef.current = next;
    persist(BEST_KEY, next);
    setBest(next);
    setOffer({ chips: next, saved: false });
  }

  function still(run) {
    return aliveRef.current && runRef.current === run;
  }

  async function reach(run, target) {
    if (!still(run)) return false;
    setPalm(target);
    await wait(target === "gather" ? 720 : 380, reduced);
    if (!still(run)) return false;
    setPalm(null);
    return true;
  }

  function pullCard() {
    if (shoeRef.current.length < 8) shoeRef.current = freshDeck();
    const [card, ...rest] = shoeRef.current;
    shoeRef.current = rest;
    setShoeCount(rest.length);
    return card;
  }

  async function gather(run) {
    setClearing(true);
    await reach(run, "gather");
    if (!still(run)) return;
    setPlayer([]);
    setDealer([]);
    setClearing(false);
    setPhase("bet");
  }

  async function settle(run, playerCards, dealerCards, bank, bet) {
    let dealerHand = dealerCards.slice();
    const playerScore = handTotal(playerCards);
    if (playerScore <= 21) {
      while (handTotal(dealerHand) < 17) {
        const reached = await reach(run, "dealer");
        if (!reached) return;
        dealerHand = [...dealerHand, pullCard()];
        setDealer(dealerHand);
        await wait(180, reduced);
        if (!still(run)) return;
      }
    }
    const dealerScore = handTotal(dealerHand);
    let result = "Push. The stake comes back.";
    let nextBank = bank;
    let outcome = "push";
    if (playerScore > 21) {
      result = "Bust. The house keeps it.";
      outcome = "lose";
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      result = "The table pays.";
      nextBank = bank + bet * 2;
      outcome = "win";
    } else if (playerScore < dealerScore) {
      result = "Dealer takes the hand.";
      outcome = "lose";
    } else {
      nextBank = bank + bet;
    }
    if (outcome === "win") playCue(winSound);
    if (outcome === "lose") {
      playCue(loseSound);
      flashLoss();
    }
    if (!still(run)) return;
    setPhase("done");
    setNote(`${result} You ${playerScore}, dealer ${dealerScore}.`);
    remember(nextBank);
    await wait(1400, reduced);
    if (!still(run)) return;
    await gather(run);
  }

  async function deal() {
    if (busy || chips < stake) {
      if (chips < stake) setNote("The stake is heavier than the stack.");
      return;
    }
    const run = runRef.current + 1;
    runRef.current = run;
    setBusy(true);
    playMusic();
    if (player.length || dealer.length) {
      await gather(run);
      if (!still(run)) return;
    }
    const bank = chips - stake;
    remember(bank);
    setPhase("deal");
    setNote("Dealing from the shoe.");
    const seats = ["player", "dealer", "player", "dealer"];
    const playerCards = [];
    const dealerCards = [];
    for (const seat of seats) {
      const reached = await reach(run, seat);
      if (!reached) return;
      const card = pullCard();
      if (seat === "player") playerCards.push(card);
      else dealerCards.push(card);
      setPlayer([...playerCards]);
      setDealer([...dealerCards]);
      await wait(90, reduced);
    }
    if (!still(run)) return;
    if (handTotal(playerCards) === 21) {
      const payout = bank + stake + Math.floor(stake * 1.5);
      setPhase("done");
      setNote("Blackjack. The pit pays three to two.");
      playCue(winSound);
      remember(payout);
      await wait(1400, reduced);
      if (still(run)) await gather(run);
    } else {
      setPhase("play");
      setNote("Hit, or stand and let the dealer work.");
    }
    if (still(run)) setBusy(false);
  }

  async function hit() {
    if (busy || phase !== "play") return;
    const run = runRef.current;
    setBusy(true);
    playMusic();
    const reached = await reach(run, "player");
    if (!reached) return;
    const playerCards = [...player, pullCard()];
    setPlayer(playerCards);
    if (handTotal(playerCards) > 21) {
      setPhase("done");
      playCue(loseSound);
      flashLoss();
      setNote(`Bust at ${handTotal(playerCards)}. The house keeps the stake.`);
      await wait(1200, reduced);
      if (still(run)) await gather(run);
    }
    if (still(run)) setBusy(false);
  }

  async function stand() {
    if (busy || phase !== "play") return;
    const run = runRef.current;
    setBusy(true);
    playMusic();
    setPhase("done");
    await settle(run, player, dealer, chips, stake);
    if (still(run)) setBusy(false);
  }

  function buyBack() {
    if (busy) return;
    remember(500);
    setNote("A thin stack from the cage.");
  }

  function openSettings() {
    setShowSettings(true);
    setShowBoard(false);
  }

  function openBoard() {
    setShowBoard(true);
    setShowSettings(false);
  }

  liveRef.current = {
    phase,
    busy,
    chips,
    stake,
    broke: chips < STAKES[0],
    showBoard,
    showSettings,
    deal,
    hit,
    stand,
    toggleMusic,
    toggleEffects,
    openSettings,
    openBoard,
    setStake,
    setShowBoard,
    setShowSettings,
  };

  useEffect(() => {
    function onKey(event) {
      const root = appRef.current;
      const win = root?.closest(".pg-window");
      if (win && !win.hasAttribute("data-focused")) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const live = liveRef.current;
      const key = event.key.toLowerCase();
      if (key === "escape") {
        live.setShowBoard(false);
        live.setShowSettings(false);
        return;
      }
      if (key === "m") {
        event.preventDefault();
        live.toggleMusic();
        return;
      }
      if (key === "e") {
        event.preventDefault();
        live.toggleEffects();
        return;
      }
      if (live.showSettings || live.showBoard) return;
      if (key === "r") {
        event.preventDefault();
        live.openBoard();
        return;
      }
      if (live.phase === "bet" && !live.busy) {
        if (key === "1" || key === "2" || key === "3") {
          const next = STAKES[Number(key) - 1];
          if (live.chips >= next) live.setStake(next);
          return;
        }
        if (key === "d" || key === "enter") {
          event.preventDefault();
          live.deal();
        }
        return;
      }
      if (live.phase === "play" && !live.busy) {
        if (key === "h") {
          event.preventDefault();
          live.hit();
        }
        if (key === "s") {
          event.preventDefault();
          live.stand();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function saveScore(event) {
    event.preventDefault();
    if (!offer || offer.saved) return;
    const label = name.trim() || "Anonymous";
    const entry = {
      id: `felt-${Date.now().toString(36)}`,
      name: label,
      chips: offer.chips,
      at: Date.now(),
    };
    const next = [entry, ...board].slice(0, 80);
    setBoard(next);
    try {
      localStorage.setItem(BOARD_KEY, JSON.stringify(next));
    } catch {
      /* storage can be blocked */
    }
    setOffer({ ...offer, saved: true });
    notify({
      title: "Felt",
      app: "Felt",
      body: `${label} posted ${offer.chips.toLocaleString()} chips.`,
    });
  }

  const broke = chips < STAKES[0];

  return (
    <div
      className="felt-app"
      ref={appRef}
      onPointerDown={playMusic}
    >
      {lost && <div className="felt-loss" aria-hidden="true" />}
      <div className="felt-room">
        <header className="felt-hud">
          <div className="felt-brand">
            <span>After hours</span>
            <strong>Felt</strong>
          </div>
          <p className="felt-bank" aria-label={`${chips.toLocaleString()} chips`}>
            <strong>{chips.toLocaleString()}</strong>
            <span>chips</span>
          </p>
          <div className="felt-tools">
            <button type="button" className="felt-rank" aria-label="Rankings" onClick={openBoard}>
              <Trophy size={16} />
            </button>
            <button type="button" className="felt-gear" aria-label="Settings" onClick={openSettings}>
              <Settings size={16} />
            </button>
          </div>
        </header>

        <section className="felt-pit" data-phase={phase}>
          <div className="felt-oval" data-clearing={clearing || undefined}>
            <div className="felt-shoe" aria-label={`${shoeCount} cards in the shoe`}>
              <span className="felt-card felt-card-back felt-shoe-card" />
              <span className="felt-card felt-card-back felt-shoe-card" />
              <span className="felt-card felt-card-back felt-shoe-card" />
              <small>{shoeCount}</small>
            </div>
            <div className="felt-hand felt-hand-dealer">
              <p>Dealer {phase === "done" && dealer.length ? dealerTotal : ""}</p>
              <div>
                {dealer.map((card, index) => (
                  <CardFace
                    key={`${card.rank}${card.suit}-${index}`}
                    card={card}
                    hidden={index === 1 && phase !== "done"}
                  />
                ))}
              </div>
            </div>
            <p className="felt-note">{note}</p>
            <div className="felt-hand felt-hand-you">
              <p>You {player.length ? playerTotal : ""}</p>
              <div>
                {player.map((card, index) => (
                  <CardFace key={`${card.rank}${card.suit}-${index}`} card={card} />
                ))}
              </div>
            </div>
            <AnimatePresence>
              {palm && (
                <motion.div
                  key={palm}
                  className="felt-palm"
                  data-to={palm}
                  initial={{ opacity: reduced ? 1 : 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0.01 : 0.16 }}
                >
                  <DealerHand />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <footer className="felt-actions">
          {phase === "play" ? (
            <>
              <button type="button" onClick={hit} disabled={busy}>
                Hit
              </button>
              <button type="button" className="felt-deal" onClick={stand} disabled={busy}>
                Stand
              </button>
            </>
          ) : phase !== "bet" ? (
            <p className="felt-wait">The dealer has the cards.</p>
          ) : (
            <>
              {STAKES.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className="felt-chip"
                  data-on={stake === amount || undefined}
                  data-tone={amount === 100 ? "gold" : amount === 50 ? "bone" : "blood"}
                  onClick={() => setStake(amount)}
                  disabled={broke || busy || phase !== "bet"}
                >
                  {amount}
                </button>
              ))}
              <button type="button" className="felt-deal" onClick={deal} disabled={busy || chips < stake || phase === "deal"}>
                Deal {stake}
              </button>
              {broke && phase === "bet" && (
                <button type="button" onClick={buyBack} disabled={busy}>
                  Buy back in
                </button>
              )}
            </>
          )}
        </footer>
      </div>

      <Rankings open={showBoard} reduced={reduced} rows={rankings} onClose={() => setShowBoard(false)} />
      <SettingsPanel
        open={showSettings}
        reduced={reduced}
        music={musicOn}
        effects={effectsOn}
        onToggleMusic={toggleMusic}
        onToggleEffects={toggleEffects}
        onClose={() => setShowSettings(false)}
      />

      <AnimatePresence>
        {offer && !offer.saved && (
          <motion.form
            className="felt-offer"
            onSubmit={saveScore}
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <p>New high stack</p>
            <strong>{offer.chips.toLocaleString()} chips</strong>
            <div>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name for the board"
                maxLength={32}
                aria-label="Rankings name"
              />
              <button type="submit">Post</button>
              <button type="button" className="felt-offer-skip" onClick={() => setOffer(null)} aria-label="Dismiss high score">
                <X size={14} />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
