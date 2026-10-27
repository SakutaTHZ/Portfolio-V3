import { useEffect, useRef } from "react";
import gsap from "gsap";
import CountUp from "./CountUp";
import { prefersReducedMotion } from "../hooks/hooks";

export default function Preloader({ onDone }) {
  const rootRef = useRef(null);
  const doneRef = useRef(false);
  const slideRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      onDone();
      return;
    }

    window.lenis?.stop();
    window.scrollTo(0, 0);

    return () => {
      slideRef.current?.kill();
    };
  }, [onDone]);

  const handleEnd = () => {
    if (doneRef.current) return;
    const root = rootRef.current;
    if (!root) return;
    root.classList.add("is-fading");
    slideRef.current = gsap.to(root, {
      yPercent: -100,
      duration: 0.65,
      delay: 0.5,
      ease: "power3.out",
      onComplete: () => {
        if (doneRef.current) return;
        doneRef.current = true;
        root.style.pointerEvents = "none";
        root.setAttribute("aria-hidden", "true");
        window.lenis?.start();
        onDone();
      },
    });
  };

  if (prefersReducedMotion()) return null;

  return (
    <div className="preloader" ref={rootRef} role="status" aria-live="polite">
      <p className="preloader-brand">Thar Htet Zan</p>
      <p className="preloader-count">
        <CountUp
          to={100}
          from={0}
          duration={2}
          trigger="load"
          easing="linear"
          suffix="%"
          onEnd={handleEnd}
          mode="roll"
        />
      </p>
    </div>
  );
}
