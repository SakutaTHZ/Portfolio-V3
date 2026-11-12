import LetterGlitch from "@/components/LetterGlitch";
import CRTWarp from "@/components/CRTWarp";
import GradientASCII from "@/components/GradientASCII";
import Topography from "@/components/Topography";
import GradientWaves from "@/components/GradientWaves";
import LaserFlow from "@/components/LaserFlow";

export default function Wallpaper({ backgroundId, theme }) {
  const lightMode = theme.tone === "light";

  if (backgroundId === "solid") {
    return (
      <div
        className="pg-solid-wall"
        style={{
          background: `radial-gradient(90% 70% at 82% 0%, ${theme.accent}73, transparent 52%), radial-gradient(70% 60% at 0% 100%, ${theme.accent2}55, transparent 48%), ${theme.screen}`,
        }}
      />
    );
  }

  if (backgroundId === "crt") {
    return (
      <CRTWarp
        color={theme.crt}
        backgroundColor={theme.screen}
        lightMode={lightMode}
        mouseReact
        intro={false}
      />
    );
  }

  if (backgroundId === "ascii") {
    return (
      <GradientASCII
        colors={theme.ascii}
        shape="horizon"
        lightMode={lightMode}
        intro={false}
      />
    );
  }

  if (backgroundId === "topo") {
    return <Topography color={theme.topo} lightMode={lightMode} intro={false} />;
  }

  if (backgroundId === "waves") {
    return (
      <GradientWaves
        horizonColor={theme.waves.horizon}
        crestColor={theme.waves.crest}
        backgroundColor={theme.waves.background}
        lightMode={lightMode}
        intro={false}
      />
    );
  }

  if (backgroundId === "laser") {
    return (
      <LaserFlow
        color={theme.laser}
        theme={lightMode ? "light" : "dark"}
        intro={false}
        mouseInteraction
      />
    );
  }

  return (
    <LetterGlitch
      glitchColors={theme.glitch}
      backgroundColor={theme.screen}
      lightMode={lightMode}
      intro={false}
      density={0.72}
      baseOpacity={lightMode ? 0.28 : 0.18}
    />
  );
}
