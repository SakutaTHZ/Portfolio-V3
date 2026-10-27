import StaggeredMenu from "@/components/StaggeredMenu";
import GradientWaves from "../components/GradientWaves";

const menuItems = [
  { label: "Home", ariaLabel: "Go to the top", link: "#top" },
  { label: "About", ariaLabel: "About me", link: "#about" },
  { label: "Services", ariaLabel: "View services", link: "#services" },
  { label: "Projects", ariaLabel: "View projects", link: "#projects" },
  { label: "Timeline", ariaLabel: "View the timeline", link: "#timeline" },
  { label: "Testimonials", ariaLabel: "Read testimonials", link: "#testimonials" },
  { label: "Contact", ariaLabel: "Go to contact", link: "#contact" },
];

const socialItems = [
  { label: "GitHub", link: "https://github.com/SakutaTHZ" },
  { label: "Mail", link: "mailto:tharhtetzan@gmail.com" },
  { label: "LinkedIn", link: "https://www.linkedin.com" },
];

export default function PageTemplate({ children, ready = true }) {
  return (
    <main className="relative isolate min-h-svh text-foreground flex flex-col max-w-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <GradientWaves
          speed={0.5}
          amplitude={1.15}
          relief={1}
          lightAngle={150}
          mouseInteraction={false}
          swellOnClick={false}
          lightMode
          waveScale={0.68}
          waveRatio={0.9}
          swell={25}
          turbulence={23.5}
          tilt={64}
          zoom={1}
          height={2.3}
          fogDepth={13.5}
          sheen={0}
          brightness={0.68}
          opacity={1}
          grain={0.2}
          quality="low"
          intro
          parallaxStrength={0.5}
          mouseStrength={0.6}
          paused={false}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-40 max-h-screen max-w-screen min-h-screen h-dvh overflow-hidden">
        <StaggeredMenu
          navReady={ready}
          position="right"
          items={menuItems}
          socialItems={socialItems}
          displaySocials
          displayItemNumbering={true}
          menuButtonColor="#ffffff"
          openMenuButtonColor="#fff"
          changeMenuColorOnOpen={true}
          colors={["var(--surface)", "var(--accent)"]}
          logoUrl="/path-to-your-logo.svg"
          accentColor="var(--accent)"
          onMenuOpen={() => console.log("Menu opened")}
          onMenuClose={() => console.log("Menu closed")}
        />
      </div>
      {children}
    </main>
  );
}
