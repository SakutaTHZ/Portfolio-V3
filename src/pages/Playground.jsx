import ClockOfClocks from "../playground/clockOfClocks";

const Playground = () => {
  return (
    <div className="w-full h-full">
        {/* Introduction */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-16 gap-4">
        <h1 className="text-3xl font-bold">Welcome to the Playground Page!</h1>
        {/* Table of contents */}
        <div className="p-4 border rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Table of Contents</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <a href="#clockOfClocks">Clock of Clocks</a>
            </li>
          </ul>
        </div>
      </div>
        {/* Clock of Clocks Section */}
        <div id="clockOfClocks" className="min-h-screen flex flex-col items-center justify-center mt-16">
            <ClockOfClocks/>
        </div>
    </div>
  );
};

export default Playground;
