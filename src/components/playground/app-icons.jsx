function Mark({ size, bg, ink, children }) {
  return (
    <span
      className="pg-icon-app pg-system-tile"
      style={{
        width: size,
        height: size,
        "--pg-icon-color": bg,
        "--pg-icon-ink": ink,
      }}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="pg-system-mark">
        <g fill="none" stroke={ink} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </g>
      </svg>
    </span>
  );
}

function BleedIcon({ size }) {
  return (
    <Mark size={size} bg="#7ad7ff" ink="#06202c">
      <circle cx="16" cy="16" r="9" />
      <ellipse cx="16" cy="16" rx="4" ry="9" />
      <path d="M7 16h18" />
    </Mark>
  );
}

function BombSweeperIcon({ size }) {
  return (
    <Mark size={size} bg="#ff5b3e" ink="#2a0d08">
      <path d="M8 27V5" />
      <path d="M8 6.5h14L16 13l6 6.5H8" fill="#2a0d08" stroke="none" />
    </Mark>
  );
}

function MemoBookIcon({ size }) {
  return (
    <Mark size={size} bg="#ffd84d" ink="#2a2108">
      <rect x="6" y="4" width="20" height="24" rx="2.5" />
      <path d="M12 4v24" />
      <path d="M16 12h7M16 17h7" />
    </Mark>
  );
}

function TSCodeIcon({ size }) {
  return (
    <Mark size={size} bg="#60a5fa" ink="#071428">
      <path d="M13 7 5 16l8 9" />
      <path d="M19 7l8 9-8 9" />
    </Mark>
  );
}

function TimerIcon({ size }) {
  return (
    <Mark size={size} bg="#c084fc" ink="#1c0a2c">
      <circle cx="16" cy="17" r="9" />
      <path d="M16 17V11" />
      <path d="M16 17h5" />
      <path d="M12 5h8" />
    </Mark>
  );
}

function TikalatorIcon({ size }) {
  return (
    <Mark size={size} bg="#3dff8a" ink="#062814">
      <rect x="6" y="4" width="20" height="24" rx="3" />
      <path d="M10 10h12" />
      <path d="M16 14v10" />
      <path d="M11 19h10" />
    </Mark>
  );
}

const BASE_APP_ICONS = {
  bleed: BleedIcon,
  bombsweeper: BombSweeperIcon,
  memobook: MemoBookIcon,
  tscode: TSCodeIcon,
  timer: TimerIcon,
  tikalator: TikalatorIcon,
};

export function baseAppIcon(name) {
  const key = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return BASE_APP_ICONS[key] ?? null;
}
