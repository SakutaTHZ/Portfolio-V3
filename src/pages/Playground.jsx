import { useState } from "react";
import ClockOfClocks from "../../src/playground/ClockOfClocks";
import Balatro from "../../src/specialComponents/Balatro";
import FancyBlock from "../playground/FancyBlock";
import PlaygroundApp from "../playground/PlaygroundApp";

// Apps data here...
const apps = [
  {
    id: "clock",
    name: "Clock of Clocks",
    icon: "🕒",
    description: "A mesmerizing clock display.",
  },
  {
    id: "fancyBlock",
    name: "Fancy Block",
    icon: "💬",
    description: "A stylish block component.",
  },
];

const Playground = () => {
  // State to track which component is "open"
  const [activeApp, setActiveApp] = useState(null);

  const [filteredApps, setFilteredApps] = useState(apps);

  const closeApp = () => setActiveApp(null);

  return (
    <div className="relative w-full h-screen overflow-hidden text-white">
      {/* Background Layer */}
      <div className="fixed inset-0 -z-10">
        <Balatro isRotate={false} mouseInteraction={true} pixelFilter={700} />
      </div>

      {/* Main Desktop Interface */}
      {!activeApp && (
        <div className="flex flex-col items-center justify-center h-full px-4 gap-2 bg-black/20 backdrop-blur-sm">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-2 p-4 rounded-2xl w-full translate-y-8 md:translate-y-0 max-w-5xl max-h-[85vh] md:max-h-[80vh] overflow-y-auto justify-center md:justify-start items-center md:items-start bg-white/10 backdrop-blur-xl shadow-lg">
            {filteredApps.map((app) => (
              <div
                className="w-20 flex flex-col items-center cursor-pointer"
                key={app.id}
                onClick={() => setActiveApp(app.id)}
              >
                <button className="flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors w-16 h-16">
                  <span className="text-4xl">{app.icon}</span>
                </button>

                <span className="block w-full mt-2 text-center text-xs font-mono uppercase tracking-widest text-white truncate">
                  {app.name}
                </span>
              </div>
            ))}
          </div>

          {/* Search box for the apps */}
          <div className="w-full max-w-5xl translate-y-8 md:translate-y-0">
            <input
              type="text"
              placeholder="Search apps..."
              className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border-0 placeholder-white/30 text-white focus:outline-none"
              onChange={(e) => {
                const query = e.target.value.toLowerCase();
                setFilteredApps(
                  apps.filter((app) => app.name.toLowerCase().includes(query)),
                );
              }}
            />
          </div>
        </div>
      )}

      {/* Full Screen "Window" Layer */}
      {activeApp && (
        <div className="fixed inset-0 z-50 flex flex-col animate-fadeIn duration-300">
          {/* Window Header / Taskbar */}
          <PlaygroundApp appData={apps.find((a) => a.id === activeApp)} closeApp={closeApp} />

          {/* App Content Area */}
          {activeApp === "clock" && <ClockOfClocks />}
          {activeApp === "fancyBlock" && <FancyBlock />}
        </div>
      )}
    </div>
  );
};

export default Playground;
