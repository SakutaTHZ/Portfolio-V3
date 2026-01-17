import { useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CgClose } from "react-icons/cg";
import { BiMenu } from "react-icons/bi";
import { RiSettings2Line } from "react-icons/ri";

// 1. LAZY LOAD ROUTE COMPONENTS
const Compactibility = lazy(() => import("./pages/Compactibility"));
const AboutMe = lazy(() => import("./pages/AboutMe"));
// HomeSection is kept as a direct import if it is small and essential for the main page
import HomeSection from "./layout/HomeSection";
import Playground from "../src/pages/Playground";

// 2. LAZY LOAD THE COMPLEX MENU COMPONENT
const InfiniteMenu = lazy(() => import("./specialComponents/InfiniteMenu"));

// 3. IMAGE IMPORTS (Assuming these are handled by a bundler for optimization)
import homeImg from "../src/images/Home.png";
import aboutMeImg from "../src/images/Me.png";
import projectsImg from "../src/images/Projects.png";
import contactImg from "../src/images/Contact.png";
import playgroundImg from "../src/images/Icons/playground.png";
import SettingsSection from "./layout/SettingsSection";
import statesChecker from "./js/statesChecker";

const navItems = [
  {
    image: homeImg,
    link: "/",
    title: "Home",
    description: "A Brief Introduction",
  },
  {
    image: aboutMeImg,
    link: "/About",
    title: "About Me",
    description: "Who is Sakuta?",
  },
  {
    image: projectsImg,
    link: "https://google.com/",
    title: "My Works",
    description: "Here Are Some of My Projects",
  },
  {
    image: contactImg,
    link: "https://google.com/",
    title: "Contact Me",
    description: "Take a call if you are interested.",
  },
  {
    image: playgroundImg,
    link: "/Playground",
    title: "Playground",
    description: "A place to experiment and test.",
  },
];

// Fallback component for when a component is loading
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full text-lg font-semibold">
    Loading...
  </div>
);

function App() {
  statesChecker();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const openNav = () => setIsNavOpen(!isNavOpen);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const openSettings = () => setIsSettingsOpen(!isSettingsOpen);

  return (
    <Router>
      {/* --- Navigation and Settings Buttons --- */}
      <button
        className={`fixed z-[100] top-4 right-4 h-fit p-2 rounded-full shadow-md backdrop-blur-md ${
          isNavOpen ? "bg-red-500 text-white" : "bg-[#ffffff50] text-black"
        } ${isSettingsOpen && "-translate-y-12 opacity-0"} transition-all`}
        onClick={openNav}
      >
        {isNavOpen ? <CgClose /> : <BiMenu />}
      </button>

      <button
        className={`fixed z-[100] top-4 left-4 h-fit p-2 rounded-full shadow-md backdrop-blur-md ${
          isSettingsOpen ? "bg-red-500 text-white" : "bg-[#ffffff50] text-black"
        } ${isNavOpen && "-translate-y-12 opacity-0"} transition-all`}
        onClick={openSettings}
      >
        {isSettingsOpen ? <CgClose /> : <RiSettings2Line />}
      </button>

      {/* --- Conditionally Rendered Menus (Code Splitting applied) --- */}
      <AnimatePresence>
        {isNavOpen && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              scale: { duration: 0.4, ease: [0.6, -0.28, 0.735, 0.045] },
              opacity: {
                duration: 0.5,
                ease: [0.6, -0.28, 0.735, 0.045],
                delay: 0.1,
              },
            }}
            style={{ height: "100dvh", width: "100%", position: "fixed" }}
            className="Menu z-[99]"
          >
            <Suspense fallback={null}>
              <InfiniteMenu
                items={navItems}
                closeMenu={() => setIsNavOpen(false)}
              />
            </Suspense>
          </motion.div>
        )}

        {isSettingsOpen && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, translateX: "-100%" }}
            animate={{ opacity: 1, translateX: "0%" }}
            exit={{ opacity: 0 }}
            transition={{
              translateX: { duration: 0.4, ease: [0.6, -0.28, 0.735, 0.045] },
              opacity: {
                duration: 0.5,
                ease: [0.6, -0.28, 0.735, 0.045],
                delay: 0.1,
              },
            }}
            style={{ height: "100dvh", position: "fixed" }}
            className="Menu z-[99] w-full"
          >
            <SettingsSection />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Main Routing (Code Splitting applied) --- */}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/"
            element={<HomeSection isNavOpen={isNavOpen} openNav={openNav} />}
          />
          {/* 5. Routes that load components only when visited */}
          <Route path="/ComCheck" element={<Compactibility />} />
          <Route path="/About" element={<AboutMe />} />
          <Route path="/Playground" element={<Playground />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
