import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import "./hero.css";
import MarbleMe from "@/assets/images/MarbleMe.png";
import ShinyText from "@/components/ShinyText";
import DitherVeil from "@/components/DitherVeil";
import ScrambledText from "@/components/ScrambledText";
import HeroDock from "@/components/HeroDock";
import LaserFlow from "@/components/LaserFlow";
import { prefersReducedMotion } from "@/hooks/hooks";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function useMinWidth(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export default function Hero({ ready = false }) {
  const sectionRef = useRef(null);
  const portraitRef = useRef(null);
  const introRef = useRef(null);
  const nameRollRef = useRef(null);
  const figmaBarRef = useRef(null);
  const laserRef = useRef(null);
  const showLaser = useMinWidth("(min-width: 768px)");

  useGSAP(() => {
    const portrait = portraitRef.current;
    const intro = introRef.current;
    const nameRoll = nameRollRef.current;
    const lines = intro?.querySelectorAll(":scope > p");
    if (prefersReducedMotion()) return;

    if (!ready) {
      gsap.set(portrait, { autoAlpha: 0 });
      gsap.set(intro, { autoAlpha: 0 });
      gsap.set(lines, { x: -80 });
      gsap.set(nameRoll, { yPercent: 110 });
      return;
    }

    const tl = gsap.timeline();
    tl.fromTo(portrait, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.15, ease: "power2.out" }, 0)
      .fromTo(intro, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power2.out" }, 0.12)
      .fromTo(lines, { x: -80 }, { x: 0, duration: 0.95, stagger: 0.1, ease: "expo.out" }, 0.12)
      .fromTo(nameRoll, { yPercent: 110 }, { yPercent: 0, duration: 1.15, ease: "expo.out" }, 0.2);
  }, { scope: sectionRef, dependencies: [ready], revertOnUpdate: true });

  useGSAP(() => {
    if (!ready || !showLaser || !laserRef.current || prefersReducedMotion()) return;
    gsap.to(laserRef.current, {
      autoAlpha: 0,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "+=60%",
        scrub: 0.45,
      },
    });
  }, { scope: sectionRef, dependencies: [ready, showLaser] });

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* <HologramPortrait models={models} /> */}
      <div className="absolute inset-0 flex justify-center items-center font-bold text-4 text-white overflow-hidden">
        {/* Main Image */}
        <div ref={portraitRef} className="absolute inset-x-0 bottom-0 h-[70%] md:h-[90%] will-change-transform">
          <DitherVeil
            src={MarbleMe}
            className="absolute inset-0"
            pattern="bayer"
            pixelSize={1}
            inkColor="#120f17"
            paperColor="#f4f1ea"
            revealRadius={150}
            softness={0.8}
            linger={2}
            fit="contain"
            rimColor="#a78bfa"
            palette="duotone"
            levels={2}
            contrast={1.15}
            brightness={-0.25}
            rim={0}
            reverse={false}
            wander={true}
            clickBurst
          />
        </div>

        {/* Name */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div ref={nameRollRef} className="flex flex-col-reverse md:flex-col md:items-end will-change-transform">
            <HeroDock ref={figmaBarRef} />
            <h1 id="hero-title" className="text-7xl md:text-[12rem] font-obitron p-4 pt-0 text-left md:text-center text-shadow">
              <ShinyText
                text="THAR HTET ZAN"
                color="#ffffff"
                shineColor="#FFF4DE"
                speed={5}
                shineWidth={60}
                softness={2}
                trigger="loop"
                delay={0}
                angle={120}
                bands={1}
                glow={0}
                direction="left"
                easing="smooth"
                yoyo={false}
                followPointer={true}
                pauseOnHover={false}
                disabled={false}
              />
            </h1>
          </div>
        </div>

        <div ref={laserRef} className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
          {ready && showLaser && (
            <LaserFlow
              surfaceRef={figmaBarRef}
              beamAnchor="surface"
              beamPosition={0.5}
              color="#ffd84d"
              intensity={1.4}
              beamWidth={0.5}
              flare={0.7}
              spread={0.6}
              spill={0.25}
              fog={0.08}
              dust={0.6}
              speed={0.8}
              dpr={1}
              mouseInteraction={false}
            />
          )}
        </div>

        {/* Quick introduction */}
        
        <div ref={introRef} className="w-[75dvw] md:w-[25dvw] text-sm absolute font-normal top-20 left-4 p-4 space-y-2 will-change-transform">
          <p className="text-md opacity-50">Hello,</p>
          <p className="text-left text-xs md:text-sm">
            <ScrambledText
              className="scrambled-text-demo p-0! m-0!"
              effect="scramble"
              radius={100}
              strength={1}
              trail={0.6}
              duration={1.2}
              speed={0.5}
              scrambleChars=".:"
              clickBurst
              intro={ready}
            >
              I'm a passionate web developer with experience in creating dynamic
              and user-friendly websites and applications. I love coding and
              continuously learning new technologies to enhance my skills.
            </ScrambledText>
          </p>
        </div>
      </div>
    </section>
  );
}
