import { useId, useState } from "react";

export const playgroundMeta = {
  title: "Wow Checkbox",
  width: 520,
  height: 420,
};

export default function WowCheckBox() {
  const id = useId();
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-8 bg-[#161616] px-8 py-10 text-white">
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
        Experimental control
      </p>
      <label
        htmlFor={id}
        className="group flex cursor-pointer flex-col items-center gap-5"
      >
        <span
          className={`relative grid size-24 place-items-center rounded-[28px] border transition duration-300 ${
            checked
              ? "border-[#ff5b3e] bg-[#ff5b3e] shadow-[0_18px_50px_#ff5b3e66]"
              : "border-white/15 bg-white/5 group-hover:border-white/30"
          }`}
        >
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={() => setChecked((value) => !value)}
            className="sr-only"
          />
          <svg
            viewBox="0 0 32 32"
            className={`size-12 overflow-visible transition duration-300 ${checked ? "scale-100 opacity-100" : "scale-75 opacity-25"}`}
            aria-hidden="true"
          >
            <path
              d="M7 17.2 13.2 23 25 9.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3.4"
              style={{
                strokeDasharray: 32,
                strokeDashoffset: checked ? 0 : 32,
                transition: "stroke-dashoffset 420ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </svg>
        </span>
        <span className="font-heading text-2xl tracking-tight">
          {checked ? "Wow is on" : "Enable wow mode"}
        </span>
      </label>
      <p className="max-w-[18rem] text-center text-sm leading-relaxed text-white/50">
        A playground scratch file. Replace this, or add more files beside it, and
        they show up on the desktop.
      </p>
    </div>
  );
}
