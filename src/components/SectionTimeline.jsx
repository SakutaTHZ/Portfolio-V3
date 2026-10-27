import { useEffect, useState } from "react";
import { scrollToId } from "../hooks/hooks";

const SECTIONS = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "testimonials", label: "Testimonials" },
  { id: "projects", label: "Projects" },
  { id: "timeline", label: "Timeline" },
  { id: "contact", label: "Contact" },
];

export default function SectionTimeline() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const nodes = SECTIONS.map((section) => document.getElementById(section.id)).filter(Boolean);

    const update = () => {
      const line = window.innerHeight * 0.4;
      let current = nodes[0]?.id ?? SECTIONS[0].id;
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= line) current = node.id;
      }
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <nav aria-label="Section timeline" className="section-timeline">
      <ol>
        {SECTIONS.map((section) => {
          const selected = active === section.id;
          return (
            <li key={section.id}>
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                aria-label={section.label}
                onClick={(event) => scrollToId(event, `#${section.id}`)}
              >
                <span className="section-timeline__label">{section.label}</span>
                <span className="section-timeline__mark" data-active={selected ? "" : undefined} />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
