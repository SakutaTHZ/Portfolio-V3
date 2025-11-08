//import Silk from "../specialComponents/Silk";
import PropTypes from "prop-types";
import TiltedCard from "../specialComponents/TiltedCard";
import useIsMobile from "../hooks/useIsMobile";
import image from "../images/profile.jpg";
import ShinyText from "../specialComponents/ShinyText";
import SplitText from "../specialComponents/SplitText";
import BlurText from "../specialComponents/BlurText";
import Magnet from "../specialComponents/Magnet";
import { BsArrowUpRight } from "react-icons/bs";
import StarBorder from "../specialComponents/StarBorder";
import CardSwap, { Card } from "../specialComponents/CardSwap";
import LightRays from "../specialComponents/LightRays";

import tcg from "../images/Projects/GameScreen.png";
import ShikaTypo from "../images/Projects/ShikaTypo.png";
import zlot from "../images/Projects/Zlot.png";
import nt from "../images/Projects/NT.png";
import recruiza from "../images/Projects/Recruiza.png";
import SplashCursor from "./../specialComponents/SplashCursor";

import { useTranslation} from "react-i18next";

const HomeSection = () => {
  const { t } = useTranslation();
  const animationOn= JSON.parse(localStorage.getItem("animationState"));

  const isMobile = useIsMobile();
  const profileCardSize = isMobile ? "320px" : "250px";

  return (
    <section className="relative w-screen h-screen overflow-hidden">
      {animationOn && <SplashCursor/>}

      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1.5}
          lightSpread={2}
          rayLength={1}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="custom-rays animate-fadeIn"
        />
      </div>

      <div className="h-[600px] md:h-[600px] absolute right-12 md:right-0 -bottom-32 md:-bottom-16  md:scale-100 z-50">
        <CardSwap
          cardDistance={isMobile ? 150 : 150}
          verticalDistance={isMobile ? 180 : 150}
          delay={5000}
          pauseOnHover={true}
        >
          <Card>
            <h3 className="text-2xl font-bold">Recruiza</h3>
            <p>Recruitement Management System</p>
            <img src={recruiza} className="mt-4" />
          </Card>
          <Card>
            <h3 className="text-2xl font-bold">NT Lyric n Chord</h3>
            <p>Lyics App for Myanmar Songs</p>
            <img src={nt} className="mt-4" />
          </Card>
          <Card>
            <h3 className="text-2xl font-bold">ShikaTypo</h3>
            <p>A Typing Simulator Gamified</p>
            <img src={ShikaTypo} className="mt-4" />
          </Card>
          <Card>
            <h3 className="text-2xl font-bold">Project-T</h3>
            <p>A Personal TCG Game (In Development)</p>
            <img src={tcg} className="mt-4" />
          </Card>
          <Card>
            <h3 className="text-2xl font-bold">ZLOT</h3>
            <p>Slot Game why not</p>
            <img src={zlot} className="mt-4" />
          </Card>
        </CardSwap>
      </div>

      <div className="h-screen w-screen fixed inset-0 flex flex-col md:flex-row items-center justify-center gap-4 p-4 md:gap-12 z-50">
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
            text={t("HomeSection.hiMyNameIs")}
            disabled={false}
            speed={3}
            className="custom-class"
          />
          <SplitText
            text={t("HomeSection.name")}
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
            text={t("HomeSection.description")}
            delay={150}
            animateBy="words"
            direction="top"
            className="max-w-80 md:max-w-96"
          />
          <Magnet padding={50} magnetStrength={5} disabled={animationOn ? false : true}>
            <StarBorder
              as="button"
              className="custom-class mt-2"
              color="cyan"
              speed="5s"
            >
              <div className=" p-2 px-4 rounded-full w-full h-fit flex items-center gap-2 backdrop-blur-md bg-[#00000040]">
                {t("HomeSection.comeIllTellYouMore")} <BsArrowUpRight />
              </div>
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
