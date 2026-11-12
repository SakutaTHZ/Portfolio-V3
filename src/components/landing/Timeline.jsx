import Eyebrow from "./Eyebrow";
import Reveal from "./Reveal";

const chapters = [
  {
    year: "2016",
    title: "Computer Science",
    place: "Yangon University",
    text: "Four years of computer science, and the year coding stopped being a subject and became the thing I stayed with.",
  },
  {
    year: "2016",
    title: "Programmer, out loud",
    place: "Ten languages and counting",
    text: "A programmer since 2016. Java, PHP, C#, Spring Boot, then the web stack that took over the desk.",
  },
  {
    year: "Earlier",
    title: "Supervisor",
    place: "ACE Inspiration",
    text: "Supervised project teams building Java web applications. The first time the work was other people’s, not only mine.",
  },
  {
    year: "Earlier",
    title: "Developer",
    place: "MYEO",
    text: "Shipped product as a developer before the design title caught up with the way I already worked.",
  },
  {
    year: "2022",
    title: "Teacher",
    place: "Brilliant Stars International, Yangon",
    text: "Teaching since December 2022. Mentoring on this site is the same practice: make the hard part understandable.",
  },
  {
    year: "2023",
    title: "Junior programmer",
    place: "DAT, Daiwa Institute of Research Group",
    text: "April 2023 to March 2024. Engineering inside a research-group company, still in Myanmar.",
  },
  {
    year: "2024",
    title: "UI/UX designer",
    place: "Cosmo Japan",
    text: "March 2024 to now. A system revamp: decide how the product should feel, then build the interface that holds it.",
  },
];

export default function Timeline() {
  return (
    <section id="timeline" className="relative px-[7%] py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-20">
        <Reveal className="md:sticky md:top-24 md:self-start">
          <Eyebrow>Timeline</Eyebrow>
          <h2 className="mt-4 text-5xl leading-[0.92] tracking-[-0.04em] md:text-7xl">
            From Yangon University to Cosmo Japan
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-[#a3a3a3]">
            A decade of code, a classroom in Yangon, and a design desk that still starts in Figma and ends in React.
          </p>
          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            <div>
              <dt className="text-[11px] tracking-[0.18em] text-[#a3a3a3] uppercase">Since</dt>
              <dd className="mt-2 font-obitron text-2xl text-[#ffd84d]">2016</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.18em] text-[#a3a3a3] uppercase">Now</dt>
              <dd className="mt-2 font-obitron text-2xl">UI/UX</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.18em] text-[#a3a3a3] uppercase">Base</dt>
              <dd className="mt-2 font-obitron text-2xl">YGN</dd>
            </div>
          </dl>
        </Reveal>

        <ol className="relative border-l border-[#ffd84d]/40 pl-8">
          {chapters.map((chapter, index) => (
            <Reveal as="li" key={`${chapter.year}-${chapter.title}`} delay={index * 0.04} className="relative pb-12 last:pb-0">
              <span
                aria-hidden="true"
                className="absolute top-1.5 -left-[2.4rem] size-2.5 rounded-full bg-[#ffd84d] shadow-[0_0_0_6px_rgba(17,17,17,0.85)]"
              />
              <p className="font-obitron text-xs tracking-[0.2em] text-[#ffd84d]">{chapter.year}</p>
              <h3 className="mt-2 text-3xl tracking-[-0.03em] md:text-4xl">{chapter.title}</h3>
              <p className="mt-1 text-sm text-white/80">{chapter.place}</p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#a3a3a3]">{chapter.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
