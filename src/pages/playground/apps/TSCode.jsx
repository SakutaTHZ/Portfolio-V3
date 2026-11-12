import { useEffect, useRef, useState } from "react";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { redo, redoDepth, selectAll, undo, undoDepth } from "@codemirror/commands";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "./css/tscode.css";

export const playgroundMeta = {
  title: "TSCode",
  width: 980,
  height: 680,
};

const STORAGE_KEY = "sakuta-tscode";
const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

const STARTER = {
  html: `<main>
  <h1>Hello from TSCode</h1>
  <button id="greet">Click me</button>
  <p id="out"></p>
</main>
`,
  css: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f3f3f3;
  color: #1a1a1a;
  font-family: "Segoe UI", sans-serif;
}

button {
  border: 0;
  border-radius: 4px;
  padding: 8px 14px;
  background: #0067c0;
  color: white;
  font: inherit;
  cursor: pointer;
}

#out {
  min-height: 1.4em;
  text-align: center;
}
`,
  js: `document.getElementById("greet").addEventListener("click", () => {
  document.getElementById("out").textContent = "Saved in the preview.";
});
`,
  react: `function App() {
  const [count, setCount] = React.useState(0);

  return (
    <button onClick={() => setCount((value) => value + 1)}>
      Count {count}
    </button>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
`,
  python: `name = "TSCode"

for step in range(1, 4):
    print(f"{name} says {step}")
`,
};

const FILES = {
  html: { name: "index.html", label: "HTML" },
  css: { name: "style.css", label: "CSS" },
  js: { name: "script.js", label: "JavaScript" },
  react: { name: "App.jsx", label: "React" },
  python: { name: "main.py", label: "Python" },
};

const MODES = [
  { id: "web", label: "HTML, CSS & JS" },
  { id: "react", label: "React" },
  { id: "python", label: "Python" },
];

const WEB_TABS = ["html", "css", "js"];

function languageExtension(fileId) {
  if (fileId === "html") return html();
  if (fileId === "css") return css();
  if (fileId === "python") return python();
  if (fileId === "react") return javascript({ jsx: true });
  return javascript();
}

function escapeClose(value, tag) {
  return value.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`);
}

function webDocument(files) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${escapeClose(files.css, "style")}
</style>
</head>
<body>
${files.html}
<script>
${escapeClose(files.js, "script")}
</script>
</body>
</html>`;
}

function reactDocument(code) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html, body, #root { margin: 0; min-height: 100%; }
  body { display: grid; place-items: center; font-family: "Segoe UI", sans-serif; background: #f3f3f3; }
  button { border: 0; border-radius: 4px; padding: 8px 14px; background: #0067c0; color: white; font: inherit; cursor: pointer; }
</style>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone@7.26.9/babel.min.js"></script>
</head>
<body>
<div id="root"></div>
<script type="text/babel" data-presets="react">
${escapeClose(code, "script")}
</script>
</body>
</html>`;
}

const PYTHON_RUNNER = `<!DOCTYPE html>
<html>
<body>
<script src="${PYODIDE}pyodide.js"></script>
<script>
  let engine = null;
  function say(type, text) {
    parent.postMessage({ source: "tscode-python", type, text }, "*");
  }
  async function boot() {
    if (!engine) {
      say("status", "Loading Python…");
      engine = await loadPyodide({ indexURL: "${PYODIDE}" });
    }
    return engine;
  }
  window.addEventListener("message", async (event) => {
    if (event.data?.source !== "tscode" || event.data.type !== "run") return;
    try {
      const pyodide = await boot();
      pyodide.setStdout({ batched: (text) => say("stdout", text) });
      pyodide.setStderr({ batched: (text) => say("stderr", text) });
      say("status", "Running…");
      await pyodide.runPythonAsync(event.data.code || "");
      say("status", "Done");
    } catch (error) {
      say("stderr", String(error));
      say("status", "Failed");
    }
  });
  say("ready", "Ready");
</script>
</body>
</html>`;

function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved?.files?.html || !saved.files.css || !saved.files.js) return null;
    return {
      files: { ...STARTER, ...saved.files },
      mode: MODES.some((mode) => mode.id === saved.mode) ? saved.mode : "web",
      webTab: WEB_TABS.includes(saved.webTab) ? saved.webTab : "html",
    };
  } catch {
    return null;
  }
}

function download(filename, content, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function CodeEditor({ fileId, docsRef, wrap, externalToken, onChange, onStatus, apiRef, commandsRef }) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const statesRef = useRef(new Map());
  const fileIdRef = useRef(fileId);
  const onChangeRef = useRef(onChange);
  const onStatusRef = useRef(onStatus);
  onChangeRef.current = onChange;
  onStatusRef.current = onStatus;

  function report(view) {
    const head = view.state.selection.main.head;
    const line = view.state.doc.lineAt(head);
    onStatusRef.current({
      line: line.number,
      column: head - line.from + 1,
      canUndo: undoDepth(view.state) > 0,
      canRedo: redoDepth(view.state) > 0,
    });
  }

  function makeState(id, doc) {
    return EditorState.create({
      doc,
      extensions: [
        basicSetup,
        languageExtension(id),
        wrap ? EditorView.lineWrapping : [],
        oneDark,
        EditorView.theme({
          "&": { height: "100%", fontSize: "13px" },
          ".cm-scroller": { fontFamily: 'Consolas, "Cascadia Code", ui-monospace, monospace' },
        }),
        keymap.of([
          {
            key: "Mod-s",
            run: () => {
              commandsRef.current.save?.();
              return true;
            },
          },
          {
            key: "Mod-Enter",
            run: () => {
              commandsRef.current.run?.();
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(fileIdRef.current, update.state.doc.toString());
          statesRef.current.set(fileIdRef.current, update.state);
          report(update.view);
        }),
      ],
    });
  }

  useEffect(() => {
    const view = new EditorView({ parent: hostRef.current });
    viewRef.current = view;
    apiRef.current = {
      undo: () => undo(view),
      redo: () => redo(view),
      selectAll: () => {
        selectAll(view);
        view.focus();
      },
      cut: async () => editClipboard(view, "cut"),
      copy: async () => editClipboard(view, "copy"),
      paste: async () => editClipboard(view, "paste"),
      measure: () => view.requestMeasure(),
      focus: () => view.focus(),
    };

    return () => {
      view.destroy();
      viewRef.current = null;
      statesRef.current.clear();
    };
  }, [apiRef, commandsRef]);

  const seenToken = useRef(0);
  const wrapRef = useRef(wrap);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (wrapRef.current !== wrap) {
      wrapRef.current = wrap;
      statesRef.current.clear();
    }
    if (externalToken && seenToken.current !== externalToken.token) {
      seenToken.current = externalToken.token;
      externalToken.ids.forEach((id) => statesRef.current.delete(id));
    }
    let next = statesRef.current.get(fileId);
    if (!next) next = makeState(fileId, docsRef.current[fileId] ?? "");
    fileIdRef.current = fileId;
    statesRef.current.set(fileId, next);
    if (view.state !== next) view.setState(next);
    report(view);
    view.requestMeasure();
  }, [fileId, externalToken, wrap]);

  return <div ref={hostRef} className="ts-editor" />;
}

async function editClipboard(view, action) {
  const selection = view.state.selection.main;
  const text = view.state.sliceDoc(selection.from, selection.to);
  try {
    if (action === "copy" || action === "cut") {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      if (action === "cut") view.dispatch(view.state.replaceSelection(""));
    } else {
      const pasted = await navigator.clipboard.readText();
      view.dispatch(view.state.replaceSelection(pasted));
    }
    view.focus();
  } catch {
    view.focus();
  }
}

function PythonOutput({ runToken, codeRef }) {
  const frameRef = useRef(null);
  const pendingRef = useRef(null);
  const [lines, setLines] = useState([{ kind: "status", text: "Press Run to execute main.py." }]);

  function postRun(code) {
    frameRef.current?.contentWindow?.postMessage({ source: "tscode", type: "run", code }, "*");
  }

  useEffect(() => {
    function onMessage(event) {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || data.source !== "tscode-python") return;
      if (data.type === "ready") {
        if (pendingRef.current != null) postRun(pendingRef.current);
        return;
      }
      setLines((current) => {
        if (data.type === "status" && data.text === "Running…") return [{ kind: "status", text: data.text }];
        return [...current, { kind: data.type === "stderr" ? "err" : data.type === "stdout" ? "out" : "status", text: data.text }];
      });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!runToken) return;
    pendingRef.current = codeRef.current;
    postRun(codeRef.current);
  }, [runToken, codeRef]);

  return (
    <div className="ts-console">
      <iframe ref={frameRef} className="ts-runtime" title="Python runtime" srcDoc={PYTHON_RUNNER} sandbox="allow-scripts" />
      <pre>
        {lines.map((line, index) => (
          <div key={`${line.kind}-${index}`} className={line.kind === "err" ? "is-err" : line.kind === "status" ? "is-status" : undefined}>
            {line.text}
          </div>
        ))}
      </pre>
    </div>
  );
}

export default function TSCode() {
  const draft = useRef(loadDraft());
  const [files, setFiles] = useState(() => draft.current?.files || STARTER);
  const [mode, setMode] = useState(() => draft.current?.mode || "web");
  const [webTab, setWebTab] = useState(() => draft.current?.webTab || "html");
  const [wrap, setWrap] = useState(true);
  const [layout, setLayout] = useState("split");
  const [pane, setPane] = useState("code");
  const [compact, setCompact] = useState(false);
  const [status, setStatus] = useState({ line: 1, column: 1, canUndo: false, canRedo: false });
  const [note, setNote] = useState("");
  const [external, setExternal] = useState(null);
  const [preview, setPreview] = useState(() => webDocument(draft.current?.files || STARTER));
  const [refresh, setRefresh] = useState(0);
  const [runToken, setRunToken] = useState(0);
  const rootRef = useRef(null);
  const docsRef = useRef(files);
  const apiRef = useRef(null);
  const commandsRef = useRef({});
  const codeRef = useRef(files.python);
  const fileRef = useRef(null);
  docsRef.current = files;
  const fileId = mode === "web" ? webTab : mode;
  codeRef.current = files[fileId];

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 720));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ files, mode, webTab }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [files, mode, webTab]);

  useEffect(() => {
    if (mode === "python") return undefined;
    const timer = window.setTimeout(() => {
      setPreview(mode === "react" ? reactDocument(files.react) : webDocument(files));
    }, 260);
    return () => window.clearTimeout(timer);
  }, [files, mode]);

  useEffect(() => {
    apiRef.current?.measure();
  }, [compact, pane, layout, fileId]);

  function changeFile(id, text) {
    setFiles((current) => (current[id] === text ? current : { ...current, [id]: text }));
  }

  function replaceFiles(entries) {
    setFiles((current) => ({ ...current, ...entries }));
    setExternal({ ids: Object.keys(entries), token: Date.now() });
  }

  function saveActive() {
    const meta = FILES[fileId];
    download(meta.name, files[fileId]);
    setNote(`Saved ${meta.name}`);
  }

  function exportPreview() {
    if (mode === "python") return;
    const html = mode === "react" ? reactDocument(files.react) : webDocument(files);
    download(mode === "react" ? "app.html" : "index.html", html, "text/html");
    setNote("Exported preview");
  }

  function run() {
    if (mode === "python") {
      codeRef.current = files.python;
      setRunToken((value) => value + 1);
      if (compact) setPane("preview");
      return;
    }
    setPreview(mode === "react" ? reactDocument(files.react) : webDocument(files));
    setRefresh((value) => value + 1);
    if (compact) setPane("preview");
  }

  commandsRef.current = { save: saveActive, run };

  function resetMode() {
    const currentIds = mode === "web" ? WEB_TABS : [mode];
    const dirty = currentIds.some((id) => files[id] !== STARTER[id]);
    if (dirty && !window.confirm("Replace the current files with the starter?")) return;
    replaceFiles(Object.fromEntries(currentIds.map((id) => [id, STARTER[id]])));
    setNote("New file");
  }

  function onOpenFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const ext = file.name.split(".").pop().toLowerCase();
      if (ext === "css") {
        setMode("web");
        setWebTab("css");
        replaceFiles({ css: text });
      } else if (ext === "py") {
        setMode("python");
        replaceFiles({ python: text });
      } else if (ext === "jsx" || ext === "tsx") {
        setMode("react");
        replaceFiles({ react: text });
      } else if (ext === "js" || ext === "mjs") {
        setMode("web");
        setWebTab("js");
        replaceFiles({ js: text });
      } else {
        setMode("web");
        setWebTab("html");
        replaceFiles({ html: text });
      }
      setNote(`Opened ${file.name}`);
    };
    reader.readAsText(file);
  }

  function chooseLayout(next) {
    setLayout(next);
    setPane(next === "preview" ? "preview" : "code");
  }

  const modeLabel = MODES.find((item) => item.id === mode)?.label;
  const editor = (
    <CodeEditor
      fileId={fileId}
      docsRef={docsRef}
      wrap={wrap}
      externalToken={external}
      onChange={changeFile}
      onStatus={setStatus}
      apiRef={apiRef}
      commandsRef={commandsRef}
    />
  );

  const fileTabs = mode === "web" && (
    <div className="ts-filetabs" role="tablist" aria-label="Files">
      {WEB_TABS.map((id) => (
        <button
          key={id}
          type="button"
          className="ts-filetab"
          role="tab"
          aria-selected={webTab === id}
          data-active={webTab === id || undefined}
          onClick={() => setWebTab(id)}
        >
          {files[id] !== STARTER[id] && <i aria-hidden="true" />}
          {FILES[id].label}
        </button>
      ))}
    </div>
  );

  const codePane = (
    <div className="ts-codepane">
      {fileTabs}
      {editor}
    </div>
  );

  const previewPane = (
    <div className="ts-previewpane">
      <div className="ts-preview-bar">
        <span>{mode === "python" ? "Output" : "Preview"}</span>
        <button type="button" className="ts-run" onClick={run}>
          {mode === "python" ? "Run" : "Refresh"}
        </button>
      </div>
      {mode === "python" ? (
        <PythonOutput runToken={runToken} codeRef={codeRef} />
      ) : (
        <iframe
          key={`${mode}-${refresh}`}
          className="ts-frame"
          title="Preview"
          sandbox="allow-scripts"
          srcDoc={preview}
        />
      )}
    </div>
  );

  return (
    <div ref={rootRef} className="tscode">
      <Menubar className="ts-menu">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onSelect={resetMode}>
              New <MenubarShortcut>starter</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={() => fileRef.current?.click()}>Open…</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={saveActive}>
              Save <MenubarShortcut>Ctrl+S</MenubarShortcut>
            </MenubarItem>
            <MenubarItem disabled={mode === "python"} onSelect={exportPreview}>
              Export preview
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled={!status.canUndo} onSelect={() => apiRef.current?.undo()}>
              Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem disabled={!status.canRedo} onSelect={() => apiRef.current?.redo()}>
              Redo <MenubarShortcut>Ctrl+Y</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={() => apiRef.current?.cut()}>Cut</MenubarItem>
            <MenubarItem onSelect={() => apiRef.current?.copy()}>Copy</MenubarItem>
            <MenubarItem onSelect={() => apiRef.current?.paste()}>Paste</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={() => apiRef.current?.selectAll()}>
              Select all <MenubarShortcut>Ctrl+A</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup value={compact ? pane : layout} onValueChange={chooseLayout}>
              <MenubarRadioItem value="code">Editor</MenubarRadioItem>
              <MenubarRadioItem value="preview">Preview</MenubarRadioItem>
              <MenubarRadioItem value="split" disabled={compact}>
                Split
              </MenubarRadioItem>
            </MenubarRadioGroup>
            <MenubarSeparator />
            <MenubarCheckboxItem checked={wrap} onCheckedChange={(value) => setWrap(value === true)}>
              Word wrap
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="ts-mode">{modeLabel}</MenubarTrigger>
          <MenubarContent align="end">
            <MenubarRadioGroup value={mode} onValueChange={setMode}>
              {MODES.map((item) => (
                <MenubarRadioItem key={item.id} value={item.id}>
                  {item.label}
                </MenubarRadioItem>
              ))}
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {compact ? (
        <Tabs value={pane === "preview" ? "preview" : "code"} onValueChange={setPane} className="ts-mobile">
          <TabsList>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="code">{codePane}</TabsContent>
          <TabsContent value="preview">{previewPane}</TabsContent>
        </Tabs>
      ) : (
        <div className="ts-stage" data-layout={layout}>
          {codePane}
          {previewPane}
        </div>
      )}

      <footer className="ts-status">
        <span>
          Ln {status.line}, Col {status.column}
        </span>
        <span>{note || (wrap ? "Word wrap" : "No wrap")}</span>
        <span>{FILES[fileId].name}</span>
      </footer>
      <input
        ref={fileRef}
        type="file"
        hidden
        accept=".html,.css,.js,.jsx,.tsx,.py,.txt,.mjs"
        onChange={onOpenFile}
      />
    </div>
  );
}
