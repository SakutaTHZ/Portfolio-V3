const RollText = ({ customClass, text }) => {
    let letters = text.split("");
  
    return (
      <div className={`textContainer ${customClass}`}>
        {letters.map((letter, index) => (
          <span
            key={index}
            className="letter"
            data-letter={letter}
            style={{ transitionDelay: `${index * 0.05}s` }} // Set transition delay inline
          >
            {letter}
          </span>
        ))}
      </div>
    );
  };
  
  export default RollText;