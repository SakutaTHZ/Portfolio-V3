import { useState } from "react";
import Eyebrow from "./Eyebrow";
import Reveal from "./Reveal";

const lines = [
  {
    kicker: "Motto",
    quote: "I start with how a product should feel, then I build the interface that holds it.",
    note: "Figma in one hand. React in the other. The order matters.",
  },
  {
    kicker: "Since 2016",
    quote: "Coding is like passion. I have been learning across more than ten languages.",
    note: "Java, PHP, C#, Spring Boot, then the frontend work that became the job.",
  },
  {
    kicker: "The brief",
    quote: "I turn complex ideas into simple, functional solutions.",
    note: "UI and UX first, then the frontend and backend that keep the feeling intact.",
  },
  {
    kicker: "Off the clock",
    quote: "Curious and focused, and still home for tactical games, good food, and family.",
    note: "Between Godot experiments, microcontrollers, and a quiet page in SakutaOS.",
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const current = lines[active];

  return (
    <section id="testimonials" className="relative flex min-h-[100dvh] flex-col justify-center px-[7%] py-24">
      <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>In my own words</Eyebrow>
          <h2 className="mt-4 max-w-xl text-5xl leading-[0.92] tracking-[-0.04em] md:text-7xl">
            No borrowed praise
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-[#a3a3a3]">
          These lines are mine, from this site and the public bio. I would rather show the work than invent a client quote.
        </p>
      </Reveal>

      <Reveal as="figure" delay={0.08} className="mt-14 max-w-5xl">
        <p className="font-obitron text-xs tracking-[0.22em] text-[#ffd84d] uppercase">{current.kicker}</p>
        <blockquote className="mt-4 text-3xl leading-[1.15] tracking-[-0.035em] md:text-5xl md:leading-[1.08]">
          “{current.quote}”
        </blockquote>
        <figcaption className="mt-6 max-w-lg text-sm leading-relaxed text-[#a3a3a3]">{current.note}</figcaption>
      </Reveal>

      <div className="mt-12 grid gap-3 md:grid-cols-4" role="tablist" aria-label="Lines">
        {lines.map((line, index) => {
          const selected = index === active;
          return (
            <Reveal
              as="button"
              key={line.kicker}
              delay={0.12 + index * 0.06}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(index)}
              className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                selected
                  ? "border-[#ffd84d] bg-[#ffd84d] text-[#111111]"
                  : "border-white/10 bg-[#161616]/70 text-white hover:border-white/30"
              }`}
            >
              <span className="block text-[11px] tracking-[0.18em] uppercase opacity-70">{line.kicker}</span>
              <span className="mt-2 block text-sm leading-snug">{line.quote}</span>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
