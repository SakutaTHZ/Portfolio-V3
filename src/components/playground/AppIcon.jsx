import { appIconColors, AppGlyphGraphic } from "./app-icons";
import { getIconStyle } from "./appearance";
import { useDesktop } from "./desktopContext";

export default function AppIcon({ name, size, style }) {
  const desktop = useDesktop();
  const chosen = getIconStyle(style || desktop.settings.icons).id;
  const { bg, ink } = appIconColors(name);
  const graphic = <AppGlyphGraphic name={name} />;
  const letter = String(name || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className="pg-icon-app"
      data-style={chosen}
      style={{
        ...(size ? { "--pg-icon-size": `${size}px` } : null),
        "--pg-icon-color": bg,
        "--pg-icon-ink": ink,
      }}
    >
      <span className="pg-icon-face" aria-hidden="true" />
      {graphic || (
        <span className="pg-icon-letter" style={{ fontSize: Math.max(11, Math.round((size || 52) * 0.42)) }}>
          {letter}
        </span>
      )}
    </span>
  );
}
