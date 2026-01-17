import { BiInfoCircle } from "react-icons/bi";
import propTypes from "prop-types";

const PlaygroundApp = ({appData,closeApp}) => {
    return (
        <>
          {/* Window Header / Taskbar */}
          <div className="absolute bottom-0 z-[100] w-full h-12 bg-zinc-900 border-b border-white/10 flex items-center justify-between p-4">
            <span className="text-sm font-mono uppercase tracking-widest text-white flex items-center gap-2">
              <button><BiInfoCircle/></button>
              <span className="text-sm font-mono uppercase tracking-widest text-white">
                {appData.name}
              </span>
            </span>
            <button
              onClick={closeApp}
              className="px-4 py-1 !bg-red-500 hover:!bg-red-700 text-red-500 hover:text-white transition-colors rounded text-xs font-bold"
            >
              ESC / CLOSE
            </button>
          </div>
        </>
    );
}

PlaygroundApp.propTypes = {
    appData:propTypes.shape({
        id:propTypes.string.isRequired,
        name:propTypes.string.isRequired,
        icon:propTypes.node,
        description:propTypes.string,
    }).isRequired,
    closeApp:propTypes.func.isRequired,
};

export default PlaygroundApp;