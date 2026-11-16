import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus, RotateCw, X } from "lucide-react";
import "./css/bleed.css";

export const playgroundMeta = {
  title: "Bleed",
  width: 1040,
  height: 700,
};

const MARKS = [
  {
    name: "Portfolio",
    host: "this site",
    url: "/",
    note: "The desk you are already standing in.",
  },
  {
    name: "Earlier portfolio",
    host: "netlify",
    url: "https://tharhtetzan.netlify.app/",
    note: "The public site before this one. Still up.",
  },
  {
    name: "First page",
    host: "github",
    url: "https://sakutathz.github.io/TharHtetZan.github.io/",
    note: "The page that just says the name.",
  },
  {
    name: "THZ v3",
    host: "github",
    url: "https://sakutathz.github.io/THZ_v3/",
    note: "A previous cut of the same person.",
  },
  {
    name: "Shika Typo",
    host: "github",
    url: "https://sakutathz.github.io/Shika-Typo.github.io/",
    note: "A typing room that answers back.",
  },
  {
    name: "Reflexo",
    host: "github",
    url: "https://sakutathz.github.io/Reflexo.github.io/",
    note: "A reflex game dressed as a Soul Fighter.",
  },
  {
    name: "Artify",
    host: "github",
    url: "https://sakutathz.github.io/artify_final.github.io/",
    note: "The version where the interface was the point.",
  },
  {
    name: "Artify, earlier",
    host: "github",
    url: "https://sakutathz.github.io/Artify.github.io/",
    note: "The draft that shipped anyway.",
  },
  {
    name: "ProjectT",
    host: "github",
    url: "https://sakutathz.github.io/ProjectTCG/",
    note: "Cards, spells, and weapons.",
  },
  {
    name: "Zlot",
    host: "github",
    url: "https://sakutathz.github.io/Zlot.github.io/",
    note: "Left on the edge of the account.",
  },
  {
    name: "TravelGo",
    host: "github",
    url: "https://sakutathz.github.io/TravelGo.github.io/",
    note: "A trip that never left the repo.",
  },
  {
    name: "Cosmo Stock",
    host: "github",
    url: "https://sakutathz.github.io/StockFlow/",
    note: "Inventory for a universe.",
  },
  {
    name: "Project Nexus",
    host: "github",
    url: "https://sakutathz.github.io/Project_Nexus/",
    note: "Whatever this was, it still loads.",
  },
  {
    name: "Tanner Goods",
    host: "github",
    url: "https://sakutathz.github.io/CodeTest.github.io/",
    note: "A storefront study with the lights still on.",
  },
  {
    name: "MyFeed",
    host: "github",
    url: "https://sakutathz.github.io/MyFeed.github.io/",
    note: "Opens on a login. Of course it does.",
  },
];

let nextTabId = 1;

function displayUrl(entry) {
  if (!entry || entry.kind === "home") return "bleed://cold";
  if (entry.url.startsWith("/")) return `${window.location.origin}${entry.url}`;
  return entry.url;
}

function labelFor(url) {
  const mark = MARKS.find((item) => item.url === url);
  if (mark) return mark.name;
  if (url.startsWith("/")) return "Portfolio";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Page";
  }
}

function isNestedPlayground(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin && parsed.pathname.startsWith("/playground");
  } catch {
    return false;
  }
}

function isLocalMachine(url) {
  try {
    const host = new URL(url).hostname.replace(/^\[|\]$/g, "").toLowerCase();
    return host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "0.0.0.0" || host.startsWith("127.") || host === "::1";
  } catch {
    return false;
  }
}

function normalizeWebUrl(value) {
  const candidate = /^https?:\/\//i.test(value)
    ? value
    : /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#]\S*)?$/i.test(value)
      ? `https://${value}`
      : "";
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.href;
  } catch {
    return "";
  }
}

function readAddress(raw) {
  const value = raw.trim();
  if (!value || /^bleed:\/\//i.test(value)) return { kind: "home", url: "" };
  if (/^(javascript|data|file|blob):/i.test(value)) return { blocked: "Bleed won't open that." };
  if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(value)) {
    return { blocked: "That address stays on this machine." };
  }
  if (value.startsWith("/")) {
    if (value.startsWith("//")) return { blocked: "Bleed won't open that." };
    if (isNestedPlayground(value)) return { blocked: "Playground is already open around this window." };
    return { kind: "web", url: value };
  }
  const direct = normalizeWebUrl(value);
  if (direct) {
    if (isLocalMachine(direct) && new URL(direct).origin !== window.location.origin) {
      return { blocked: "That address stays on this machine." };
    }
    if (isNestedPlayground(direct)) return { blocked: "Playground is already open around this window." };
    return { kind: "web", url: direct };
  }
  return {
    kind: "web",
    url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(value)}`,
    title: value,
  };
}

function usesProxy(url) {
  if (!url || url.startsWith("/")) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === window.location.hostname) return false;
    if (host === "github.io" || host.endsWith(".github.io")) return false;
    if (host.endsWith(".netlify.app") || host.endsWith(".vercel.app")) return false;
    return true;
  } catch {
    return false;
  }
}

function frameSrc(url) {
  if (!usesProxy(url)) return url;
  return `/api/bleed?url=${encodeURIComponent(url)}`;
}

function sameTarget(stored, href) {
  if (!stored.startsWith("/")) return href === stored;
  const absolute = `${window.location.origin}${stored}`;
  return href === absolute || href === absolute.replace(/\/$/, "") || (stored === "/" && href === `${window.location.origin}/`);
}

function toStored(href) {
  const origin = window.location.origin;
  const path = href.startsWith(origin) ? href.slice(origin.length) || "/" : href;
  if (path.startsWith("/api/bleed")) {
    try {
      return new URL(path, origin).searchParams.get("url") || path;
    } catch {
      return path;
    }
  }
  return path;
}

function armPortfolioFrame(frame) {
  let doc;
  try {
    doc = frame.contentDocument;
  } catch {
    return;
  }
  if (!doc?.documentElement || doc.documentElement.dataset.bleedGuard) return;
  doc.documentElement.dataset.bleedGuard = "true";
  doc.addEventListener(
    "click",
    (event) => {
      const raw = event.target;
      const node = raw && raw.nodeType === 1 ? raw : raw?.parentElement;
      const link = node?.closest?.("a[href]");
      if (!link) return;
      let next;
      try {
        next = new URL(link.getAttribute("href"), doc.baseURI);
      } catch {
        return;
      }
      if (link.target === "_blank") return;
      if (next.origin === window.location.origin && next.pathname.startsWith("/playground")) {
        event.preventDefault();
        event.stopPropagation();
        window.dispatchEvent(new CustomEvent("bleed-playground"));
        return;
      }
      if (next.origin !== window.location.origin && /^https?:$/.test(next.protocol)) {
        event.preventDefault();
        event.stopPropagation();
        window.dispatchEvent(new CustomEvent("bleed-open", { detail: next.href }));
      }
    },
    true
  );
}

function makeTab(entry) {
  const next = {
    kind: entry?.kind || "web",
    url: entry?.url ?? "/",
    title: entry?.title || labelFor(entry?.url ?? "/"),
  };
  return {
    id: nextTabId++,
    ...next,
    input: displayUrl(next),
    history: [next],
    index: 0,
    stamp: 0,
  };
}

function outsideHref(tab) {
  if (!tab || tab.kind !== "web") return "";
  if (tab.url.startsWith("/")) return `${window.location.origin}${tab.url}`;
  return tab.url;
}

export default function Bleed() {
  const [tabs, setTabs] = useState(() => [makeTab({ kind: "web", url: "/", title: "Portfolio" })]);
  const [activeId, setActiveId] = useState(() => tabs[0].id);
  const [notice, setNotice] = useState("");
  const [frameReady, setFrameReady] = useState(false);
  const addressRef = useRef(null);
  const activeIdRef = useRef(activeId);
  const navigateRef = useRef(null);
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  activeIdRef.current = activeId;

  useEffect(() => {
    setFrameReady(false);
  }, [active.id, active.kind, active.url, active.stamp]);

  useEffect(() => {
    const onBlock = () => setNotice("Playground is already open around this window.");
    const onOpen = (event) => {
      const url = String(event.detail || "");
      if (!/^https?:\/\//i.test(url)) return;
      navigateRef.current?.({ kind: "web", url, title: labelFor(url) });
    };
    const onMessage = (event) => {
      const frame = document.querySelector(".bleed-stage iframe");
      if (!frame || event.source !== frame.contentWindow) return;
      if (!event.data || event.data.type !== "bleed-nav") return;
      const url = String(event.data.url || "");
      if (!/^https?:\/\//i.test(url)) return;
      const title = String(event.data.title || "").slice(0, 180);
      let via = "";
      try {
        via = new URL(String(event.data.via || ""), window.location.origin).searchParams.get("url") || "";
      } catch {
        via = "";
      }
      const id = activeIdRef.current;
      setTabs((current) =>
        current.map((tab) => {
          if (tab.id !== id || tab.kind !== "web") return tab;
          const entry = { kind: "web", url, title: title || tab.title || labelFor(url) };
          if (tab.url === url) return title && title !== tab.title ? { ...tab, title } : tab;
          if (via === tab.url) {
            const history = tab.history.slice();
            history[tab.index] = entry;
            return { ...tab, ...entry, input: displayUrl(entry), history };
          }
          const history = tab.history.slice(0, tab.index + 1).concat(entry);
          return {
            ...tab,
            ...entry,
            input: displayUrl(entry),
            history,
            index: history.length - 1,
          };
        })
      );
    };
    window.addEventListener("bleed-playground", onBlock);
    window.addEventListener("bleed-open", onOpen);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("bleed-playground", onBlock);
      window.removeEventListener("bleed-open", onOpen);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  function patch(id, recipe) {
    setTabs((current) => current.map((tab) => (tab.id === id ? recipe(tab) : tab)));
  }

  function navigate(entry, { push = true, reload = false } = {}) {
    setNotice("");
    patch(active.id, (tab) => {
      const current = tab.history[tab.index];
      const same = current && current.kind === entry.kind && current.url === entry.url;
      let history = tab.history;
      let index = tab.index;
      if (push && !same) {
        history = tab.history.slice(0, tab.index + 1).concat(entry);
        index = history.length - 1;
      }
      return {
        ...tab,
        ...entry,
        title: entry.title || (entry.kind === "home" ? "Cold" : labelFor(entry.url)),
        input: displayUrl(entry),
        history,
        index,
        stamp: reload || (push && same) ? tab.stamp + 1 : tab.stamp,
      };
    });
  }
  navigateRef.current = navigate;

  function submitAddress(event) {
    event.preventDefault();
    const next = readAddress(active.input);
    if (next.blocked) {
      setNotice(next.blocked);
      return;
    }
    navigate({ ...next, title: next.title || (next.kind === "home" ? "Cold" : labelFor(next.url)) });
  }

  function step(direction) {
    const nextIndex = active.index + direction;
    const entry = active.history[nextIndex];
    if (!entry) return;
    setNotice("");
    patch(active.id, (tab) => ({
      ...tab,
      ...entry,
      input: displayUrl(entry),
      index: nextIndex,
    }));
  }

  function openTab(entry) {
    const tab = makeTab(entry || { kind: "home", url: "", title: "Cold" });
    setTabs((current) => [...current, tab]);
    setActiveId(tab.id);
    setNotice("");
  }

  function closeTab(id) {
    if (tabs.length === 1) {
      const fresh = makeTab({ kind: "home", url: "", title: "Cold" });
      setTabs([fresh]);
      setActiveId(fresh.id);
      return;
    }
    const index = tabs.findIndex((tab) => tab.id === id);
    const next = tabs.filter((tab) => tab.id !== id);
    if (id === activeId) setActiveId(next[Math.max(0, index - 1)].id);
    setTabs(next);
  }

  function onChromeKey(event) {
    const meta = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    if (meta && key === "t") {
      event.preventDefault();
      openTab();
    } else if (meta && key === "w") {
      event.preventDefault();
      closeTab(active.id);
    } else if (meta && key === "l") {
      event.preventDefault();
      addressRef.current?.select();
    } else if (event.altKey && event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.altKey && event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  }

  function onFrameLoad(id, event) {
    if (id !== active.id) return;
    setFrameReady(true);
    const frame = event.currentTarget;
    armPortfolioFrame(frame);
    let href = "";
    let title = "";
    try {
      href = frame.contentWindow.location.href;
      title = frame.contentDocument?.title?.trim() || "";
    } catch {
      return;
    }
    if (isNestedPlayground(href)) {
      setNotice("Playground is already open around this window.");
      patch(id, (tab) => {
        const current = tab.history[tab.index];
        if (current && !isNestedPlayground(current.url)) return { ...tab, stamp: tab.stamp + 1 };
        const entry = { kind: "web", url: "/", title: "Portfolio" };
        return {
          ...tab,
          ...entry,
          input: displayUrl(entry),
          history: [entry],
          index: 0,
          stamp: tab.stamp + 1,
        };
      });
      return;
    }
    patch(id, (tab) => {
      if (tab.kind !== "web") return tab;
      const titled = title ? { ...tab, title } : tab;
      if (sameTarget(tab.url, href)) return titled;
      const url = toStored(href);
      const entry = { kind: "web", url, title: title || labelFor(url) };
      const history = tab.history.slice(0, tab.index + 1).concat(entry);
      return {
        ...tab,
        ...entry,
        input: displayUrl(entry),
        history,
        index: history.length - 1,
      };
    });
  }

  const canBack = active.index > 0;
  const canForward = active.index < active.history.length - 1;
  const external = outsideHref(active);

  return (
    <div className="bleed" onKeyDown={onChromeKey}>
      <div className="bleed-tabs" role="tablist" aria-label="Bleed tabs">
        {tabs.map((tab) => (
          <div key={tab.id} className="bleed-tab" data-active={tab.id === active.id || undefined}>
            <button type="button" role="tab" aria-selected={tab.id === active.id} onClick={() => setActiveId(tab.id)}>
              <span>{tab.title}</span>
            </button>
            <button type="button" aria-label={`Close ${tab.title}`} onClick={() => closeTab(tab.id)}>
              <X size={12} strokeWidth={2.4} />
            </button>
          </div>
        ))}
        <button type="button" className="bleed-new" aria-label="New tab" onClick={() => openTab()}>
          <Plus size={14} strokeWidth={2.2} />
        </button>
      </div>

      <form className="bleed-bar" onSubmit={submitAddress}>
        <button type="button" aria-label="Back" disabled={!canBack} onClick={() => step(-1)}>
          <ArrowLeft size={15} strokeWidth={2.1} />
        </button>
        <button type="button" aria-label="Forward" disabled={!canForward} onClick={() => step(1)}>
          <ArrowRight size={15} strokeWidth={2.1} />
        </button>
        <button
          type="button"
          aria-label="Reload"
          disabled={active.kind !== "web"}
          onClick={() => navigate({ kind: active.kind, url: active.url, title: active.title }, { push: false, reload: true })}
        >
          <RotateCw size={14} strokeWidth={2.1} />
        </button>
        <label className="bleed-address">
          <span>Bleed</span>
          <input
            ref={addressRef}
            value={active.input}
            aria-label="Address"
            placeholder="Search the web or type an address"
            spellCheck={false}
            onChange={(event) => {
              const value = event.target.value;
              setNotice("");
              patch(active.id, (tab) => ({ ...tab, input: value }));
            }}
            onFocus={(event) => event.target.select()}
          />
        </label>
        <a
          className="bleed-out"
          href={external || undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!external}
          aria-label="Open this page outside Bleed"
          onClick={(event) => {
            if (!external) event.preventDefault();
          }}
        >
          <ArrowUpRight size={15} strokeWidth={2.1} />
        </a>
      </form>
      {notice && <p className="bleed-notice">{notice}</p>}

      <div className="bleed-marks" aria-label="Bookmarks">
        {MARKS.map((mark) => (
          <button
            key={mark.url}
            type="button"
            data-current={active.kind === "web" && active.url === mark.url ? "true" : undefined}
            onClick={() => navigate({ kind: "web", url: mark.url, title: mark.name })}
          >
            {mark.name}
          </button>
        ))}
      </div>

      {active.kind === "home" ? (
        <section className="bleed-cold" aria-label="Cold storage">
          <header>
            <p>bleed // cold storage</p>
            <h2>Still answering.</h2>
            <p>Pages that never got a funeral. The portfolio is the first tab. These are the ones left on GitHub.</p>
          </header>
          <ul>
            {MARKS.map((mark) => (
              <li key={mark.url}>
                <button type="button" onClick={() => navigate({ kind: "web", url: mark.url, title: mark.name })}>
                  <span>{mark.host}</span>
                  <strong>{mark.name}</strong>
                  <em>{mark.note}</em>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="bleed-stage" data-ready={frameReady || undefined}>
          <iframe
            key={`${active.id}:${active.stamp}:${usesProxy(active.url) ? "proxy" : "direct"}`}
            title={active.title}
            src={frameSrc(active.url)}
            sandbox={usesProxy(active.url) ? "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" : undefined}
            referrerPolicy="no-referrer"
            onLoad={(event) => onFrameLoad(active.id, event)}
          />
        </div>
      )}
    </div>
  );
}
