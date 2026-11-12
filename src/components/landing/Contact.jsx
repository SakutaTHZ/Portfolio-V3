import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Eyebrow from "./Eyebrow";
import Reveal from "./Reveal";

const EMAIL = "tharhtetzan@gmail.com";

const links = [
  { label: "Email", value: EMAIL, href: `mailto:${EMAIL}` },
  { label: "Studio mail", value: "thzarts@gmail.com", href: "mailto:thzarts@gmail.com" },
  { label: "GitHub", value: "github.com/SakutaTHZ", href: "https://github.com/SakutaTHZ" },
  {
    label: "LinkedIn",
    value: "Thar Htet Zan",
    href: "https://www.linkedin.com/in/thar-htet-zan-a15b39198",
  },
];

const ticker = [
  "Yangon",
  "Cosmo Japan",
  "Figma",
  "React",
  "Next.js",
  "NestJS",
  "Godot",
  "Mentoring",
  "Tactical games",
  "Family",
];

export default function Contact() {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section id="contact" className="relative flex min-h-[100dvh] flex-col justify-between overflow-hidden px-[7%] pt-24 pb-0">
      <Reveal>
        <Eyebrow>Contact</Eyebrow>
        <h2 className="mt-4 max-w-4xl text-5xl leading-[0.9] tracking-[-0.045em] md:text-8xl">
          Write to Yangon.
        </h2>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[#a3a3a3] md:text-lg">
          UI/UX at Cosmo Japan. Teaching at Brilliant Stars. Myanmar and English. If the product needs a feeling and a frontend, start here.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href={`mailto:${EMAIL}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#ffd84d] px-5 py-3 text-sm font-medium text-[#111111]"
          >
            {EMAIL}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={copyEmail}
            className="rounded-full border border-white/15 px-5 py-3 text-sm text-white"
          >
            {copied ? "Copied" : "Copy address"}
          </button>
        </div>
      </Reveal>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
          {links.map((link, index) => (
            <Reveal as="li" key={link.label} delay={0.08 + index * 0.06} className="bg-[#111111]/80">
              <a
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                className="group flex items-end justify-between gap-4 px-5 py-6"
              >
                <span>
                  <span className="block text-[11px] tracking-[0.18em] text-[#ffd84d] uppercase">{link.label}</span>
                  <span className="mt-2 block text-lg tracking-[-0.03em]">{link.value}</span>
                </span>
                <ArrowUpRight
                  size={18}
                  aria-hidden="true"
                  className="mb-1 text-white/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#ffd84d]"
                />
              </a>
            </Reveal>
          ))}
        </ul>

      <div className="mt-16 -mx-[7%] overflow-hidden border-t border-white/10 py-5" aria-hidden="true">
        <div className="landing-marquee">
          {[0, 1].map((copy) => (
            <p key={copy} className="flex shrink-0 gap-8 pr-8 font-obitron text-xs tracking-[0.28em] text-white/55 uppercase">
              {ticker.map((item) => (
                <span key={`${copy}-${item}`}>{item}</span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
