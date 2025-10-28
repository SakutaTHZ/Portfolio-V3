import '../index.css';
import PropTypes from 'prop-types';

const ShinyText = ({ text, disabled = false, speed = 5, className = '' }) => {
  const animationDuration = `${speed}s`;

  return (
    <div className={`shiny-text ${disabled ? 'disabled' : ''} ${className}`} style={{ animationDuration }}>
      {text}
    </div>
  );
};

ShinyText.propTypes = {
  text: PropTypes.string,
  disabled: PropTypes.bool,
  speed: PropTypes.number,
  className: PropTypes.string,
};

export default ShinyText;