const KNOWN = {
  bleed: ["#7ad7ff", "#06202c"],
  bombsweeper: ["#ff5b3e", "#2a0d08"],
  memobook: ["#ffd84d", "#2a2108"],
  tscode: ["#60a5fa", "#071428"],
  timer: ["#c084fc", "#1c0a2c"],
  tikalator: ["#3dff8a", "#062814"],
  settings: ["#d7dde6", "#1c2128"],
  terminal: ["#7dffb3", "#062814"],
  zanstore: ["#3ddc84", "#062814"],
};

const SWATCHES = [
  ["#ff5b3e", "#2a0d08"],
  ["#ffd84d", "#2a2108"],
  ["#ff8a3d", "#2a1408"],
  ["#7ad7ff", "#06202c"],
  ["#c084fc", "#1c0a2c"],
  ["#3dff8a", "#062814"],
  ["#fb7185", "#2a0a12"],
  ["#f4c095", "#2a160c"],
  ["#60a5fa", "#071428"],
  ["#f97316", "#2a1004"],
  ["#e7f4ff", "#102028"],
  ["#c4f04d", "#1a2406"],
];

export function iconKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function appIconColors(name) {
  const known = KNOWN[iconKey(name)];
  if (known) return { bg: known[0], ink: known[1] };
  const letter = String(name || "?").trim().charAt(0).toUpperCase();
  const index = letter >= "A" && letter <= "Z" ? letter.charCodeAt(0) - 65 : 0;
  const [bg, ink] = SWATCHES[index % SWATCHES.length];
  return { bg, ink };
}

function Glyph({ ink, children }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="pg-system-mark">
      <g fill="none" stroke={ink} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

const GLYPHS = {
  bleed({ ink }) {
    return (
      <Glyph ink={ink}>
        <circle cx="16" cy="16" r="9" />
        <ellipse cx="16" cy="16" rx="4" ry="9" />
        <path d="M7 16h18" />
      </Glyph>
    );
  },
  bombsweeper({ ink }) {
    return (
      <Glyph ink={ink}>
        <path d="M8 27V5" />
        <path d="M8 6.5h14L16 13l6 6.5H8" fill={ink} stroke="none" />
      </Glyph>
    );
  },
  memobook({ ink }) {
    return (
      <Glyph ink={ink}>
        <rect x="6" y="4" width="20" height="24" rx="2.5" />
        <path d="M12 4v24" />
        <path d="M16 12h7M16 17h7" />
      </Glyph>
    );
  },
  tscode({ ink }) {
    return (
      <Glyph ink={ink}>
        <path d="M13 7 5 16l8 9" />
        <path d="M19 7l8 9-8 9" />
      </Glyph>
    );
  },
  timer({ ink }) {
    return (
      <Glyph ink={ink}>
        <circle cx="16" cy="17" r="9" />
        <path d="M16 17V11" />
        <path d="M16 17h5" />
        <path d="M12 5h8" />
      </Glyph>
    );
  },
  tikalator({ ink }) {
    return (
      <Glyph ink={ink}>
        <rect x="6" y="4" width="20" height="24" rx="3" />
        <path d="M10 10h12" />
        <path d="M16 14v10" />
        <path d="M11 19h10" />
      </Glyph>
    );
  },
  settings({ ink }) {
    return (
      <Glyph ink={ink}>
        <circle cx="16" cy="16" r="3.2" />
        <path d="M16 6.2v2.4M16 23.4v2.4M6.2 16h2.4M23.4 16h2.4M9.1 9.1l1.7 1.7M21.2 21.2l1.7 1.7M22.9 9.1l-1.7 1.7M10.8 21.2 9.1 22.9" />
      </Glyph>
    );
  },
  zanstore({ ink }) {
    return (
      <Glyph ink={ink}>
        <path d="M9 11h14l-1.4 13.2a2 2 0 0 1-2 1.8h-7.2a2 2 0 0 1-2-1.8L9 11z" />
        <path d="M12.5 11V9.2a3.5 3.5 0 0 1 7 0V11" />
      </Glyph>
    );
  },
  terminal({ ink }) {
    return (
      <Glyph ink={ink}>
        <path d="M8 10.5 14 16l-6 5.5" />
        <path d="M16 22h9" />
      </Glyph>
    );
  },
};

export function AppGlyphGraphic({ name }) {
  const GlyphForName = GLYPHS[iconKey(name)];
  if (!GlyphForName) return null;
  return <GlyphForName ink={appIconColors(name).ink} />;
}
