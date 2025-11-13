import LogoLoop from "../specialComponents/LogoLoop";
import Silk from "./../specialComponents/Silk";
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
} from "react-icons/si";

const techLogos = [
  { node: <SiReact />, title: "React", href: "https://react.dev" },
  { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
  {
    node: <SiTypescript />,
    title: "TypeScript",
    href: "https://www.typescriptlang.org",
  },
  {
    node: <SiTailwindcss />,
    title: "Tailwind CSS",
    href: "https://tailwindcss.com",
  },
];

const AboutMe = () => {
  return (
    <>
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 sm:py-24 lg:py-32">
        <div className="space-y-4">
          <h1>HI, Im Thar Htet Zan</h1>
          <p>UI/UX Designer, Frontend Developer</p>

          <hr className="border " />

          <p>
            Im a passionate web developer with experience in creating dynamic
            and user-friendly websites and applications. I love coding and
            continuously learning new technologies to enhance my skills.
          </p>

          <h2>What I can do</h2>
          <ul className="list-disc list-outside ml-5">
            <li>Responsive Web Design</li>
            <li>JavaScript, React, HTML, CSS</li>
            <li>UI/UX Design Principles</li>
            <li>Version Control with Git</li>
          </ul>

          <LogoLoop
            logos={techLogos}
            speed={120}
            direction="left"
            logoHeight={48}
            gap={40}
            hoverSpeed={0}
            scaleOnHover
            fadeOut
            fadeOutColor="#ffffff20"
            ariaLabel="Technology partners"
          />

          <h2>What Im working on Now</h2>
          <div className="max-w-lg border-l-4 border-blue-500 pl-4">
            <p>
              Currently, Im focused on building a portfolio website to showcase
              my projects and skills. Im also exploring advanced React
              techniques and improving my UI/UX design abilities.
            </p>
          </div>

          <hr className="border " />

          <h2>My Journey</h2>
          <ul className="list-disc list-outside ml-5">
            <li>Grew up in Myanmar</li>
            <li>Studied Computer Science hated coding</li>
            <li>Discovered passion for web development</li>
            <li>Self-taught through online resources and projects</li>
            <li>
              Dropped out of university to pursue web development full-time
            </li>
            <li>Continuously learning and improving my skills</li>
          </ul>

          <hr className="border " />

          <h2>My Kind of Fun</h2>
          <ul className="list-disc list-outside ml-5">
            <li>
              I love creating new web experiences and exploring innovative
              design ideas.
            </li>
            <li>
              In my free time, I enjoy listening to music, sleeping, and playing
              video games.
            </li>
          </ul>
        </div>
      </div>

      <div className="SilkCanvas fixed inset-0 -z-10">
        <Silk
          speed={5}
          scale={0.85}
          color="#313131"
          noiseIntensity={0.5}
          rotation={30}
        />{" "}
      </div>
    </>
  );
};

export default AboutMe;
