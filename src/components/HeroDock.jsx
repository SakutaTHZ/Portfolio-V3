import { forwardRef } from "react";
import { FolderKanban, History, Layers, Mail, Quote, Send, UserRound } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { scrollToId } from "../hooks/hooks";

function GithubIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12.02c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.48.11-3.08 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.6.24 2.78.12 3.08.75.81 1.2 1.84 1.2 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}

function LinkedinIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5h4V24h-4V8.5zM8.5 8.5h3.84v2.12h.05c.53-1.01 1.84-2.08 3.79-2.08 4.05 0 4.8 2.67 4.8 6.14V24h-4v-7.71c0-1.84-.03-4.2-2.56-4.2-2.56 0-2.95 2-2.95 4.06V24h-3.97V8.5z" />
    </svg>
  );
}

const sections = [
  { id: "about", title: "About", icon: UserRound },
  { id: "services", title: "Services", icon: Layers },
  { id: "projects", title: "Projects", icon: FolderKanban },
  { id: "timeline", title: "Timeline", icon: History },
  { id: "testimonials", title: "Testimonials", icon: Quote },
  { id: "contact", title: "Contact", icon: Send },
];

const socials = [
  { title: "GitHub", href: "https://github.com/SakutaTHZ", icon: GithubIcon },
  { title: "Mail", href: "mailto:tharhtetzan@gmail.com", icon: Mail },
  { title: "LinkedIn", href: "https://www.linkedin.com", icon: LinkedinIcon },
];

function DockButton({ icon: Icon, title, href, external, onClick }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          className="hero-dock-btn"
          href={href}
          onClick={onClick}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
        >
          <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">{title}</span>
        </a>
      </TooltipTrigger>
      <TooltipContent side="top">{title}</TooltipContent>
    </Tooltip>
  );
}

const HeroDock = forwardRef(function HeroDock(_, ref) {
  return (
    <TooltipProvider delayDuration={200}>
    <nav ref={ref} className="hero-dock" aria-label="Sections and socials">
      {sections.map((item) => (
        <DockButton
          key={item.id}
          icon={item.icon}
          title={item.title}
          href={`#${item.id}`}
          onClick={(event) => scrollToId(event, `#${item.id}`)}
        />
      ))}
      <div className="hero-dock-cluster">
        {socials.map((item) => (
          <DockButton key={item.title} icon={item.icon} title={item.title} href={item.href} external={item.href.startsWith("http")} />
        ))}
      </div>
    </nav>
    </TooltipProvider>
  );
});

export default HeroDock;
