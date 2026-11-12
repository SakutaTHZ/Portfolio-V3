import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/hooks/hooks";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Reveal({
  as: Tag = "div",
  className,
  children,
  delay = 0,
  y = 36,
  ...rest
}) {
  const ref = useRef(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    gsap.from(el, {
      y,
      autoAlpha: 0,
      duration: 0.9,
      delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        once: true,
      },
      onComplete: () => {
        gsap.set(el, { clearProps: "transform,opacity,visibility" });
      },
    });
  }, { scope: ref, dependencies: [delay, y] });

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
