import RollText from "../components/RollText";

const HomeSection = () => {
  return (
    <div className="h-screen w-screen px-64 py-20">
      <div className="grid h-full grid-cols-5 grid-rows-5 gap-4">
        <div className="glassBox flex items-end col-span-2 row-span-3">
            <div className="flex flex-col gap-4">
            <p className="text-base">Hi! My name is</p>
            <RollText customClass={`text-5xl font-bold`} text={'Thar Htet Zan'}/>
            </div>
        </div>
        <div className="glassBox col-span-2 col-start-1 row-start-4"></div>
        <div className="glassBox col-span-2 col-start-1 row-start-5"></div>
        <div className="glassBox col-span-2 row-span-5 col-start-3 row-start-1">
          
        </div>
        <div className="glassBox row-span-2 col-start-5 row-start-1"></div>
        <div className="glassBox row-span-3 col-start-5 row-start-3"></div>
      </div>
    </div>
  );
};

export default HomeSection;
