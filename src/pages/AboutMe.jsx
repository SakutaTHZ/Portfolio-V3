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
      </div>
    </>
  );
};

export default AboutMe;
