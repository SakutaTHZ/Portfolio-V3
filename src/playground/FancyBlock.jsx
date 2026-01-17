import { useState } from "react";

const FancyBlock = () => {
  const [openTab, setOpenTab] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 py-8 gap-8 bg-gradient-to-tr from-gray-900 via-gray-700 to-gray-800">
      <div className="p-4 bg-white rounded-2xl shadow-lg w-full h-full flex">
        <div className="relative w-full text-black">
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setOpenTab(!openTab)}
              className={`relative w-24 md:w-32 bg-white border !border-gray-300 px-4 py-2 rounded-md transition-all duration-200 font-medium ${
                openTab
                  ? "md:rounded-b-none md:border-b-0 z-20"
                  : "hover:bg-gray-50"
              }`}
            >
              Filters
              {openTab && (
                <>
                  <span className="hidden md:block absolute -bottom-[1px] -left-[1px] w-[1px] h-2 !bg-gray-300 translate-y-full" />
                  <span className="hidden md:block absolute -bottom-[1px] -right-[1px] w-[1px] h-2 !bg-gray-300 translate-y-full" />
                  <span className="hidden md:block absolute -bottom-2 left-0 right-0 h-[2px] bg-white z-30" />
                </>
              )}
            </button>

            <input
              type="text"
              placeholder="Search For Data..."
              className="flex-1 px-2 w-full rounded-md border !border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div
            className={`
              absolute top-12 left-0 w-full bg-white p-4 shadow-sm border !border-gray-300 transition-all duration-400 origin-top
              ${
                openTab
                  ? "opacity-100 scale-y-100 scale-x-100 visible md:rounded-b-md md:rounded-tr-md"
                  : "opacity-0 scale-y-0 scale-x-0 invisible"
              }
            `}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FancyBlock;
