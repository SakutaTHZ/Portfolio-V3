import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Search, Star } from "lucide-react";
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

function installDuration() {
  return INSTALL_MIN_MS + Math.random() * (INSTALL_MAX_MS - INSTALL_MIN_MS);
}

function reviewsOf(listing) {
  return Array.isArray(listing?.reviews) ? listing.reviews : [];
}

function Stars({ value, size = 14 }) {
  const score = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="zan-stars" style={{ "--zan-star": `${size}px` }} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => {
        const amount = Math.max(0, Math.min(1, score - index));
        return (
          <span key={index} className="zan-star">
            <Star size={size} strokeWidth={1.7} />
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

export default function ZanStore() {
  const desktop = useDesktop();
  const frame = useWindowFrame();
  const notify = useNotify();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [now, setNow] = useState(() => performance.now());
  const [host, setHost] = useState(null);
  const [toast, setToast] = useState(null);
  const completing = useRef(new Set());

  useLayoutEffect(() => {
    setHost(document.querySelector(".pg-desktop"));
  }, []);

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
    if (!needle) return storeApps;
    return storeApps.filter((app) => {
      const listing = app.listing;
      return [listing.title, listing.developer, listing.category, listing.summary]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [query]);

  const selected = storeApps.find((app) => app.id === selectedId) || null;

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
                style={{ "--zan-p": `${pct}%` }}
                initial={{ opacity: 0, y: -14, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
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
              role="status"
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
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
    <div className="zan-store">
      {notch}
      {toastNode}
      <header className="zan-top">
        <div className="zan-brand">
          <span className="zan-brand-mark" aria-hidden="true">
            <AppIcon name="ZanStore" size={28} />
          </span>
          <div>
            <p className="zan-word">ZanStore</p>
            <p className="zan-tag">Apps for this desktop</p>
          </div>
        </div>
        <label className="zan-search">
          <Search size={16} strokeWidth={2.2} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search apps"
            aria-label="Search apps"
          />
        </label>
      </header>

      <div className="zan-scroll">
        <AnimatePresence mode="wait" initial={false}>
          {selected ? (
            <motion.article
              key={selected.id}
              className="zan-detail"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <Detail
                app={selected}
                installed={installed.includes(selected.id)}
                progress={progressFor(selected.id)}
                onBack={() => setSelectedId(null)}
                onInstall={() => onInstallClick(selected.id)}
                onUninstall={() => desktop.uninstallApp(selected.id)}
              />
            </motion.article>
          ) : (
            <motion.section
              key="catalog"
              className="zan-catalog"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="zan-catalog-head">
                <h2>Apps</h2>
                <p>Install one and it lands in the Installed folder.</p>
              </div>
              {visible.length ? (
                <ul className="zan-list">
                  {visible.map((app) => {
                    const listing = app.listing;
                    const busy = Boolean(jobFor(app.id));
                    const owned = installed.includes(app.id);
                    return (
                      <li key={app.id} className="zan-row">
                        <button type="button" className="zan-row-open" onClick={() => setSelectedId(app.id)}>
                          <AppMark name={app.meta.title || listing.title} size={56} />
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
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="zan-empty">No apps match that search.</p>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Detail({ app, installed, progress, onBack, onInstall, onUninstall }) {
  const listing = app.listing;
  const reviews = reviewsOf(listing);
  const bars = ratingBars(reviews);
  const busy = progress != null;
  const name = app.meta.title || listing.title;

  return (
    <>
      <button type="button" className="zan-back" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={2.2} />
        Apps
      </button>
      <div className="zan-hero">
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
      </div>

      <dl className="zan-stats">
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
      </dl>

      <section className="zan-section">
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
      </section>

      <section className="zan-section">
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
      </section>
    </>
  );
}
