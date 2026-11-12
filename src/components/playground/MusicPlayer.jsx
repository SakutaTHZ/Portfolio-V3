import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Pause, Play, SkipBack, SkipForward, Volume1, Volume2 } from "lucide-react";
import ElasticSlider from "@/components/ElasticSlider";
import { prefersReducedMotion } from "@/hooks/hooks";
import { useDesktop } from "./desktopContext";
import counting from "@/assets/musics/Counting_Heartbeats.mp3";
import death from "@/assets/musics/Death_to_the_Layout.mp3";
import purple from "@/assets/musics/Purple_Links.mp3";
import steam from "@/assets/musics/Solutions_In_The_Steam.mp3";

const TRACKS = [
  { title: "Counting Heartbeats", src: counting },
  { title: "Death to the Layout", src: death },
  { title: "Purple Links", src: purple },
  { title: "Solutions in the Steam", src: steam },
];

const session = {
  index: 0,
  time: 0,
  playing: false,
};

const SLIDER = {
  leftIcon: null,
  rightIcon: null,
  valuePosition: "none",
  thickness: 4,
  activeThickness: 7,
  maxStretch: 18,
  restOpacity: 1,
  growOnHover: true,
  rangeColor: "var(--pg-accent, #ff5b3e)",
  trackColor: "color-mix(in srgb, var(--pg-ink, #f4f4f4) 30%, transparent)",
  iconColor: "var(--pg-muted, rgba(255, 255, 255, 0.55))",
};

const SHAPES = {
  desktop: {
    closed: { width: 250, height: 64, borderRadius: 32 },
    open: { width: 440, height: 156, borderRadius: 22 },
  },
  mobile: {
    closed: { width: 58, height: 58, borderRadius: 29 },
    open: { width: 320, height: 168, borderRadius: 20 },
  },
};

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remain = Math.floor(seconds % 60);
  return `${minutes}:${String(remain).padStart(2, "0")}`;
}

function formatRemain(time, duration) {
  const left = Math.max(0, (duration || 0) - (time || 0));
  return `-${formatTime(left)}`;
}

function useMobilePlayer() {
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

export default function MusicPlayer() {
  const audioRef = useRef(null);
  const rootRef = useRef(null);
  const resumeRef = useRef(false);
  const seekingRef = useRef(false);
  const holding = useRef(false);
  const closeTimer = useRef(0);
  const mobile = useMobilePlayer();
  const [index, setIndex] = useState(session.index);
  const [playing, setPlaying] = useState(session.playing);
  const [time, setTime] = useState(session.time);
  const [duration, setDuration] = useState(0);
  const indexRef = useRef(index);
  indexRef.current = index;
  const { settings, patchSettings } = useDesktop();
  const volume = settings.volume;
  const muted = settings.muted;
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);

  const track = TRACKS[index];
  const open = hover || pinned;
  const shape = { ...SHAPES[mobile ? "mobile" : "desktop"][open ? "open" : "closed"] };
  if (mobile && open) shape.width = Math.min(shape.width, window.innerWidth - 86);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const syncDuration = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    };
    syncDuration();
    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    return () => {
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
    };
  }, [index]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    audio.volume = muted ? 0 : volume;
  }, [muted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !resumeRef.current) return undefined;
    resumeRef.current = false;
    const play = () => {
      audio.play().catch(() => setPlaying(false));
    };
    if (audio.readyState >= 2) play();
    else audio.addEventListener("canplay", play, { once: true });
    return () => audio.removeEventListener("canplay", play);
  }, [index]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const restoreAt = session.time;
    const shouldPlay = session.playing;
    const restore = () => {
      if (restoreAt > 0.3 && audio.currentTime < 0.3) audio.currentTime = restoreAt;
    };
    if (restoreAt > 0.3) {
      if (audio.readyState >= 1) restore();
      else audio.addEventListener("loadedmetadata", restore, { once: true });
    }
    if (shouldPlay) {
      const play = () => audio.play().catch(() => setPlaying(false));
      if (audio.readyState >= 2) play();
      else audio.addEventListener("canplay", play, { once: true });
    }
    return () => {
      if (audio.isConnected) {
        session.time = audio.currentTime > 0.05 ? audio.currentTime : session.time;
        session.playing = !audio.paused;
      }
      session.index = indexRef.current;
      audio.removeEventListener("loadedmetadata", restore);
    };
  }, []);

  useEffect(() => {
    if (!pinned) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setPinned(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [pinned]);

  useEffect(() => {
    if (mobile) setHover(false);
  }, [mobile]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    const release = (event) => {
      if (!holding.current) return;
      holding.current = false;
      if (!rootRef.current?.contains(event.target)) setHover(false);
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  function show(event) {
    if (event.pointerType === "touch" || mobile) return;
    window.clearTimeout(closeTimer.current);
    setHover(true);
  }

  function hide(event) {
    if (event.pointerType === "touch" || mobile || holding.current) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setHover(false), 160);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }

  function go(next, autoplay) {
    const normalized = (next + TRACKS.length) % TRACKS.length;
    if (normalized === index) {
      if (autoplay) audioRef.current?.play().catch(() => setPlaying(false));
      return;
    }
    resumeRef.current = autoplay;
    session.index = normalized;
    session.time = 0;
    session.playing = autoplay;
    setIndex(normalized);
    setTime(0);
    setDuration(0);
  }

  function skip(delta) {
    go(index + delta, playing || !audioRef.current?.paused);
  }

  return (
    <motion.aside
      ref={rootRef}
      className="pg-player"
      data-open={open || undefined}
      data-playing={playing || undefined}
      data-mobile={mobile || undefined}
      initial={false}
      animate={shape}
      transition={
        prefersReducedMotion()
          ? { duration: 0 }
          : { duration: 0.48, ease: [0.22, 1, 0.36, 1] }
      }
      onPointerEnter={show}
      onPointerLeave={hide}
      onPointerDown={() => {
        holding.current = true;
      }}
    >
      <div className="pg-player-sheet">
        <div className="pg-player-card" inert={open ? undefined : true}>
          <div className="pg-player-cover" aria-hidden="true">
            <span className="pg-disc" />
          </div>
          <div className="pg-player-body">
            <div className="pg-player-meta">
              <strong>{track.title}</strong>
              <span>SakutaOS</span>
            </div>
            <ElasticSlider
              className="pg-elastic pg-player-seek"
              style={{ width: "100%", "--elastic-slider-hit": "16px" }}
              {...SLIDER}
              value={duration > 0 ? Math.min(time, duration) : 0}
              startingValue={0}
              maxValue={duration > 0 ? duration : 1}
              disabled={!duration}
              formatValue={(next) => formatTime(next)}
              ariaLabel="Seek"
              onChange={(next) => {
                seekingRef.current = true;
                session.time = next;
                if (audioRef.current) audioRef.current.currentTime = next;
                setTime(next);
              }}
              onChangeEnd={() => {
                seekingRef.current = false;
              }}
            />
            <div className="pg-player-times">
              <span>{formatTime(time)}</span>
              <span>{formatRemain(time, duration)}</span>
            </div>
            <div className="pg-player-row">
              <div className="pg-player-transport">
                <button type="button" aria-label="Previous song" onClick={() => skip(-1)}>
                  <SkipBack size={15} />
                </button>
                <button type="button" className="pg-player-play" aria-label={playing ? "Pause" : "Play"} onClick={togglePlay}>
                  {playing ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <button type="button" aria-label="Next song" onClick={() => skip(1)}>
                  <SkipForward size={15} />
                </button>
              </div>
              <ElasticSlider
                className="pg-elastic pg-player-volume"
                style={{
                  width: mobile ? "4.6rem" : "7.4rem",
                  flex: "none",
                  marginLeft: "auto",
                  "--elastic-slider-hit": "18px",
                }}
                {...SLIDER}
                leftIcon={<Volume1 size={14} />}
                rightIcon={<Volume2 size={14} />}
                value={muted ? 0 : volume}
                startingValue={0}
                maxValue={1}
                formatValue={(next) => `${Math.round(next * 100)}`}
                ariaLabel="Volume"
                onChange={(next) => patchSettings({ volume: next, muted: next === 0 })}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          className="pg-player-compact"
          aria-expanded={open}
          aria-label={`${track.title}. ${open ? "Hide" : "Show"} player`}
          onClick={() => setPinned((value) => !value)}
        >
          <span className="pg-disc" aria-hidden="true" />
          <span className="pg-player-name">{track.title}</span>
        </button>
      </div>

      <audio
        ref={audioRef}
        src={track.src}
        preload="metadata"
        onTimeUpdate={(event) => {
          if (seekingRef.current) return;
          const next = event.currentTarget.currentTime;
          session.time = next;
          setTime(next);
        }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onPlay={() => {
          session.playing = true;
          setPlaying(true);
        }}
        onPause={() => {
          setPlaying(false);
          if (audioRef.current?.isConnected) session.playing = false;
        }}
        onEnded={() => go(index + 1, true)}
      />
    </motion.aside>
  );
}
