import { useState } from "react";
import ThemeToggleButton from "./ThemeToggleButton";

const Nav = ({ customClass }) => {

  return (
    <nav className={`flex w-screen justify-between items-center px-12 py-3 ${customClass}`}>
      <p className="text-xl font-semibold">Thar Htet Zan</p>
      <ThemeToggleButton/>
    </nav>
  );
};

export default Nav;
