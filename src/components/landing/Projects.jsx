import { ArrowUpRight } from "lucide-react";
import Eyebrow from "./Eyebrow";
import Reveal from "./Reveal";

const work = [
  {
    year: "2026",
    title: "SakutaOS",
    text: "This portfolio, booted like a desktop. Windows, a music player, a memo book, and a cat that should not be trusted.",
    href: "/playground",
    label: "Open the desktop",
    tags: ["React", "GSAP", "WebGL"],
  },
  {
    year: "2024",
    title: "Shika Typo",
    text: "A typing room in the spirit of Monkeytype, with a keyboard that actually answers back.",
    href: "https://github.com/SakutaTHZ/Shika-Typo.github.io",
    label: "View on GitHub",
    tags: ["Interaction", "CSS"],
  },
  {
    year: "2024",
    title: "THZ Components",
    text: "The pieces I kept rebuilding, pulled into one personal component library.",
    href: "https://github.com/SakutaTHZ/THZ-Components",
    label: "View on GitHub",
    tags: ["JavaScript", "UI"],
  },
  {
    year: "2023",
    title: "Reflexo",
    text: "A reflex game shaped like a Soul Fighter event. Fast, loud, and built to be replayed.",
    href: "https://github.com/SakutaTHZ/Reflexo.github.io",
    label: "View on GitHub",
    tags: ["Game", "CSS"],
  },
  {
    year: "2022",
    title: "Artify",
    text: "An art site, then a final version of it. Early proof that the interface was the point.",
    href: "https://github.com/SakutaTHZ/artify_final.github.io",
    label: "View on GitHub",
    tags: ["Web"],
  },
  {
    year: "Live",
    title: "Earlier portfolio",
    text: "The public site that came before this one. Still up, still mine.",
    href: "https://tharhtetzan.netlify.app",
    label: "Visit the site",
    tags: ["Portfolio"],
  },
];

export default function Projects() {
  return (
    <section id="projects" className="relative px-[7%] py-24 md:py-32">
      <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>Selected work</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-5xl leading-[0.92] tracking-[-0.04em] md:text-7xl">
            Things I actually shipped
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-[#a3a3a3]">
          Fifty-two public repositories since 2022. These are the ones that still feel like me: games, tools, and interfaces with a pulse.
        </p>
      </Reveal>

      <ol className="mt-16 border-b border-white/10">
        {work.map((item, index) => (
          <Reveal as="li" key={item.title} delay={index * 0.05} className="border-t border-white/10">
            <a
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              className="group grid gap-4 py-7 md:grid-cols-[4.5rem_7rem_1fr_auto] md:items-start md:gap-8 md:py-9"
            >
              <span className="font-obitron text-xs tracking-[0.18em] text-[#ffd84d]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-[#a3a3a3]">{item.year}</span>
              <span>
                <span className="block text-3xl tracking-[-0.04em] transition-colors duration-300 group-hover:text-[#ffd84d] md:text-5xl">
                  {item.title}
                </span>
                <span className="mt-3 block max-w-xl text-sm leading-relaxed text-[#a3a3a3]">
                  {item.text}
                </span>
                <span className="mt-4 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] tracking-[0.14em] text-white/70 uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-white/80 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#ffd84d]">
                {item.label}
                <ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </a>
          </Reveal>
        ))}
      </ol>

      <Reveal as="p" delay={0.08} className="mt-8 max-w-2xl text-sm leading-relaxed text-[#a3a3a3]">
        Also on the desk: a lyrics site in React and Tailwind, and a multiverse trading-card game with character rotations, spells, and weapons. The holo card in About is a cousin of that game.
      </Reveal>
    </section>
  );
}
