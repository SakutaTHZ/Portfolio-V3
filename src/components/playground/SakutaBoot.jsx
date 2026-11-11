import { useCallback, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/hooks/hooks";
import logo from "@/assets/images/logo.png";

gsap.registerPlugin(useGSAP);

const LINES = [
  "SAKUTAOS BIOS 1.0",
  "Memory check .................... OK",
  "Mounting /playground ............ OK",
  "Starting WindowServer ........... OK",
  "Starting Dock ................... OK",
];

export default function SakutaBoot({ onDone }) {
  const rootRef = useRef(null);
  const doneRef = useRef(false);
  const tlRef = useRef(null);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    tlRef.current?.kill();
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) {
      onDone();
      return;
    }
    gsap.to(root, {
      autoAlpha: 0,
      duration: 0.45,
      ease: "power2.inOut",
      onComplete: onDone,
    });
  }, [onDone]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        onDone();
        return;
      }

      const root = rootRef.current;
      if (!root) return;
      const logoEl = root.querySelector(".pg-boot-logo");
      const word = root.querySelector(".pg-boot-word");
      const version = root.querySelector(".pg-boot-version");
      const lines = root.querySelectorAll(".pg-boot-line");
      const bar = root.querySelector(".pg-boot-bar-fill");
      const hint = root.querySelector(".pg-boot-hint");

      gsap.set([logoEl, word, version, lines, hint], { autoAlpha: 0 });
      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });

      const tl = gsap.timeline({ onComplete: finish });
      tlRef.current = tl;
      tl.fromTo(logoEl, { autoAlpha: 0, scale: 0.78 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power3.out" })
        .fromTo(word, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.42, ease: "power2.out" }, "-=0.18")
        .fromTo(version, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.28 }, "-=0.12")
        .to(lines, { autoAlpha: 1, stagger: 0.11, duration: 0.22, ease: "none" }, "+=0.08")
        .to(bar, { scaleX: 1, duration: 0.95, ease: "power1.inOut" }, "-=0.35")
        .fromTo(hint, { autoAlpha: 0 }, { autoAlpha: 0.7, duration: 0.25 }, "-=0.4")
        .to({}, { duration: 0.35 });
    },
    { scope: rootRef, dependencies: [] }
  );

  if (prefersReducedMotion()) return null;

  return (
    <div
      ref={rootRef}
      className="pg-boot"
      role="dialog"
      aria-label="SakutaOS is starting"
      aria-live="polite"
      onClick={finish}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
          event.preventDefault();
          finish();
        }
      }}
      tabIndex={0}
    >
      <img src={logo} alt="" className="pg-boot-logo" width={88} height={88} draggable={false} />
      <p className="pg-boot-word">SakutaOS</p>
      <p className="pg-boot-version">version 1.0 · playground kernel</p>
      <div className="pg-boot-log">
        {LINES.map((line) => (
          <p key={line} className="pg-boot-line">
            {line}
          </p>
        ))}
      </div>
      <div className="pg-boot-bar" aria-hidden="true">
        <span className="pg-boot-bar-fill" />
      </div>
      <p className="pg-boot-hint">click to skip</p>
    </div>
  );
}
