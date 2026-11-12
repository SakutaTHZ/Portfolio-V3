import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { prefersReducedMotion } from "@/hooks/hooks";
import counting from "@/assets/musics/Counting_Heartbeats.mp3";
import death from "@/assets/musics/Death_to_the_Layout.mp3";
import purple from "@/assets/musics/Purple_Links.mp3";
import steam from "@/assets/musics/Solutions_In_The_Steam.mp3";

const TRACKS = [
  { title: "Counting Heartbeats", src: counting, color: "#3ddc97" },
  { title: "Death to the Layout", src: death, color: "#ff5b3e" },
  { title: "Purple Links", src: purple, color: "#b07cff" },
  { title: "Solutions in the Steam", src: steam, color: "#5ac8ff" },
];

const SHAPES = {
  desktop: {
    closed: { width: 250, height: 64, borderRadius: 32 },
    open: { width: 318, height: 188, borderRadius: 26 },
  },
  mobile: {
    closed: { width: 58, height: 58, borderRadius: 29 },
    open: { width: 172, height: 196, borderRadius: 26 },
  },
};

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remain = Math.floor(seconds % 60);
  return `${minutes}:${String(remain).padStart(2, "0")}`;
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
  const closeTimer = useRef(0);
  const mobile = useMobilePlayer();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);

  const track = TRACKS[index];
  const open = hover || pinned;
  const shape = SHAPES[mobile ? "mobile" : "desktop"][open ? "open" : "closed"];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    audio.volume = muted ? 0 : volume;
    if (!resumeRef.current) return undefined;
    resumeRef.current = false;
    const play = () => {
      audio.play().catch(() => setPlaying(false));
    };
    if (audio.readyState >= 2) play();
    else audio.addEventListener("canplay", play, { once: true });
    return () => audio.removeEventListener("canplay", play);
  }, [index, muted, volume]);

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

  function show(event) {
    if (event.pointerType === "touch" || mobile) return;
    window.clearTimeout(closeTimer.current);
    setHover(true);
  }

  function hide(event) {
    if (event.pointerType === "touch" || mobile) return;
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
    setIndex(normalized);
    setTime(0);
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
      style={{ "--pg-disc": track.color }}
      initial={false}
      animate={shape}
      transition={
        prefersReducedMotion()
          ? { duration: 0 }
          : { duration: 0.48, ease: [0.22, 1, 0.36, 1] }
      }
      onPointerEnter={show}
      onPointerLeave={hide}
    >
      <div className="pg-player-sheet">
        <div className="pg-player-controls" inert={open ? undefined : true}>
          <div className="pg-player-transport">
            <button type="button" aria-label="Previous song" onClick={() => skip(-1)}>
              <SkipBack size={15} />
            </button>
            <button type="button" className="pg-player-play" aria-label={playing ? "Pause" : "Play"} onClick={togglePlay}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button type="button" aria-label="Next song" onClick={() => skip(1)}>
              <SkipForward size={15} />
            </button>
          </div>

          <label className="pg-player-seek">
            <span>{formatTime(time)}</span>
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 1}
              step={0.1}
              value={duration > 0 ? Math.min(time, duration) : 0}
              aria-label="Seek"
              onChange={(event) => {
                const next = Number(event.target.value);
                if (audioRef.current) audioRef.current.currentTime = next;
                setTime(next);
              }}
            />
            <span>{formatTime(duration)}</span>
          </label>

          <label className="pg-player-volume">
            <button type="button" aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((value) => !value)}>
              {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              aria-label="Volume"
              onChange={(event) => {
                setVolume(Number(event.target.value));
                setMuted(false);
              }}
            />
          </label>
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
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => go(index + 1, true)}
      />
    </motion.aside>
  );
}
