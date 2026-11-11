import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  CheckSquare,
  Download,
  Heading1,
  Heading2,
  Italic,
  List,
  Plus,
  Strikethrough,
  Trash2,
  Underline,
} from "lucide-react";
import "./memo-book.css";

export const playgroundMeta = {
  title: "memoBook",
  width: 920,
  height: 640,
};

const STORAGE_KEY = "sakutaos-memobook";

const INKS = [
  { name: "Ink", value: "#1d1914" },
  { name: "Coral", value: "#ff5b3e" },
  { name: "Amber", value: "#c98900" },
  { name: "Ocean", value: "#1f6feb" },
  { name: "Violet", value: "#7c5cbf" },
  { name: "Moss", value: "#2f7d57" },
  { name: "Rose", value: "#d4537e" },
];

const MARKS = [
  { name: "Lemon", value: "#ffe56a" },
  { name: "Mint", value: "#b6f0c5" },
  { name: "Peach", value: "#ffc4a8" },
  { name: "Lilac", value: "#d7c4ff" },
];

const PAPERS = ["ivory", "blush", "sage", "night"];

const STARTER_HTML = `<p>A quiet page in SakutaOS.</p>
<div class="memo-todo" data-todo><input type="checkbox"><span>Write the thing that is stuck in your head</span></div>
<div class="memo-todo" data-todo><input type="checkbox"><span>Color a sentence like ink, not like a settings panel</span></div>
<p>Select a word and tap an ink well. Check the boxes when they are done.</p>`;

function uid() {
  return `mb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function blankMemo() {
  return {
    id: uid(),
    title: "Untitled memo",
    html: "<p></p>",
    paper: "ivory",
    updatedAt: Date.now(),
  };
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "");
    if (raw?.memos?.length) return raw;
  } catch {
    /* empty */
  }
  const first = {
    id: uid(),
    title: "First page",
    html: STARTER_HTML,
    paper: "ivory",
    updatedAt: Date.now(),
  };
  return { memos: [first], activeId: first.id };
}

function htmlToText(root) {
  const chunks = [];
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      chunks.push(node.textContent);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.dataset?.todo !== undefined) {
      const checked = node.querySelector("input")?.checked;
      const text = (node.querySelector("span")?.innerText || node.innerText || "").trim();
      chunks.push(`${checked ? "- [x] " : "- [ ] "}${text}\n`);
      return;
    }
    if (node.tagName === "BR") {
      chunks.push("\n");
      return;
    }
    if (node.tagName === "LI") {
      chunks.push("- ");
      [...node.childNodes].forEach(walk);
      chunks.push("\n");
      return;
    }
    [...node.childNodes].forEach(walk);
    if (["P", "DIV", "H1", "H2", "H3"].includes(node.tagName)) chunks.push("\n");
  };
  walk(root);
  return chunks.join("").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function when(stamp) {
  const delta = Date.now() - stamp;
  if (delta < 15000) return "just now";
  if (delta < 60000) return `${Math.floor(delta / 1000)}s ago`;
  if (delta < 3600000) return `${Math.floor(delta / 60000)}m ago`;
  return new Date(stamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function MemoBook() {
  const editorRef = useRef(null);
  const skipHydrate = useRef(false);
  const [state, setState] = useState(loadState);
  const [savedAt, setSavedAt] = useState(Date.now());
  const [fresh, setFresh] = useState(false);

  const active = useMemo(
    () => state.memos.find((memo) => memo.id === state.activeId) || state.memos[0],
    [state]
  );

  const todos = useMemo(() => {
    const html = active?.html || "";
    const total = (html.match(/data-todo/g) || []).length;
    const done = (html.match(/checked/g) || []).length;
    return { total, done };
  }, [active]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSavedAt(Date.now());
    setFresh(true);
    const timer = window.setTimeout(() => setFresh(false), 1200);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !active) return;
    if (skipHydrate.current) {
      skipHydrate.current = false;
      return;
    }
    editor.innerHTML = active.html || "<p></p>";
  }, [active?.id]);

  const patchActive = useCallback((partial) => {
    setState((current) => ({
      ...current,
      memos: current.memos.map((memo) =>
        memo.id === current.activeId ? { ...memo, ...partial, updatedAt: Date.now() } : memo
      ),
    }));
  }, []);

  const persistEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    skipHydrate.current = true;
    patchActive({ html: editor.innerHTML });
  }, [patchActive]);

  const command = useCallback(
    (name, value) => {
      editorRef.current?.focus();
      document.execCommand("styleWithCSS", false, true);
      document.execCommand(name, false, value);
      persistEditor();
    },
    [persistEditor]
  );

  const addTodo = useCallback(() => {
    editorRef.current?.focus();
    document.execCommand(
      "insertHTML",
      false,
      `<div class="memo-todo" data-todo><input type="checkbox"><span>New to-do</span></div><p></p>`
    );
    persistEditor();
  }, [persistEditor]);

  const createMemo = useCallback(() => {
    const memo = blankMemo();
    setState((current) => ({ memos: [memo, ...current.memos], activeId: memo.id }));
  }, []);

  const removeMemo = useCallback(() => {
    setState((current) => {
      const memos = current.memos.filter((memo) => memo.id !== current.activeId);
      if (!memos.length) {
        const freshMemo = blankMemo();
        return { memos: [freshMemo], activeId: freshMemo.id };
      }
      return { memos, activeId: memos[0].id };
    });
  }, []);

  const downloadTxt = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !active) return;
    const text = `${active.title}\n${"=".repeat(Math.min(active.title.length, 40))}\n\n${htmlToText(editor)}\n`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${active.title.replace(/[^\w\d]+/g, "-").replace(/^-|-$/g, "") || "memo"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [active]);

  return (
    <div className="memo-book">
      <aside className="memo-rail">
        <div className="memo-rail-head">
          <div>
            <span>Notebook</span>
            <p>memoBook</p>
          </div>
          <button type="button" className="memo-icon-btn" onClick={createMemo} aria-label="New memo">
            <Plus size={14} />
          </button>
        </div>
        <div className="memo-list">
          {state.memos.map((memo) => (
            <button
              key={memo.id}
              type="button"
              className="memo-card"
              data-active={memo.id === active?.id || undefined}
              onClick={() => setState((current) => ({ ...current, activeId: memo.id }))}
            >
              <strong>{memo.title || "Untitled memo"}</strong>
              <em>{when(memo.updatedAt)}</em>
            </button>
          ))}
        </div>
      </aside>

      <section className="memo-stage">
        <div className="memo-toolbar" onMouseDown={(event) => event.preventDefault()}>
          <button type="button" className="memo-tool" aria-label="Heading" onClick={() => command("formatBlock", "h1")}>
            <Heading1 size={14} />
          </button>
          <button type="button" className="memo-tool" aria-label="Subheading" onClick={() => command("formatBlock", "h2")}>
            <Heading2 size={14} />
          </button>
          <span className="memo-sep" />
          <button type="button" className="memo-tool" aria-label="Bold" onClick={() => command("bold")}>
            <Bold size={14} />
          </button>
          <button type="button" className="memo-tool" aria-label="Italic" onClick={() => command("italic")}>
            <Italic size={14} />
          </button>
          <button type="button" className="memo-tool" aria-label="Underline" onClick={() => command("underline")}>
            <Underline size={14} />
          </button>
          <button type="button" className="memo-tool" aria-label="Strikethrough" onClick={() => command("strikeThrough")}>
            <Strikethrough size={14} />
          </button>
          <button type="button" className="memo-tool" aria-label="List" onClick={() => command("insertUnorderedList")}>
            <List size={14} />
          </button>
          <button type="button" className="memo-tool" aria-label="To-do" onClick={addTodo}>
            <CheckSquare size={14} />
          </button>
          <span className="memo-sep" />
          <div className="memo-inks" aria-label="Ink colors">
            {INKS.map((ink) => (
              <button
                key={ink.value}
                type="button"
                className="memo-ink"
                style={{ background: ink.value }}
                aria-label={`${ink.name} ink`}
                onClick={() => command("foreColor", ink.value)}
              />
            ))}
          </div>
          <div className="memo-marks" aria-label="Highlighters">
            {MARKS.map((mark) => (
              <button
                key={mark.value}
                type="button"
                className="memo-mark"
                style={{ background: mark.value }}
                aria-label={`${mark.name} highlight`}
                onClick={() => command("hiliteColor", mark.value)}
              />
            ))}
          </div>
          <div className="memo-toolbar-end">
            <button
              type="button"
              className="memo-tool"
              aria-label="Change paper"
              onClick={() => {
                const index = PAPERS.indexOf(active?.paper || "ivory");
                patchActive({ paper: PAPERS[(index + 1) % PAPERS.length] });
              }}
            >
              Aa
            </button>
            <button type="button" className="memo-tool" aria-label="Download memo" onClick={downloadTxt}>
              <Download size={14} />
            </button>
            <button type="button" className="memo-tool" aria-label="Delete memo" onClick={removeMemo}>
              <Trash2 size={14} />
            </button>
            <span className="memo-save-pill" data-fresh={fresh || undefined}>
              {fresh ? "Saved" : when(savedAt)}
            </span>
          </div>
        </div>

        <div className="memo-sheet-wrap">
          <div className="memo-sheet" data-paper={active?.paper || "ivory"}>
            <input
              className="memo-title"
              value={active?.title || ""}
              onChange={(event) => patchActive({ title: event.target.value })}
              placeholder="Title this memo"
            />
            <div
              ref={editorRef}
              className="memo-editor"
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="Memo body"
              onInput={persistEditor}
              onBlur={persistEditor}
              onClick={(event) => {
                if (event.target instanceof HTMLInputElement && event.target.type === "checkbox") {
                  const todo = event.target.closest("[data-todo]");
                  if (todo) {
                    event.target.toggleAttribute("checked", event.target.checked);
                    todo.dataset.done = event.target.checked ? "true" : "false";
                    persistEditor();
                  }
                }
              }}
            />
            {todos.total > 0 && todos.done === todos.total && <span className="memo-stamp">All done</span>}
          </div>
        </div>
      </section>
    </div>
  );
}
