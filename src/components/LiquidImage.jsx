import { useId, useRef } from "react";
import anime from "animejs";

export default function LiquidImage({
  src,
  alt,
  bare = false,
  scaleTo = 28,
  objectPosition = "center center",
  objectFit = "cover",
  label = "",
}) {
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef(null);
  const turbRef = useRef(null);
  const dispRef = useRef(null);
  const animRef = useRef(null);

  function springTo(hot) {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const wide = window.innerWidth > 768;
    if (!fine || !wide) return;
    rootRef.current?.classList.toggle("is-hot", hot);
    animRef.current?.pause();
    const state = {
      scale: Number(dispRef.current?.getAttribute("scale")) || 1,
      freq: Number(turbRef.current?.getAttribute("baseFrequency")) || 0.009,
    };
    animRef.current = anime({
      targets: state,
      scale: hot ? scaleTo : 1,
      freq: hot ? 0.022 : 0.009,
      duration: 520,
      easing: "easeOutElastic(1, .6)",
      update: () => {
        dispRef.current?.setAttribute("scale", state.scale.toFixed(2));
        turbRef.current?.setAttribute("baseFrequency", state.freq.toFixed(4));
      },
    });
  }

  const filterId = `liquid-${uid}`;

  return (
    <figure
      ref={rootRef}
      className={`liquid${bare ? " bare" : ""}`}
      role="img"
      aria-label={alt}
      onMouseEnter={() => springTo(true)}
      onMouseLeave={() => springTo(false)}
      style={{ pointerEvents: "auto" }}
    >
      <svg className="defs" aria-hidden="true">
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            ref={turbRef}
            type="fractalNoise"
            baseFrequency="0.009"
            numOctaves="2"
            result="noise"
          />
          <feDisplacementMap
            ref={dispRef}
            in="SourceGraphic"
            in2="noise"
            scale="1"
          />
        </filter>
      </svg>
      {src ? (
        <img
          src={src}
          alt=""
          style={{
            objectPosition,
            objectFit,
            filter: `url(#${filterId})`,
          }}
        />
      ) : (
        <div className="liquid-placeholder" style={{ filter: `url(#${filterId})` }}>
          <span>{label}</span>
        </div>
      )}
      {!bare && (
        <>
          <div className="liquid-vignette" />
          <div className="liquid-veil" />
          <div className="liquid-glow" />
        </>
      )}
    </figure>
  );
}
