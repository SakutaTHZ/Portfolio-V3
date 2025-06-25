import "./App.css";
import HomeSection from "./layout/HomeSection";
import Compactibility from "./pages/Compactibility";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SplashCursor from "../src/specialComponents/SplashCursor";

import InfiniteMenu from "../src/specialComponents/InfiniteMenu";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const navItems = [
  {
    image: "https://comicbook.com/wp-content/uploads/sites/4/2025/03/Wuthering-Waves-2.2-Uupdate-Banner.jpg",
    link: "https://google.com/",
    title: "Home",
    description: "A Brief Introduction",
  },
  {
    image: "https://picsum.photos/400/400?grayscale",
    link: "https://google.com/",
    title: "Item 2",
    description: "This is pretty cool, right?",
  },
  {
    image: "https://picsum.photos/500/500?grayscale",
    link: "https://google.com/",
    title: "Item 3",
    description: "This is pretty cool, right?",
  },
  {
    image: "https://picsum.photos/600/600?grayscale",
    link: "https://google.com/",
    title: "Item 4",
    description: "This is pretty cool, right?",
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
