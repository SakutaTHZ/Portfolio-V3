import Silk from "../specialComponents/Silk";
import PropTypes from "prop-types";
import TiltedCard from "../specialComponents/TiltedCard";
import useIsMobile from "../hooks/useIsMobile";
import CurvedLoop from "../specialComponents/CurvedLoop";
import image from "../images/profile.jpg";
import useRandomQuote from "../hooks/useRandomQuotes";
import ShinyText from "../specialComponents/ShinyText";
import SplitText from "../specialComponents/SplitText";
import { useEffect } from "react";
import BlurText from "../specialComponents/BlurText";
import Magnet from "../specialComponents/Magnet";
import { BsArrowUpRight } from "react-icons/bs";
import StarBorder from "../specialComponents/StarBorder";

const HomeSection = () => {
  const isMobile = useIsMobile();
  const profileCardSize = isMobile ? "320px" : "250px";
  const { quote, refreshQuote } = useRandomQuote();

  useEffect(() => {
    refreshQuote();
  }, [refreshQuote]);

  return (
    <section className="relative w-screen h-screen overflow-hidden">
      <div className="SilkCanvas">
        <Silk
          speed={5}
          scale={0.85}
          color="#313131"
          noiseIntensity={0.5}
          rotation={30}
        />{" "}
      </div>

      <CurvedLoop
        marqueeText={quote}
        speed={3}
        curveAmount={500}
        direction="left"
        interactive={true}
        className="custom-text-style"
      />

      <div className="h-screen w-screen fixed inset-0 flex flex-col md:flex-row items-center justify-center z-10 gap-4 md:gap-12">
        <TiltedCard
          imageSrc={image}
          altText="Insert Profile Picture"
          captionText="SakutaTHZ"
          containerHeight={profileCardSize}
          containerWidth={profileCardSize}
          imageHeight={profileCardSize}
          imageWidth={profileCardSize}
          rotateAmplitude={15}
          scaleOnHover={1.1}
          showMobileWarning={false}
          showTooltip={true}
          displayOverlayContent={true}
          overlayContent={<p className="tilted-card-demo-text">SakutaTHZ</p>}
        />
        <div className="flex flex-col justify-start items-start gap-2">
          <ShinyText
            text="HI! My Name is"
            disabled={false}
            speed={3}
            className="custom-class"
          />
          <SplitText
            text="THAR HTET ZAN"
            className="text-4xl md:text-5xl font-bold"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
          />
          <BlurText
            text="I am a Software Developer mainly focusing on UI/UX and frontend developement because I love creating interesting Concepts and Ideas. I have also done projects with backend coding too"
            delay={150}
            animateBy="words"
            direction="top"
            className="max-w-80 md:max-w-96"
          />
          <Magnet padding={50} disabled={false} magnetStrength={5}>
            <StarBorder
              as="button"
              className="custom-class mt-2"
              color="cyan"
              speed="5s"
            >
              <button className="border border-gray-700 p-2 px-4 rounded-full h-fit flex items-center gap-2 backdrop-blur-md bg-[#00000040]">
                Come I&lsquo;ll tell you more <BsArrowUpRight />
              </button>
            </StarBorder>
          </Magnet>
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
