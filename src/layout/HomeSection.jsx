import RollText from "../components/RollText";
import map from "../images/map.png";
import Nav from "../components/Nav";
import { BrowserView, MobileView } from "react-device-detect";

const HomeSection = () => {
  return (
    <>
      <Nav />
        <div className="h-screen w-screen px-64 py-20">
          <div className="grid h-full grid-cols-5 grid-rows-5 gap-4">
            <div className="glassBox flex items-end col-span-2 row-span-3">
              <div className="flex flex-col gap-4">
                <p className="text-base">Hi! My name is</p>
                <RollText
                  customClass={`text-5xl font-bold `}
                  gradient={false}
                  text={"Thar Htet Zan"}
                />
                <p className="text-sm"></p>
              </div>
            </div>
            <div className="glassBox relative col-span-2 col-start-1 row-start-4"></div>
            <div className="glassBox bg-black col-span-2 col-start-1 row-start-5">
              <p className="absolute z-20 text-sm text-right right-4 bottom-4 ">
                Currently in
                <RollText
                  customClass={`text-2xl font-bold`}
                  gradient={false}
                  text={"Yangon"}
                />
              </p>
            </div>
            <div className="glassBox col-span-2 row-span-5 col-start-3 row-start-1">
              <p>
                Hey! I'm a software developer 💻 passionate about UI/UX and
                front-end. I love bringing creative ideas to life. 😊 Let's
                build something amazing!
              </p>
            </div>
            <div className="glassBox row-span-2 col-start-5 row-start-1"></div>
            <div className="glassBox row-span-3 col-start-5 row-start-3"></div>
          </div>
        </div>
    </>
  );
};

export default HomeSection;
