const RollText = ({ customClass, text, gradient }) => {
  let letters = text.split("");
  let gradientColor = gradient
    ? `after:text-[var(--primary-color)] before:text-[var(--primary-color)]`
    : `after:text-[var(--text-color)] before:text-[var(--text-color)]`;

  return (
    <div className={`textContainer ${customClass}`}>
      {letters.map((letter, index) => (
        <span
          key={index}
          className={`letter ${gradientColor}`}
          data-letter={letter}
          style={{
            "--hue-rotate": `${index * 10}deg`,
            filter: "hue-rotate(var(--hue-rotate))",
            transitionDelay: `${index * 0.05}s`,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
};

export default RollText;
