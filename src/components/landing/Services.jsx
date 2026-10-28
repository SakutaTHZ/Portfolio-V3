import Eyebrow from "./Eyebrow";

const services = [
  {
    index: "01",
    title: "Interface design",
    text: "Flows, screens, and prototypes in Figma, shaped around how a person actually moves through the product.",
  },
  {
    index: "02",
    title: "Product frontends",
    text: "The same intent carried into React, so the shipped interface matches the prototype instead of drifting away from it.",
  },
  {
    index: "03",
    title: "Design systems",
    text: "Responsive layouts and a coherent visual language for products that already exist and need a clearer system.",
  },
  {
    index: "04",
    title: "Mentoring",
    text: "Guiding junior developers through the work, the same way teaching made the hard part understandable.",
  },
];

export default function Services() {
  return (
    <section id="services" className="relative flex min-h-[100dvh] flex-col justify-center px-[7%] py-16">
      <Eyebrow>Services</Eyebrow>
      <h2 className="mt-4 max-w-xl text-5xl leading-[0.95] md:text-7xl">What I do</h2>
      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.index} className="rounded-2xl border border-[#333333] bg-[#161616]/80 p-7">
            <p className="text-sm text-[#ffd84d]">{service.index}</p>
            <h3 className="mt-4 text-2xl">{service.title}</h3>
            <p className="mt-3 max-w-md leading-relaxed text-[#a3a3a3]">{service.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
