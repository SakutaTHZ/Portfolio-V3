import { useLayoutEffect, useRef, useState } from "react";
import MagicBento from "@/components/MagicBento";
import Card from "@/assets/images/SakutaCard.png";
import Eyebrow from "./Eyebrow";
import HoloCard from "../HoloCard";
import ScrambledText from "../ScrambledText";
import FlameWrap from "../canvasui/FlameWrap";

const BENTO_GAP = 16;
const MIN_CELL = 150;
const MIN_PAIR = 200;
const MIN_ROW = 112;

function columnsFor(width) {
  const cell = (count) => (width - BENTO_GAP * (count - 1)) / count;
  if (cell(4) >= MIN_CELL) return 4;
  if (cell(2) >= MIN_PAIR) return 2;
  return 1;
}

function rowsFor(columns) {
  if (columns >= 4) return 4;
  if (columns === 2) return 8;
  return 9;
}

const skills = [
  "Figma",
  "React",
  "Java",
  "PHP",
  "C#",
  "Spring Boot",
  "Mentoring",
];

const aboutItems = [
  {
    col: 1,
    row: 1,
    colSpan: 2,
    rowSpan: 2,
    background: "#00000000",
    color: "#ffd84d",
    muted: "rgba(255, 216, 77, 0.7)",
    overflow: "visible",
    content: (
      <div className="h-full min-h-0 w-full rounded-[14px]  p-2 overflow-y-auto md:flex md:items-center md:justify-between md:@container-size">
        <HoloCard
          image={Card}
          alt="My tcg"
          className="float-right mb-3 ml-4 max-md:max-w-[150px] [--about-card-width:42%] md:float-none md:order-2 md:m-0 md:[--about-card-width:initial]"
          style={{
            width:
              "var(--about-card-width, min(360px, 90cqw, calc(90cqh * var(--hc-ratio))))",
          }}
          card="pikachu"
          preset="shards"
          foilColor="#e2e6ec30"
          intensity={0.2}
          scale={1}
          edgeSparkle={0.4}
          frame={4}
          glare={0.25}
          tiltMax={14}
          hoverScale={1.04}
          radius={14}
          idle
          shadow
        />
        <div className="md:order-1 md:flex md:h-full md:w-3/5 md:flex-col md:justify-between gap-2">
          <span>About Me</span>
          <ScrambledText
            className="scrambled-text-demo p-0! m-0! mt-2 text-sm leading-relaxed text-white"
            effect="scramble"
            radius={100}
            strength={1}
            trail={0.6}
            duration={1.2}
            speed={0.5}
            scrambleChars=".:"
            clickBurst
          >
            I’m a full-stack frontend engineer and UI/UX designer based in
            Yangon, Myanmar, driven by a deep passion for building things that
            bridge art and technology. I balance sharp design intuition with
            modern technical skills across tools like React, Next.js, and NestJS
            to build digital products that look great and work seamlessly.
            Beyond software engineering, my curiosity keeps me constantly
            experimenting—whether that’s diving into microcontroller hardware,
            tinkering with 2D game development in Godot, or picking up new
            skills to expand my creative toolkit. As a person, I’m naturally
            curious, adaptable, and focused, but I always make sure to stay
            grounded by enjoying tactical gaming, good food, and quality time
            with my family.
          </ScrambledText>
        </div>
      </div>
    ),
  },
  {
    background: "#00000000",
    label: "Stats",
    title: "Myanmar · English",
    description:
      "Design and code, from the Figma frame to the React component.",
    col: 3,
    row: 1,
    colSpan: 2,
    content: (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <span className="text-[12px] leading-4 font-medium text-[color:var(--mb-muted)]">
          Stats
        </span>
        <div className="mt-auto flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full px-2.5 py-1 text-[12px] font-medium"
              style={{
                background: "rgba(255, 216, 77, 0.14)",
                color: "#ffd84d",
              }}
            >
              {skill}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[13px] leading-5 text-[color:var(--mb-muted)]">
          Myanmar · English
        </p>
      </div>
    ),
  },
  {
    background: "#00000000",
    label: "Music",
    title: "Player",
    description: "A music player goes here.",
    col: 3,
    row: 2,
    colSpan: 2,
  },
  {
    background: "#00000000",
    label: "Based",
    title: "Yangon",
    description: "Myanmar. Design and code from the same desk.",
    col: 1,
    row: 3,
  },
  {
    background: "#00000000",
    label: "Current work",
    title: "Cosmo-Japan",
    description: "UI/UX system revamp, 2024 — present.",
    col: 2,
    row: 3,
  },
  {
    background: "#00000000",
    label: "Motto",
    title: "Feel, then build",
    description:
      "I start with how a product should feel, then I build the interface that holds it.",
    col: 1,
    row: 4,
    colSpan: 2,
  },
  {
    background: "#00000000",
    label: "About me",
    title: "Thar Htet Zan",
    description:
      "I start with how a product should feel, then I build the interface that holds it. Figma in one hand, React in the other.",
    col: 3,
    row: 3,
    colSpan: 2,
    rowSpan: 2,
    content: (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <Eyebrow>About me</Eyebrow>
        <div className="mt-auto max-w-md">
          <h2 className="text-[clamp(1.75rem,2.6vw,2.75rem)] leading-[0.95] tracking-[-0.03em]">
            Thar Htet Zan
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#a3a3a3]">
            I start with how a product should feel, then I build the interface
            that holds it. Figma in one hand, React in the other.
          </p>
        </div>
      </div>
    ),
  },
];

export default function About() {
  const slotRef = useRef(null);
  const [rowHeight, setRowHeight] = useState(160);
  const [rows, setRows] = useState(4);
  const [fitted, setFitted] = useState(true);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    const measure = () => {
      const width = slot.clientWidth;
      const height = slot.clientHeight;
      if (!width || !height) return;

      const desktop = window.matchMedia("(min-width: 768px)").matches;
      const columns = columnsFor(width);
      const nextRows = rowsFor(columns);
      const next = Math.max(
        1,
        Math.floor((height - BENTO_GAP * (nextRows - 1)) / nextRows),
      );
      const canFit = desktop || (columns === 4 && next >= MIN_ROW);
      setRows(nextRows);
      setFitted(canFit);
      setRowHeight(canFit ? next : Math.max(next, 168));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      className={`relative box-border flex flex-col p-4 md:h-dvh md:overflow-hidden md:p-16 ${
        fitted
          ? "h-dvh overflow-hidden"
          : "max-md:min-h-dvh max-md:overflow-visible"
      }`}
    >
      <div ref={slotRef} className="min-h-0 h-full w-full flex-1">
        <MagicBento
          className="h-full"
          items={aboutItems}
          columns={4}
          rowHeight={rowHeight}
          gap={BENTO_GAP}
          radius={20}
          theme="dark"
          glowColor="#ffd84d"
          enableBorderGlow={true}
          enableSpotlight={true}
          spotlightRadius={300}
          enableStars={true}
          clickEffect={true}
          intro={true}
          textAutoHide={rowHeight < 156}
        />
      </div>
    </section>
  );
}
