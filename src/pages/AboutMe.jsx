import Silk from "./../specialComponents/Silk";
import { Button } from 'primereact/button';

const AboutMe = () => {
  return (
    <>
      <div className="SilkCanvas">
        <Silk
          speed={5}
          scale={0.85}
          color="#313131"
          noiseIntensity={0.5}
          rotation={30}
        />{" "}
      </div>

      <div className="w-screen h-screen flex justify-center items-start md:items-center">
        <Button label="About Me Page" className="p-button-lg p-button-outlined" />
      </div>
    </>
  );
};

export default AboutMe;
