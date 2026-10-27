import { useLayoutEffect, useRef, useState } from "react";
import MagicBento from "@/components/MagicBento";

const BENTO_GAP = 12;
const MIN_CELL = 150;
const MIN_PAIR = 200;

function columnsFor(width) {
  const cell = (count) => (width - BENTO_GAP * (count - 1)) / count;
  if (cell(4) >= MIN_CELL) return 4;
  if (cell(2) >= MIN_PAIR) return 2;
  return 1;
}

function rowsFor(columns) {
  if (columns >= 4) return 4;
  if (columns === 2) return 8;
  return 10;
}

const skills = ["Figma", "React", "Java", "PHP", "C#", "Spring Boot", "Mentoring"];

const aboutItems = [
  {
    label: "Based",
    title: "Yangon",
    description: "Myanmar. Design and code from the same desk.",
  },
  {
    label: "Now",
    title: "Cosmo-Japan",
    description: "UI/UX system revamp, 2024 — present.",
  },
  {
    label: "Good at",
    title: "Design and code",
    description: "Interfaces that stay coherent from the Figma frame to the React component.",
    colSpan: 2,
    rowSpan: 2,
    visual: (
      <div className="flex flex-wrap content-center gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full px-2.5 py-1 text-[12px] font-medium"
            style={{ background: "rgba(255, 216, 77, 0.14)", color: "#ffd84d" }}
          >
            {skill}
          </span>
        ))}
      </div>
    ),
  },
  {
    label: "Sign",
    title: "Not listed",
    description: "Your sign is not in the notes I have. Tell me and I will put it here.",
  },
  {
    label: "Blood type",
    title: "Not listed",
    description: "Same for blood type. I will not guess it.",
  },
  {
    label: "I like",
    title: "Games, music, experiments",
    description: "Interfaces built just to see if the motion feels right.",
    colSpan: 2,
  },
  {
    label: "GitHub",
    title: "Sakuta_THZ",
    description: "Public profile, repos, and contribution history.",
    href: "https://github.com/SakutaTHZ",
    target: "_blank",
    rel: "noreferrer",
    image:
      "https://github-readme-stats.vercel.app/api?username=SakutaTHZ&show_icons=true&hide_border=true&bg_color=121116&title_color=ffd84d&text_color=f4f4f5&icon_color=ffd84d",
    colSpan: 2,
    rowSpan: 2,
  },
  {
    label: "Record",
    title: "BSc Computer Science",
    description: "University of Yangon. Samsung App Inventor 2017, Uni Hack 3rd, Ooredoo 2nd.",
    colSpan: 2,
  },
];

const services = [
  {
    index: "01",
    title: "Interface design",
    text: "Flows, screens, and prototypes in Figma, shaped around how a person actually moves through the product.",
  },
  {
    index: "02",
    title: "Product frontends",
    text: "The same intent carried into React, so the shipped interface matches the prototype instead of drifting away from it.",
  },
  {
    index: "03",
    title: "Design systems",
    text: "Responsive layouts and a coherent visual language for products that already exist and need a clearer system.",
  },
  {
    index: "04",
    title: "Mentoring",
    text: "Guiding junior developers through the work, the same way teaching made the hard part understandable.",
  },
];

function Eyebrow({ children }) {
  return <p className="text-[11px] uppercase tracking-[0.22em] text-[#ffd84d]">{children}</p>;
}

function AboutSection() {
  const slotRef = useRef(null);
  const [rowHeight, setRowHeight] = useState(160);
  const [fitted, setFitted] = useState(true);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    const measure = () => {
      const columns = columnsFor(slot.clientWidth);
      const rows = rowsFor(columns);
      const next = Math.floor((slot.clientHeight - BENTO_GAP * (rows - 1)) / rows);
      const canFit = columns === 4 && next >= 118;
      setFitted(canFit);
      setRowHeight(canFit ? next : 176);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      className={`relative box-border flex flex-col px-[7%] pt-24 pb-6 md:pt-28 md:pb-8 ${
        fitted ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh] overflow-visible"
      }`}
    >
      <div className="flex shrink-0 items-end justify-between gap-10">
        <div>
          <Eyebrow>About me</Eyebrow>
          <h2 className="mt-3 text-4xl leading-none md:text-6xl">Thar Htet Zan</h2>
        </div>
        <p className="hidden max-w-sm text-sm leading-relaxed text-[#a3a3a3] lg:block">
          I start with how a product should feel, then I build the interface that holds it. Figma in one hand, React in the other.
        </p>
      </div>
      <div ref={slotRef} className="mt-6 min-h-0 flex-1">
        <MagicBento
          className="h-full"
          style={{ "--mb-surface": "transparent", "--mb-shadow": "none" }}
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

export default function SiteSections() {
  return (
    <>
      <AboutSection />

      <section id="services" className="relative flex min-h-[100dvh] flex-col justify-center px-[7%] py-16">
        <Eyebrow>Services</Eyebrow>
        <h2 className="mt-4 max-w-xl text-5xl leading-[0.95] md:text-7xl">What I do</h2>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <article key={service.index} className="rounded-2xl border border-[#333333] bg-[#161616]/80 p-7">
              <p className="text-sm text-[#ffd84d]">{service.index}</p>
              <h3 className="mt-4 text-2xl">{service.title}</h3>
              <p className="mt-3 max-w-md leading-relaxed text-[#a3a3a3]">{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="testimonials" className="relative flex min-h-[100dvh] flex-col justify-center px-[7%] py-16">
        <Eyebrow>Testimonials</Eyebrow>
        <h2 className="mt-4 max-w-xl text-5xl leading-[0.95] md:text-7xl">What people say</h2>
        <div className="mt-14 rounded-2xl border border-dashed border-[#333333] bg-[#161616]/50 px-7 py-12 md:px-10">
          <p className="max-w-lg text-lg leading-relaxed text-[#a3a3a3]">
            Notes from clients and collaborators will live here. None have been added yet.
          </p>
        </div>
      </section>
    </>
  );
}
