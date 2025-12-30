import { useState } from "react";
import ClockOfClocks from "../../src/playground/ClockOfClocks";
import Balatro from "../../src/specialComponents/Balatro";

const Playground = () => {
  // State to track which component is "open"
  const [activeApp, setActiveApp] = useState(null);

  const closeApp = () => setActiveApp(null);

  return (
    <div className="relative w-full h-screen overflow-hidden text-white">
      {/* Background Layer */}
      <div className="fixed inset-0 -z-10">
        <Balatro isRotate={false} mouseInteraction={true} pixelFilter={700} />
      </div>

      {/* Main Desktop Interface */}
      {!activeApp && (
        <div className="flex flex-col items-center justify-center h-full px-4 gap-8 bg-black/20 backdrop-blur-sm">
          
          <div className="grid grid-cols-2 md:grid-cols-12 gap-2 p-4 rounded-2xl w-full max-w-5xl bg-white/50 backdrop-blur-md shadow-lg">
            {/* App Icon: Clock of Clocks */}
            <button 
              onClick={() => setActiveApp("clock")}
              className="flex flex-col items-center gap-2 group transition-transform hover:scale-105"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-blue-400">
                <span className="text-2xl">🕒</span>
              </div>
              <span className="text-sm font-medium">Clock of Clocks</span>
            </button>

            {/* App Icon: Clock of Clocks */}
            <button 
              onClick={() => setActiveApp("clock")}
              className="flex flex-col items-center gap-2 group transition-transform hover:scale-105"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-blue-400">
                <span className="text-2xl">🕒</span>
              </div>
              <span className="text-sm font-medium">Clock of Clocks</span>
            </button>

            {/* Add more icons here as you create more playground items */}
          </div>
        </div>
      )}

      {/* Full Screen "Window" Layer */}
      {activeApp && (
        <div className="fixed inset-0 z-50 flex flex-col animate-in fade-in zoom-in duration-300">
          {/* Window Header / Taskbar */}
          <div className="absolute bottom-0 z-[100] w-full h-12 bg-zinc-900 border-b border-white/10 flex items-center justify-between p-4">
            <span className="text-sm font-mono uppercase tracking-widest text-zinc-400">
              {activeApp === 'clock' ? 'Project: Clock_of_Clocks' : ''}
            </span>
            <button 
              onClick={closeApp}
              className="px-4 py-1 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white transition-colors rounded text-xs font-bold"
            >
              ESC / CLOSE
            </button>
          </div>

          {/* App Content Area */}
            {activeApp === "clock" && <ClockOfClocks />}
        </div>
      )}
    </div>
  );
};

export default Playground;