import Silk from "../specialComponents/Silk";
import PropTypes from "prop-types";
import TiltedCard from "../specialComponents/TiltedCard";

const HomeSection = () => {
  return (
    <section className="relative">
      <div className="SilkCanvas">
        <Silk
          speed={5}
          scale={0.85}
          color="#313131"
          noiseIntensity={0.5}
          rotation={30}
        />{" "}
      </div>

      <div className="h-screen w-screen fixed inset-0 flex flex-col md:flex-row items-center justify-center z-10 gap-4 md:gap-12">
        <TiltedCard
          imageSrc="https://i.ibb.co/nsyMrFYq/My-Profile.png"
          altText="Insert Profile Picture"
          captionText="SakutaTHZ"
          containerHeight="300px"
          containerWidth="300px"
          imageHeight="300px"
          imageWidth="300px"
          rotateAmplitude={15}
          scaleOnHover={1.1}
          showMobileWarning={false}
          showTooltip={true}
          displayOverlayContent={true}
          overlayContent={
            <p className="tilted-card-demo-text">Thar Htet Zan</p>
          }
        />
        <div className="flex flex-col justify-start items-start gap-2">
          <p>HI! My Name is</p>
          <span className="text-4xl font-bold">THAR HTET ZAN</span> 
        </div>
      </div>
    </section>
  );
};
HomeSection.propTypes = {
  isNavOpen: PropTypes.bool.isRequired,
  openNav: PropTypes.func,
};

export default HomeSection;
