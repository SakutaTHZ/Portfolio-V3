import { useCallback, useState } from "react";
import PageTemplate from "./pages/PageTemplate";
import Hero from "./components/Hero";
import Preloader from "./components/Preloader";
import PortfolioTerminal from "./components/PortfolioTerminal";
import SectionTimeline from "./components/SectionTimeline";
import SiteSections from "./components/SiteSections";
import { prefersReducedMotion, useSoftSnap } from "./hooks/hooks";

export default function App() {
  useSoftSnap();
  const [ready, setReady] = useState(() =>
    typeof window !== "undefined" ? prefersReducedMotion() : false
  );
  const finish = useCallback(() => setReady(true), []);

  return (
    <PageTemplate ready={ready}>
      {!ready && <Preloader onDone={finish} />}
      <Hero ready={ready} />
      <SiteSections />
      {ready && <PortfolioTerminal />}
      {ready && <SectionTimeline />}
      <section id="projects" className="relative flex min-h-[100dvh] items-end px-[7%] py-24">
        <h2 className="text-5xl md:text-7xl">Projects</h2>
      </section>
      <section id="timeline" className="relative flex min-h-[100dvh] items-end px-[7%] py-24">
        <h2 className="text-5xl md:text-7xl">Timeline</h2>
      </section>
      <section id="contact" className="relative flex min-h-[100dvh] items-end px-[7%] py-24">
        <h2 className="text-5xl md:text-7xl">Contact</h2>
      </section>
    </PageTemplate>
  );
}
