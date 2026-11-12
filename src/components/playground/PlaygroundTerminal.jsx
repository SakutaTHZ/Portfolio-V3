import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { prefersReducedMotion } from "@/hooks/hooks";
import { requestGatoJumpscare } from "@/components/GatoJumpscare";
import { execute, suggest } from "./shell";
import "@/components/portfolio-terminal.css";

export default function PlaygroundTerminal({ extras = [], onOpen, onExit, title = "playground" }) {
  const [cwd, setCwd] = useState("/");
  const [value, setValue] = useState("");
  const [entries, setEntries] = useState([]);
  const history = useRef([]);
  const historyIndex = useRef(0);
  const draft = useRef("");
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const suggestions = useMemo(() => suggest(value, cwd, extras), [value, cwd, extras]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [entries]);

  function close() {
    onExit?.();
  }

  function run(raw) {
    const command = raw.trim();
    if (!command) return;
    history.current = [...history.current, command].slice(-100);
    historyIndex.current = history.current.length;
    draft.current = "";
    setValue("");

    const result = execute(command, cwd, { extras, history: history.current });
    if (result.exit) return close();
    if (result.clear) {
      setEntries([]);
      setCwd(result.cwd);
      inputRef.current?.focus();
      return;
    }

    let answer = result.output;
    if (result.action === "jumpscare") {
      answer = prefersReducedMotion()
        ? "Jumpscares stay off while reduced motion is enabled."
        : requestGatoJumpscare()
          ? "boo."
          : "Gato already got you. Once is enough.";
    }
    if (result.item) onOpen?.(result.item);
    setCwd(result.cwd);
    setEntries((previous) => [...previous.slice(-79), { command, cwd, answer }]);
    inputRef.current?.focus();
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "Tab" && suggestions[0]) {
      event.preventDefault();
      setValue(suggestions[0]);
      return;
    }
    if (event.target !== inputRef.current || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    if (historyIndex.current === history.current.length) draft.current = value;
    historyIndex.current = Math.max(
      0,
      Math.min(history.current.length, historyIndex.current + (event.key === "ArrowUp" ? -1 : 1))
    );
    setValue(historyIndex.current === history.current.length ? draft.current : history.current[historyIndex.current] || "");
  }

  return (
    <div className="terminal-session" onKeyDown={onKeyDown}>
      <section className="terminal-panel" aria-labelledby="terminal-title">
        <h2 id="terminal-title" className="sr-only">
          {title}
        </h2>
        <div
          ref={outputRef}
          className="terminal-output"
          data-lenis-prevent
          tabIndex={0}
          role="log"
          aria-label="Terminal output"
          aria-live="polite"
          aria-relevant="additions"
        >
          <p className="terminal-welcome">
            SakutaOS playground shell. / is this playground folder, and you cannot leave it. Type /help, then try ls,
            find, or open memoBook.
          </p>
          {entries.map((entry, index) => (
            <div className="terminal-entry" key={`${entry.command}-${index}`}>
              <p className="terminal-command">
                <span aria-hidden="true">playground:{entry.cwd}$</span> {entry.command}
              </p>
              {entry.answer ? <p className="terminal-answer">{entry.answer}</p> : null}
            </div>
          ))}
        </div>
        <div className="terminal-suggestions" aria-label="Command suggestions">
          {suggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              onClick={() => {
                setValue(suggestion);
                inputRef.current?.focus();
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
        <form
          className="terminal-prompt"
          onSubmit={(event) => {
            event.preventDefault();
            run(value);
          }}
        >
          <span className="terminal-cwd" aria-hidden="true">
            playground:{cwd}$
          </span>
          <input
            ref={inputRef}
            aria-label="Type a command"
            aria-autocomplete="list"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="ls, find, open…"
            autoComplete="off"
            spellCheck={false}
            maxLength={500}
            enterKeyHint="send"
          />
          <button type="submit" className="terminal-icon-button" aria-label="Run command" disabled={!value.trim()}>
            <ArrowUpRight size={18} />
          </button>
        </form>
        <footer className="terminal-footer">
          <span>tab completes · ↑ ↓ history</span>
          <span>esc to close</span>
        </footer>
      </section>
    </div>
  );
}
