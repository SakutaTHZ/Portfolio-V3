import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import InfiniteMenu from "./specialComponents/InfiniteMenu";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { CgClose } from "react-icons/cg";
import { BiMenu } from "react-icons/bi";

import HomeSection from "./layout/HomeSection";
import Compactibility from "./pages/Compactibility";
import AboutMe from "./pages/AboutMe";

import homeImg from "./images/Home.png";
import aboutMeImg from "./images/Me.png";
import projectsImg from "./images/Projects.png";
import contactImg from "./images/Contact.png";
import { RiSettings2Line } from "react-icons/ri";

const navItems = [
  { image: homeImg, link: "/", title: "Home", description: "A Brief Introduction" },
  { image: aboutMeImg, link: "/About", title: "About Me", description: "Who is Sakuta?" },
  { image: projectsImg, link: "https://google.com/", title: "My Works", description: "Here Are Some of My Projects" },
  { image: contactImg, link: "https://google.com/", title: "Contact Me", description: "Take a call if you are interested." },
];

function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const openNav = () => setIsNavOpen(!isNavOpen);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const openSettings = () => setIsSettingsOpen(!isSettingsOpen);

  return (
    <Router>
      {/* ✅ Router now wraps everything */}
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
          isNavOpen ? "bg-red-500 text-white" : "bg-[#ffffff50] text-black"
        } ${isNavOpen && "-translate-y-12 opacity-0"} transition-all`}
        onClick={openSettings}
      >
        {isSettingsOpen ? <CgClose /> : <RiSettings2Line />}
      </button>

      <AnimatePresence>
        {isNavOpen && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              scale: { duration: 0.4, ease: [0.6, -0.28, 0.735, 0.045] },
              opacity: { duration: 0.5, ease: [0.6, -0.28, 0.735, 0.045], delay: 0.1 },
            }}
            style={{ height: "100dvh", width: "100%", position: "fixed" }}
            className="Menu z-[99]"
          >
            <InfiniteMenu items={navItems} closeMenu={() => setIsNavOpen(false)}/>
          </motion.div>
        )}
        {isSettingsOpen && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, translateX: "-100%"}}
            animate={{ opacity: 1, translateX: "0%"}}
            exit={{ opacity: 0 }}
            transition={{
              translateX: { duration: 0.4, ease: [0.6, -0.28, 0.735, 0.045] },
              opacity: { duration: 0.5, ease: [0.6, -0.28, 0.735, 0.045], delay: 0.1 },
            }}
            style={{ height: "100dvh", width: "100%", position: "fixed" }}
            className="Menu z-[99]"
          >
            <div className="h-full w-full backdrop-blur-md bg-[#00000050] flex items-center justify-center">
              {/* Languages Setting */}
              <h1 className="text-2xl font-bold">Settings Coming Soon...</h1>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Routes>
        <Route path="/" element={<HomeSection isNavOpen={isNavOpen} openNav={openNav} />} />
        <Route path="/ComCheck" element={<Compactibility />} />
        <Route path="/About" element={<AboutMe />} />
      </Routes>
    </Router>
  );
}

export default App;
