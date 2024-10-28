import { useState } from "react";

const ThemeToggleButton = () => {
  const [theme, setTheme] = useState("dark-mode");

  function toggleTheme() {
    const newTheme = theme === "dark-mode" ? "light-mode" : "dark-mode";
    setTheme(newTheme);

    const root = document.documentElement;
    root.classList.remove(theme);
    root.classList.add(newTheme);
    setLightMode(newTheme);
  }

  function setLightMode(theme) {
    const lightBulb = document.querySelector(".lightBulb");
    lightBulb.classList.toggle('dark')

    if (theme === "light-mode") {
      lightBulb.innerHTML = "";

      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const ray = document.createElement("div");
          ray.classList.add("ray");

          const angle = i * (360 / 8);
          ray.style.transform = `scaleY(1) rotate(${angle}deg) translateY(-150%)`;

          lightBulb.append(ray);

          setTimeout(() => {
            ray.style.opacity = 1;
          }, 0);
        }, i * 100);
      }
    } else {
      const rays = document.querySelectorAll(".ray");
      rays.forEach((ray, i) => {
        setTimeout(() => {
          ray.style.opacity = 0;
          setTimeout(() => {
            if (ray) ray.remove();
          }, 200);
        }, i * 100);
      });
    }
  }

  return (
    <button className="checkButton" onClick={toggleTheme}>
      <div className="lightBulb dark flex justify-center items-center"></div>
    </button>
  );
};

export default ThemeToggleButton;
