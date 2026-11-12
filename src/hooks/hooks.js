import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

let scrollTween = null;
let detachRelease = () => {};

function sectionTop(section) {
  return section.getBoundingClientRect().top + window.scrollY;
}

function releaseScroll() {
  detachRelease();
  scrollTween?.kill();
  scrollTween = null;
}

export function easeScrollTo(top) {
  const distance = Math.abs(top - window.scrollY);
  if (distance < 2) return;

  releaseScroll();

  if (prefersReducedMotion()) {
    window.scrollTo(0, top);
    return;
  }

  const onKeyDown = (event) => {
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
      releaseScroll();
    }
  };
  detachRelease = () => {
    detachRelease = () => {};
    window.removeEventListener("wheel", releaseScroll);
    window.removeEventListener("touchstart", releaseScroll);
    window.removeEventListener("keydown", onKeyDown);
  };
  window.addEventListener("wheel", releaseScroll, { passive: true });
  window.addEventListener("touchstart", releaseScroll, { passive: true });
  window.addEventListener("keydown", onKeyDown);

  scrollTween = gsap.to(window, {
    scrollTo: { y: top, autoKill: false },
    duration: gsap.utils.clamp(0.75, 1.2, 0.6 + distance / 1600),
    ease: "power3.out",
    overwrite: true,
    onComplete: () => {
      scrollTween = null;
      detachRelease();
    },
    onInterrupt() {
      if (scrollTween === this) scrollTween = null;
    },
  });
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useAdaptiveGrid() {
  useEffect(() => {
    const FONT_BASE = 16;
    const BASE_W = 1920;
    const COEF = 0.6666;
    function applyAdaptiveGrid() {
      const w = window.innerWidth;
      const reduction = ((BASE_W - w) / BASE_W) * 100 * COEF;
      const size = FONT_BASE - (FONT_BASE * reduction) / 100;
      if (size > FONT_BASE) document.documentElement.style.fontSize = `${size}px`;
      else document.documentElement.style.removeProperty("font-size");
    }
    applyAdaptiveGrid();
    window.addEventListener("resize", applyAdaptiveGrid);
    return () => window.removeEventListener("resize", applyAdaptiveGrid);
  }, []);
}

export function useInView() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.classList.add("in-view");
      return;
    }
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      once: true,
      onEnter: () => el.classList.add("in-view"),
    });
    return () => trigger.kill();
  }, []);
  return ref;
}

export function scrollToId(event, hash) {
  const el = document.querySelector(hash);
  if (!el) return;
  event.preventDefault();
  easeScrollTo(sectionTop(el));
}
