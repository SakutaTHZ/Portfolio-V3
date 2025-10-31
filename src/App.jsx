import "./App.css";
import HomeSection from "./layout/HomeSection";
import Compactibility from "./pages/Compactibility";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import aboutMeImg from "./images/Me.png";
import contactImg from "./images/Contact.png";
import projectsImg from "./images/Projects.png";
import homeImg from "./images/Home.png";

import InfiniteMenu from "./specialComponents/InfiniteMenu";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { CgClose } from "react-icons/cg";
import { BiMenu } from "react-icons/bi";
import AboutMe from "./pages/AboutMe";

const siteUrl = import.meta.env.VITE_BASE_URL;

const navItems = [
  {
    image: homeImg,
    link: `${siteUrl}`,
    title: "Home",
    description: "A Brief Introduction",
  },
  {
    image: aboutMeImg,
    link: `${siteUrl}/About`,
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
];

function App() {

  const [isNavOpen, setIsNavOpen] = useState(false);
  const openNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <>

      <button
        className={`fixed z-[100] top-4 right-4 h-fit p-2 rounded-full shadow-md backdrop-blur-md ${
          isNavOpen ? "bg-red-500 text-white" : "bg-[#ffffff50] text-black"
        } transition-all`}
        onClick={openNav}
      >
        {isNavOpen ? (
          <>
            <CgClose />
          </>
        ) : (
          <>
            <BiMenu />
          </>
        )}
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
            <InfiniteMenu items={navItems} />
          </motion.div>
        )}
      </AnimatePresence>

      <Router>
        <Routes>
          {/* Define routes */}
          <Route
            path="/"
            element={<HomeSection isNavOpen={isNavOpen} openNav={openNav} />}
          />
          <Route path="/ComCheck" element={<Compactibility />} />
          <Route path="/About" element={<AboutMe />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
