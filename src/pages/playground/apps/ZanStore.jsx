import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Download, Library, Moon, PanelLeft, Search, Star, Sun, UserRound } from "lucide-react";
import AppIcon from "@/components/playground/AppIcon";
import { useDesktop, useNotify, useWindowFrame } from "@/components/playground/desktopContext";
import { storeApps } from "@/pages/playground/registry";
import "./css/zanstore.css";

export const playgroundMeta = {
  title: "ZanStore",
  width: 980,
  height: 740,
};

const INSTALL_MIN_MS = 5000;
const INSTALL_MAX_MS = 10000;
const TONE_KEY = "zanstore-tone";
const SIDE_KEY = "zanstore-side";

function installDuration() {
  return INSTALL_MIN_MS + Math.random() * (INSTALL_MAX_MS - INSTALL_MIN_MS);
}

function reviewsOf(listing) {
  return Array.isArray(listing?.reviews) ? listing.reviews : [];
}

function readStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return reduce;
}

function springOf(reduce, stiffness = 520) {
  return reduce ? { duration: 0.01 } : { type: "spring", stiffness, damping: 15, mass: 0.62 };
}

function Stars({ value, size = 14 }) {
  const score = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="zan-stars" style={{ "--zan-star": `${size}px` }} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => {
        const amount = Math.max(0, Math.min(1, score - index));
        return (
          <span key={index} className="zan-star">
            <Star size={size} strokeWidth={2.2} />
            <span className="zan-star-fill" style={{ width: `${amount * 100}%` }}>
              <Star size={size} strokeWidth={0} fill="currentColor" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function GradientButton({ label, progress, busy, onClick }) {
  const pct = progress == null ? null : Math.round(Math.max(0, Math.min(1, progress)) * 100);
  return (
    <button
      type="button"
      className="zan-gradient"
      data-busy={busy || undefined}
      style={pct == null ? undefined : { "--zan-p": `${pct}%` }}
      aria-busy={busy || undefined}
      aria-label={busy ? `Installing ${pct}%. Activate to cancel.` : label}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
    >
      <span className="zan-gradient-fill" aria-hidden="true" />
      <span className="zan-gradient-label">{busy ? `${pct}%` : label}</span>
    </button>
  );
}

function AppMark({ name, size }) {
  return (
    <span className="zan-mark">
      <AppIcon name={name} size={size} />
    </span>
  );
}

function ratingBars(reviews) {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((review) => {
    const star = Math.round(Number(review?.rating));
    if (star >= 1 && star <= 5) counts[star - 1] += 1;
  });
  const max = Math.max(1, ...counts);
  return counts.map((count, index) => ({ star: index + 1, count, width: (count / max) * 100 })).reverse();
}

function SideButton({ icon: Icon, label, active, onClick }) {
  return (
    <button type="button" className="zan-nav" data-active={active || undefined} title={label} onClick={onClick}>
      <Icon size={16} strokeWidth={2.4} />
      <span>{label}</span>
    </button>
  );
}

export default function ZanStore() {
  const desktop = useDesktop();
  const frame = useWindowFrame();
  const notify = useNotify();
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [now, setNow] = useState(() => performance.now());
  const [host, setHost] = useState(null);
  const [toast, setToast] = useState(null);
  const [tone, setTone] = useState(() => (readStored(TONE_KEY, "light") === "dark" ? "dark" : "light"));
  const [collapsed, setCollapsed] = useState(() => readStored(SIDE_KEY, "open") === "closed");
  const [view, setView] = useState("library");
  const completing = useRef(new Set());

  useLayoutEffect(() => {
    setHost(document.querySelector(".pg-desktop"));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(TONE_KEY, tone);
    } catch {
      /* storage can be blocked */
    }
  }, [tone]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDE_KEY, collapsed ? "closed" : "open");
    } catch {
      /* storage can be blocked */
    }
  }, [collapsed]);

  useEffect(() => {
    if (!jobs.length) return undefined;
    let frameId = 0;
    const tick = () => {
      setNow(performance.now());
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [jobs.length]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const installed = desktop.installedIds;
  const categories = useMemo(() => {
    const names = new Set(storeApps.map((app) => app.listing.category).filter(Boolean));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, []);

  useEffect(() => {
    jobs.forEach((job) => {
      if (now - job.started < job.duration) return;
      if (completing.current.has(job.id)) return;
      completing.current.add(job.id);
      const app = storeApps.find((entry) => entry.id === job.id);
      const title = app?.listing.title || "App";
      desktop.installApp(job.id);
      notify({ title: "ZanStore", app: "ZanStore", body: `${title} was installed.` });
      setToast({ title, name: app?.meta?.title || title });
      setJobs((current) => current.filter((entry) => entry.id !== job.id));
    });
  }, [desktop, jobs, notify, now]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return storeApps.filter((app) => {
      if (view === "installed" && !installed.includes(app.id)) return false;
      if (view.startsWith("cat:") && app.listing.category !== view.slice(4)) return false;
      if (!needle) return true;
      const listing = app.listing;
      return [listing.title, listing.developer, listing.category, listing.summary]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [installed, query, view]);

  const selected = storeApps.find((app) => app.id === selectedId) || null;
  const catalogTitle =
    view === "installed" ? "Installed" : view.startsWith("cat:") ? view.slice(4) : "Library";

  function jobFor(id) {
    return jobs.find((job) => job.id === id) || null;
  }

  function progressFor(id) {
    const job = jobFor(id);
    if (!job) return null;
    return Math.min(1, Math.max(0, (now - job.started) / job.duration));
  }

  function startInstall(id) {
    if (installed.includes(id) || jobFor(id)) return;
    completing.current.delete(id);
    setJobs((current) => {
      if (current.some((job) => job.id === id)) return current;
      return [...current, { id, started: performance.now(), duration: installDuration() }];
    });
  }

  function cancelInstall(id) {
    completing.current.delete(id);
    setJobs((current) => current.filter((job) => job.id !== id));
  }

  function onInstallClick(id) {
    if (installed.includes(id)) {
      desktop.openStoreApp(id);
      return;
    }
    if (jobFor(id)) cancelInstall(id);
    else startInstall(id);
  }

  function openView(next) {
    setSelectedId(null);
    setView(next);
  }

  const showNotch = Boolean(host && frame?.minimized && jobs.length);
  const notch = showNotch
    ? createPortal(
        <div className="zan-notch-anchor">
          {jobs.map((job) => {
            const app = storeApps.find((entry) => entry.id === job.id);
            const title = app?.listing.title || "App";
            const pct = Math.round((progressFor(job.id) || 0) * 100);
            return (
              <motion.button
                key={job.id}
                type="button"
                className="zan-notch"
                data-tone={tone}
                style={{ "--zan-p": `${pct}%` }}
                initial={reduce ? false : { opacity: 0, y: -18, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={springOf(reduce, 460)}
                onClick={() => frame.restore()}
                aria-label={`${title} install ${pct} percent. Open ZanStore.`}
              >
                <AppIcon name={app?.meta?.title || title} size={22} />
                <span className="zan-notch-copy">
                  <strong>{title}</strong>
                  <span>Installing {pct}%</span>
                </span>
                <span className="zan-notch-track" aria-hidden="true">
                  <span className="zan-notch-fill" />
                </span>
              </motion.button>
            );
          })}
        </div>,
        host
      )
    : null;

  const toastNode =
    toast && host
      ? createPortal(
          <div className="zan-toast-anchor">
            <motion.div
              className="zan-toast"
              data-tone={tone}
              role="status"
              initial={reduce ? false : { opacity: 0, y: -18, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={springOf(reduce, 460)}
            >
              <AppIcon name={toast.name} size={28} />
              <span>
                <strong>{toast.title}</strong> was installed
              </span>
            </motion.div>
          </div>,
          host
        )
      : null;

  return (
    <div className="zan-store" data-tone={tone} data-collapsed={collapsed || undefined}>
      {notch}
      {toastNode}
      <aside className="zan-side">
        <div className="zan-side-top">
          <button
            type="button"
            className="zan-collapse"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            onClick={() => setCollapsed((current) => !current)}
          >
            <PanelLeft size={16} strokeWidth={2.4} />
          </button>
          <div className="zan-side-brand">
            <span className="zan-stamp">Z</span>
            <div className="zan-side-copy">
              <p className="zan-word">ZanStore</p>
              <p className="zan-tag">Brutal shelf</p>
            </div>
          </div>
        </div>

        <nav className="zan-nav-list" aria-label="Store">
          <p className="zan-nav-label">Shelf</p>
          <SideButton icon={Library} label="Library" active={view === "library" && !selected} onClick={() => openView("library")} />
          <SideButton
            icon={Download}
            label="Installed"
            active={view === "installed" && !selected}
            onClick={() => openView("installed")}
          />
          {categories.length > 0 && <p className="zan-nav-label">Kinds</p>}
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="zan-nav"
              data-active={(view === `cat:${category}` && !selected) || undefined}
              aria-label={category}
              title={category}
              onClick={() => openView(`cat:${category}`)}
            >
              <span className="zan-nav-mark" aria-hidden="true">
                {category.charAt(0)}
              </span>
              <span>{category}</span>
            </button>
          ))}
        </nav>

        <div className="zan-side-foot">
          <button
            type="button"
            className="zan-nav zan-nav-profile"
            data-active={(view === "profile" && !selected) || undefined}
            title="Profile"
            onClick={() => openView("profile")}
          >
            <UserRound size={16} strokeWidth={2.4} />
            <span>Profile</span>
          </button>
          <button
            type="button"
            className="zan-tone"
            aria-label={tone === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={tone === "dark" ? "Light mode" : "Dark mode"}
            onClick={() => setTone((current) => (current === "dark" ? "light" : "dark"))}
          >
            {tone === "dark" ? <Sun size={16} strokeWidth={2.4} /> : <Moon size={16} strokeWidth={2.4} />}
            <span>{tone === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>
      </aside>

      <div className="zan-main">
        <header className="zan-top">
          <div>
            <p className="zan-kicker">{selected ? selected.listing.category : view === "profile" ? "Account" : "Catalog"}</p>
            <h1>{selected ? selected.listing.title : view === "profile" ? "Profile" : catalogTitle}</h1>
          </div>
          {view !== "profile" && (
            <label className="zan-search">
              <Search size={16} strokeWidth={2.4} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the shelf"
                aria-label="Search apps"
              />
            </label>
          )}
        </header>

        <div className="zan-scroll">
          <AnimatePresence mode="wait" initial={false}>
            {selected ? (
              <motion.article
                key={selected.id}
                className="zan-detail"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0, y: 10 }}
                transition={{ duration: reduce ? 0.01 : 0.12 }}
              >
                <Detail
                  app={selected}
                  installed={installed.includes(selected.id)}
                  progress={progressFor(selected.id)}
                  reduce={reduce}
                  onBack={() => setSelectedId(null)}
                  onInstall={() => onInstallClick(selected.id)}
                  onUninstall={() => desktop.uninstallApp(selected.id)}
                />
              </motion.article>
            ) : view === "profile" ? (
              <motion.section
                key="profile"
                className="zan-profile"
                initial={reduce ? false : { opacity: 0, y: 22, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, y: 12 }}
                transition={springOf(reduce, 480)}
              >
                <ProfileCard
                  installedCount={installed.length}
                  libraryCount={storeApps.length}
                  tone={tone}
                  onTone={() => setTone((current) => (current === "dark" ? "light" : "dark"))}
                />
              </motion.section>
            ) : (
              <motion.section
                key={view}
                className="zan-catalog"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: 8 }}
                transition={springOf(reduce, 420)}
              >
                <div className="zan-catalog-head">
                  <p>
                    {view === "installed"
                      ? "Apps already sitting on this desktop."
                      : "Install one and it lands in the Installed folder."}
                  </p>
                </div>
                {visible.length ? (
                  <ul className="zan-list">
                    {visible.map((app, index) => {
                      const listing = app.listing;
                      const busy = Boolean(jobFor(app.id));
                      const owned = installed.includes(app.id);
                      return (
                        <motion.li
                          key={app.id}
                          className="zan-row"
                          initial={reduce ? false : { opacity: 0, y: 22, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ ...springOf(reduce), delay: reduce ? 0 : Math.min(index, 8) * 0.045 }}
                        >
                          <button type="button" className="zan-row-open" onClick={() => setSelectedId(app.id)}>
                            <AppMark name={app.meta.title || listing.title} size={52} />
                            <span className="zan-row-copy">
                              <strong>{listing.title}</strong>
                              <span>{listing.developer}</span>
                              <span className="zan-row-meta">
                                <Stars value={listing.rating} size={12} />
                                <span>{Number(listing.rating || 0).toFixed(1)}</span>
                                <span className="zan-dot" aria-hidden="true" />
                                <span>{listing.category}</span>
                              </span>
                            </span>
                          </button>
                          <GradientButton
                            label={owned ? "Open" : "Install"}
                            busy={busy}
                            progress={busy ? progressFor(app.id) : null}
                            onClick={() => onInstallClick(app.id)}
                          />
                        </motion.li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="zan-empty">Nothing on this shelf matches.</p>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ installedCount, libraryCount, tone, onTone }) {
  return (
    <>
      <div className="zan-id">
        <span className="zan-id-mark" aria-hidden="true">
          SK
        </span>
        <div>
          <p className="zan-kicker">Operator</p>
          <h2>Sakuta</h2>
          <p>This desktop. Apps install locally and stay in the Installed folder.</p>
        </div>
      </div>
      <dl className="zan-stats">
        <div>
          <dt>{installedCount}</dt>
          <dd>Installed</dd>
        </div>
        <div>
          <dt>{libraryCount}</dt>
          <dd>In library</dd>
        </div>
        <div>
          <dt>{tone === "dark" ? "Dark" : "Light"}</dt>
          <dd>Mode</dd>
        </div>
      </dl>
      <button type="button" className="zan-tone zan-tone-wide" onClick={onTone}>
        {tone === "dark" ? <Sun size={16} strokeWidth={2.4} /> : <Moon size={16} strokeWidth={2.4} />}
        <span>{tone === "dark" ? "Switch to light" : "Switch to dark"}</span>
      </button>
    </>
  );
}

function Detail({ app, installed, progress, reduce, onBack, onInstall, onUninstall }) {
  const listing = app.listing;
  const reviews = reviewsOf(listing);
  const bars = ratingBars(reviews);
  const busy = progress != null;
  const name = app.meta.title || listing.title;
  const pop = springOf(reduce, 560);

  return (
    <>
      <motion.button
        type="button"
        className="zan-back"
        onClick={onBack}
        initial={reduce ? false : { opacity: 0, y: 18, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={pop}
      >
        <ArrowLeft size={16} strokeWidth={2.4} />
        Back
      </motion.button>
      <motion.div
        className="zan-hero"
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...pop, delay: reduce ? 0 : 0.04 }}
      >
        <AppMark name={name} size={78} />
        <div className="zan-hero-copy">
          <h2>{listing.title}</h2>
          <p>{listing.developer}</p>
          <p className="zan-summary">{listing.summary}</p>
        </div>
        <div className="zan-hero-action">
          <GradientButton
            label={installed ? "Open" : busy ? "Cancel" : "Install"}
            busy={busy}
            progress={busy ? progress : null}
            onClick={onInstall}
          />
          {installed && (
            <button type="button" className="zan-uninstall" onClick={onUninstall}>
              Uninstall
            </button>
          )}
        </div>
      </motion.div>

      <motion.dl
        className="zan-stats"
        initial={reduce ? false : { opacity: 0, y: 32, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...pop, delay: reduce ? 0 : 0.1 }}
      >
        <div>
          <dt>
            <span className="zan-stat-value">{Number(listing.rating || 0).toFixed(1)}</span>
            <Stars value={listing.rating} size={13} />
          </dt>
          <dd>{listing.ratingsCount || reviews.length} reviews</dd>
        </div>
        <div>
          <dt>{listing.installs || "—"}</dt>
          <dd>Downloads</dd>
        </div>
        <div>
          <dt>{listing.age || "Everyone"}</dt>
          <dd>Rated for</dd>
        </div>
        <div>
          <dt>{listing.size || "—"}</dt>
          <dd>Size</dd>
        </div>
      </motion.dl>

      <motion.section
        className="zan-section"
        initial={reduce ? false : { opacity: 0, y: 36, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...pop, delay: reduce ? 0 : 0.16 }}
      >
        <h3>About this app</h3>
        {String(listing.description || "")
          .split(/\n+/)
          .filter(Boolean)
          .map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        <ul className="zan-facts">
          <li>
            <span>Version</span>
            <strong>{listing.version || "1.0"}</strong>
          </li>
          <li>
            <span>Updated</span>
            <strong>{listing.updated || "—"}</strong>
          </li>
          <li>
            <span>Category</span>
            <strong>{listing.category || "App"}</strong>
          </li>
        </ul>
        {listing.whatsNew && (
          <div className="zan-whats-new">
            <h4>What&apos;s new</h4>
            <p>{listing.whatsNew}</p>
          </div>
        )}
      </motion.section>

      <motion.section
        className="zan-section"
        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...pop, delay: reduce ? 0 : 0.22 }}
      >
        <h3>Ratings and reviews</h3>
        <div className="zan-rating-board">
          <div className="zan-rating-score">
            <strong>{Number(listing.rating || 0).toFixed(1)}</strong>
            <Stars value={listing.rating} size={16} />
            <span>{listing.ratingsCount || reviews.length} reviews</span>
          </div>
          <ul className="zan-bars">
            {bars.map((bar) => (
              <li key={bar.star}>
                <span>{bar.star}</span>
                <span className="zan-bar">
                  <span style={{ width: `${bar.width}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <ul className="zan-reviews">
          {reviews.map((review) => (
            <li key={`${review.name}-${review.date}`}>
              <span className="zan-avatar" aria-hidden="true">
                {String(review.name || "?").trim().charAt(0).toUpperCase()}
              </span>
              <div>
                <header>
                  <strong>{review.name}</strong>
                  <time>{review.date}</time>
                </header>
                <Stars value={review.rating} size={12} />
                <p>{review.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </motion.section>
    </>
  );
}
