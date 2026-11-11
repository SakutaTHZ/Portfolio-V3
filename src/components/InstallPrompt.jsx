import { useEffect, useState } from "react";

const DISMISS_KEY = "pwa-install-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIos() {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isMobileChromium() {
  const ua = window.navigator.userAgent;
  return /Android/i.test(ua) && /Chrome|EdgA|SamsungBrowser/i.test(ua);
}

export default function InstallPrompt() {
  const [mode, setMode] = useState(null);
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    if (isStandalone() || sessionStorage.getItem(DISMISS_KEY)) return undefined;

    const onPrompt = (event) => {
      event.preventDefault();
      setDeferred(event);
      setMode("native");
    };
    const onInstalled = () => {
      setDeferred(null);
      setMode(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (isIos()) setMode("ios");

    const menuTimer = window.setTimeout(() => {
      setMode((current) => {
        if (current || !isMobileChromium()) return current;
        return "menu";
      });
    }, 1600);

    return () => {
      window.clearTimeout(menuTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mode) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setMode(null);
  };

  const install = async () => {
    if (typeof deferred?.prompt !== "function") return;
    await deferred.prompt();
    setDeferred(null);
    setMode(null);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-[#2c2c2c] px-3 py-2.5 text-sm text-white shadow-[0_10px_28px_#00000066]">
      <p className="min-w-0 flex-1 leading-snug">
        {mode === "ios"
          ? "To install, tap Share, then Add to Home Screen."
          : mode === "menu"
            ? "Open the browser menu and choose Install app."
            : "Install this portfolio on your phone."}
      </p>
      {mode === "native" && (
        <button
          type="button"
          className="shrink-0 rounded-lg bg-[#ffd84d] px-3 py-1.5 text-sm font-medium text-[#111111]"
          onClick={install}
        >
          Install
        </button>
      )}
      <button
        type="button"
        className="shrink-0 px-1 text-lg leading-none text-white/70"
        aria-label="Dismiss install prompt"
        onClick={dismiss}
      >
        ×
      </button>
    </div>
  );
}
