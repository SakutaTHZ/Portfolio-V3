import { useCallback, useState } from "react";
import PageTemplate from "./pages/PageTemplate";
import Preloader from "./components/Preloader";
import PortfolioTerminal from "./components/PortfolioTerminal";
import GatoJumpscare from "./components/GatoJumpscare";
import SectionTimeline from "./components/SectionTimeline";
import Hero from "./components/landing/Hero";
import About from "./components/landing/About";
import Services from "./components/landing/Services";
import Testimonials from "./components/landing/Testimonials";
import Projects from "./components/landing/Projects";
import Timeline from "./components/landing/Timeline";
import Contact from "./components/landing/Contact";
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
      <About />
      <Services />
      <Testimonials />
      {ready && <PortfolioTerminal />}
      {ready && <GatoJumpscare />}
      {ready && <SectionTimeline />}
      <Projects />
      <Timeline />
      <Contact />
    </PageTemplate>
  );
}
