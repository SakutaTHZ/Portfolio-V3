import "./App.css";
import HomeSection from "./layout/HomeSection";
import Compactibility from "./pages/Compactibility";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SplashCursor from "../src/specialComponents/SplashCursor";

import InfiniteMenu from "../src/specialComponents/InfiniteMenu";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { CgClose } from "react-icons/cg";
import { BiMenu } from "react-icons/bi";

const navItems = [
  {
    image: "../src/images/rabbit.jpg",
    link: "https://google.com/",
    title: "Home",
    description: "A Brief Introduction",
  },
  {
    image: "../src/images/doggo.jpg",
    link: "https://google.com/",
    title: "About Me",
    description: "Who is Sakuta?",
  },
  {
    image: "../src/images/cat.jpg",
    link: "https://google.com/",
    title: "My Works",
    description: "Here Are Some of My Projects",
  },
  {
    image: "../src/images/mouse.jpg",
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
      <SplashCursor />

      <button className="fixed z-[100] top-4 right-4 h-fit bg-[#ffffff50] p-2 rounded-full text-black shadow-md backdrop-blur-md" onClick={openNav}>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
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
        </Routes>
      </Router>
    </>
  );
}

export default App;
