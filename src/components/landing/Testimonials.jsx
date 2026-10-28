import Eyebrow from "./Eyebrow";

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative flex min-h-[100dvh] flex-col justify-center px-[7%] py-16">
      <Eyebrow>Testimonials</Eyebrow>
      <h2 className="mt-4 max-w-xl text-5xl leading-[0.95] md:text-7xl">What people say</h2>
      <div className="mt-14 rounded-2xl border border-dashed border-[#333333] bg-[#161616]/50 px-7 py-12 md:px-10">
        <p className="max-w-lg text-lg leading-relaxed text-[#a3a3a3]">
          Notes from clients and collaborators will live here. None have been added yet.
        </p>
      </div>
    </section>
  );
}
