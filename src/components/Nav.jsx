import { useState } from "react";
import ThemeToggleButton from "./ThemeToggleButton";
import RollText from "./RollText";

const Nav = ({ customClass }) => {

  return (
    <nav className={`fixed flex w-screen justify-between items-center px-6 md:px-64 py-3 ${customClass}`}>
      <RollText customClass={`text-xl font-semibold`} text={'SakutaTHZ'}/>
      <ThemeToggleButton/>
    </nav>
  );
};

export default Nav;
