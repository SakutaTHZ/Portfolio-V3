import Silk from "../specialComponents/Silk";
import { CgClose } from "react-icons/cg";
import { BiMenu } from "react-icons/bi";
import PropTypes from "prop-types";

const HomeSection = ({ isNavOpen,openNav }) => {

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

      <button className="fixed z-[100] top-4 right-4 h-fit" onClick={openNav}>
        {isNavOpen ? (
          <>
            <CgClose />
          </>
        ) : (
          <>
            <BiMenu />
          </>
        )}
      </button>
    </section>
  );
};
HomeSection.propTypes = {
  isNavOpen: PropTypes.bool.isRequired,
  openNav: PropTypes.func,
};

export default HomeSection;
