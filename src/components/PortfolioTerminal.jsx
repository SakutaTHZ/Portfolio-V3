import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Minus, Terminal } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "../hooks/hooks";
import "./portfolio-terminal.css";

gsap.registerPlugin(useGSAP);

const welcome = "Welcome to my little corner of the command line. Try a command below, or ask me about this portfolio.";
const commands = {
  help: "Available commands:\nabout — meet Thar Htet Zan\nskills — explore the toolkit\nprojects — portfolio updates\ncontact — contact information\nclear — start fresh\nexit — close the terminal\n\nYou can also ask: Who are you? What do you build?",
  about: "I'm Thar Htet Zan, a web developer who enjoys building dynamic, user-friendly websites and applications, coding, and learning new technologies.",
  skills: "This portfolio is built with React, JavaScript, Tailwind CSS, Vite, and GSAP, with WebGL-powered visual effects.",
  projects: "You're exploring one right now: this interactive portfolio. More project details haven't been added yet.",
  contact: "Contact details haven't been added to this portfolio yet. Please check back for an email address or personal social links.",
};

function answerQuestion(value) {
  const query = value.toLowerCase().trim().replace(/[?!.,]+$/g, "");
  if (commands[query]) return commands[query];
  if (/\b(who|about|name|yourself)\b/.test(query)) return commands.about;
  if (/\b(skills?|stack|technolog\w*|tools?|frameworks?|built with)\b/.test(query)) return commands.skills;
  if (/\b(contact|email|hire|reach|socials?)\b/.test(query)) return commands.contact;
  if (/\b(projects?|work|build|portfolio)\b/.test(query)) return commands.projects;
  if (/^(hi|hey|hello)\b/.test(query)) return "Hello! I'm the portfolio guide. Ask about Thar, the toolkit, or this portfolio. Type help to see every command.";
  return "I don't have an answer for that yet. I can help with this portfolio, its creator, and its toolkit. Type help for available commands.";
}

export default function PortfolioTerminal() {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [value, setValue] = useState("");
  const [entries, setEntries] = useState([]);
  const history = useRef([]);
  const historyIndex = useRef(0);
  const draft = useRef("");
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const outputRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open || prefersReducedMotion()) return;
    let alive = true;
    let waitTimer;
    let peekTimer;
    const schedule = () => {
      const delay = 10000 + Math.random() * 10000;
      waitTimer = window.setTimeout(() => {
        if (!alive) return;
        setNudge(true);
        peekTimer = window.setTimeout(() => {
          if (!alive) return;
          setNudge(false);
          schedule();
        }, 1600);
      }, delay);
    };
    schedule();
    return () => {
      alive = false;
      setNudge(false);
      window.clearTimeout(waitTimer);
      window.clearTimeout(peekTimer);
    };
  }, [open]);

  useEffect(() => {
    if (open && outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [entries, open]);

  useGSAP(() => {
    const panel = panelRef.current;
    if (!open || !panel || prefersReducedMotion()) return;
    gsap.fromTo(
      panel,
      { autoAlpha: 0, y: 28, scale: 0.9, transformOrigin: "100% 100%" },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.62, ease: "back.out(1.5)" }
    );
  }, { dependencies: [open] });

  function close() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  function run(raw) {
    const command = raw.trim();
    if (!command) return;
    history.current = [...history.current, command].slice(-100);
    historyIndex.current = history.current.length;
    draft.current = "";
    setValue("");
    if (/^(exit|close)$/i.test(command)) return close();
    if (/^(clear|cls)$/i.test(command)) setEntries([]);
    else setEntries((previous) => [...previous.slice(-49), { command, answer: answerQuestion(command) }]);
    inputRef.current?.focus();
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
    if (event.target !== inputRef.current || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    if (historyIndex.current === history.current.length) draft.current = value;
    historyIndex.current = Math.max(0, Math.min(history.current.length, historyIndex.current + (event.key === "ArrowUp" ? -1 : 1)));
    setValue(historyIndex.current === history.current.length ? draft.current : history.current[historyIndex.current] || "");
  }

  return (
    <div className={`portfolio-terminal${open ? " is-open" : ""}`} onKeyDown={onKeyDown}>
      {open && (
        <section ref={panelRef} id="portfolio-terminal-panel" className="terminal-panel" aria-labelledby="terminal-title">
          <header className="terminal-header">
            <span className="terminal-status" aria-hidden="true" />
            <h2 id="terminal-title">thar / terminal</h2>
            <span className="terminal-header-note">PORTFOLIO GUIDE</span>
            <button type="button" className="terminal-icon-button" onClick={close} aria-label="Minimize terminal"><Minus size={18} /></button>
          </header>
          <div ref={outputRef} className="terminal-output" data-lenis-prevent tabIndex={0} role="log" aria-label="Terminal conversation" aria-live="polite" aria-relevant="additions">
            <p className="terminal-welcome">{welcome}</p>
            {entries.map((entry, index) => (
              <div className="terminal-entry" key={index}>
                <p className="terminal-command"><span aria-hidden="true">❯</span> {entry.command}</p>
                <p className="terminal-answer">{entry.answer}</p>
              </div>
            ))}
          </div>
          <div className="terminal-suggestions" aria-label="Suggested commands">
            {["help", "about", "skills", "projects", "contact"].map((command) => <button type="button" key={command} onClick={() => run(command)}>{command}</button>)}
          </div>
          <form className="terminal-prompt" onSubmit={(event) => { event.preventDefault(); run(value); }}>
            <span aria-hidden="true">❯</span>
            <input ref={inputRef} aria-label="Type a command or question" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Type a command or ask a question…" autoComplete="off" spellCheck={false} maxLength={500} enterKeyHint="send" />
            <button type="submit" className="terminal-icon-button" aria-label="Run command" disabled={!value.trim()}><ArrowUpRight size={18} /></button>
          </form>
          <footer className="terminal-footer"><span>↑ ↓ history</span><span>esc to minimize</span></footer>
        </section>
      )}
      <button ref={launcherRef} type="button" className={`terminal-launcher${open ? " is-open" : ""}${nudge && !open ? " is-nudging" : ""}`} aria-expanded={open} aria-controls="portfolio-terminal-panel" onClick={() => open ? close() : setOpen(true)}>
        <Terminal size={18} aria-hidden="true" /><span>cmd</span><span className="terminal-launcher-hint">{open ? "close" : "ask me anything"}</span>
      </button>
    </div>
  );
}
