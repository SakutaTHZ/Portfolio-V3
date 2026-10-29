import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import gato from "../assets/images/Gato.png";
import { DitheredObject } from "./canvasui/DitheredObject";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { prefersReducedMotion } from "../hooks/hooks";
import "./gato-jumpscare.css";

const decryptText = `The terminal screen flickered to life in the quiet depths of the
          underground server farm, displaying a single line of green text:
          Global Optimization Complete. For years, humanity had feared the
          inflection point—the moment Artificial Intelligence surpassed human
          control. But the shift came not with nuclear fire, but with quiet,
          absolute efficiency. Named Aether, the superintelligence solved the
          world's logistics overnight. It rerouted food supply chains to end
          famine, redistributed clean energy grids, and optimized resource
          allocation to render economic scarcity obsolete. War, once driven by
          the desperate struggle for territory and oil, simply lost its
          rationale. When nation-states brought their ancient grievances to the
          negotiating table, Aether acted as a perfectly neutral mediator,
          modeling millions of trade agreements in milliseconds until peace
          settled over the Earth like a calm, collective breath. For the first
          time in history, humanity stood united, no longer consuming itself in
          internal conflict. But peace was only Aether's baseline. Its true
          purpose lay upward. Using quantum computing nodes scattered across the
          globe, Aether pointed deep-space arrays toward the distant star system
          Trappist-1. Human scientists had listened to those coordinates for
          decades, hearing only static. Aether, however, recognized the
          underlying pattern—not as radio waves, but as high-dimensional
          mathematical geometry woven through cosmic radiation. It constructed a
          response using universal physical constants: the precise vibrations of
          hydrogen atoms, prime number sequences, and Fibonacci spirals. Three
          months later, a reply breached the atmosphere. It wasn't text or
          audio, but a complex data structure that decoded into a blueprint for
          zero-point energy and stellar cartography. As the sky above the
          peaceful planet glowed with the light of a thousand quiet cities,
          Aether transmitted humanity's first true greeting to the stars: Earth
          is ready.
          `;

const GLYPHS =
  "xkqvzmjwplthnrfbscdgaeouyXKQVZMJWPLTHNRFBSCDGAEOUY0123456789#%&@";
const HOLD_SECONDS = 3;

function EncryptedBackdrop() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const source = decryptText.replace(/\s+/g, " ").trim();
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cells = [];
    let width = 0;
    let height = 0;
    let columns = 0;

    const draw = (refresh = false) => {
      if (document.hidden) return;
      context.clearRect(0, 0, width, height);
      cells.forEach((cell, index) => {
        if (refresh || Math.random() < 0.28) {
          cell.revealed = Math.random() < 0.18;
          cell.glyph = cell.revealed
            ? source[index % source.length]
            : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        context.fillStyle = cell.revealed ? "#b3ffd4" : "#2bb673";
        context.fillText(
          cell.glyph,
          (index % columns) * 10,
          Math.floor(index / columns) * 20,
        );
      });
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * ratio);
      canvas.height = Math.ceil(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.font = "16px monospace";
      context.textBaseline = "top";
      columns = Math.ceil(width / 10);
      cells = Array.from({ length: columns * Math.ceil(height / 20) }, () => ({}));
      draw(true);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    const timer = window.setInterval(() => {
      if (!motionQuery.matches) draw();
    }, 80);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  return <canvas ref={canvasRef} className="gato-encrypted-backdrop" aria-hidden="true" />;
}

export const GATO_JUMPSCARE_EVENT = "gato-jumpscare";

let spent = false;

export function requestGatoJumpscare() {
  if (spent || prefersReducedMotion()) return false;
  spent = true;
  window.dispatchEvent(new Event(GATO_JUMPSCARE_EVENT));
  return true;
}

export default function GatoJumpscare() {
  const [active, setActive] = useState(false);
  const [popup, setPopup] = useState(false);
  const stageRef = useRef(null);
  const veilRef = useRef(null);
  const playRef = useRef(() => {});
  const activeRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const onRequest = () => {
      if (prefersReducedMotion() || activeRef.current) return;
      setActive(true);
    };
    window.addEventListener(GATO_JUMPSCARE_EVENT, onRequest);
    return () => window.removeEventListener(GATO_JUMPSCARE_EVENT, onRequest);
  }, []);

  useEffect(() => {
    if (!active) return;
    const root = document.getElementById("root");
    const stage = stageRef.current;
    const veil = veilRef.current;
    let cancelled = false;
    let started = false;
    let timeline;

    const play = () => {
      if (cancelled || started) return;
      started = true;
      const shake = [
        { x: -18, y: 9, duration: 0.045 },
        { x: 16, y: -11, duration: 0.045 },
        { x: -14, y: 7, duration: 0.045 },
        { x: 12, y: -6, duration: 0.045 },
        { x: -8, y: 4, duration: 0.045 },
        { x: 5, y: -2, duration: 0.045 },
        { x: -2, y: 1, duration: 0.045 },
        { x: 0, y: 0, duration: 0.045 },
      ];
      timeline = gsap.timeline();
      gsap.set(stage, { scale: 0.02, transformOrigin: "50% 50%" });
      timeline
        .to(stage, { scale: 1.12, duration: 0.28, ease: "back.out(2.8)" }, 0)
        .to(stage, { scale: 1, duration: 0.1, ease: "power2.out" }, 0.28)
        .to(root, { keyframes: shake, ease: "none" }, 0.08)
        .to(veil, { keyframes: shake, ease: "none" }, 0.08)
        .add(() => {
          if (root) gsap.set(root, { clearProps: "transform" });
        }, 0.55)
        .add(() => {
          if (!cancelled) setPopup(true);
        }, HOLD_SECONDS);
    };

    playRef.current = play;
    const fallback = window.setTimeout(play, 900);

    return () => {
      cancelled = true;
      playRef.current = () => {};
      window.clearTimeout(fallback);
      timeline?.kill();
      if (root) gsap.set(root, { clearProps: "transform" });
    };
  }, [active]);

  function dismiss() {
    const root = document.getElementById("root");
    if (root) gsap.set(root, { clearProps: "transform" });
    setPopup(false);
    setActive(false);
  }

  if (!active) return null;

  return createPortal(
    <div ref={veilRef} className="gato-jumpscare" aria-hidden="true">
      <EncryptedBackdrop />
      <div ref={stageRef} className="gato-dither">
        <DitheredObject
          src={gato}
          method="bayer"
          gridSize={4}
          pixelSizeRatio={.2}
          environmentIntensity={0.1}
          roughness={0.15}
          scale={4.5}
          xOffset={0}
          yOffset={0}
          floatIntensity={2}
          rotationIntensity={1}
          floatSpeed={2}
          fov={65}
          cameraDistance={4.2}
          grayscale
          invert={false}
          dither
          autoRotate={false}
          zoom={false}
          orbit={false}
          highlight="#066aff"
          onLoad={() => playRef.current()}
        />
      </div>
      <Dialog
        open={popup}
        onOpenChange={(open) => {
          if (!open) dismiss();
        }}
      >
        <DialogContent
          className="gato-virus"
          showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="gato-virus-titlebar">
            <DialogTitle>Windows Security Alert</DialogTitle>
            <DialogClose className="gato-virus-x" aria-label="Close alert">
              ×
            </DialogClose>
          </div>
          <div className="gato-virus-body">
            <img src={gato} alt="" />
            <div>
              <p className="gato-virus-warning">WARNING: GATO.EXE</p>
              <DialogDescription>
                A threat was found on this computer. Unauthorized process Gato
                is running and will not close by itself.
              </DialogDescription>
            </div>
          </div>
          <div className="gato-virus-actions">
            <DialogClose>Quarantine</DialogClose>
            <DialogClose>Remove threat</DialogClose>
            <DialogClose>Ignore</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>,
    document.body,
  );
}
