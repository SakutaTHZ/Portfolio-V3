import MagicBento from "../specialComponents/MagicBento";
import Silk from "./../specialComponents/Silk";

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
        <MagicBento
          textAutoHide={true}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={300}
          particleCount={12}
          glowColor="255, 255, 255, .5"
        />
      </div>
    </>
  );
};

export default AboutMe;
