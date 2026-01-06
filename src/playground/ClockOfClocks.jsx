import { useEffect } from "react";
import "./css/ClockOfClocks.css";

const angles = {
  ᒥ: [0, 90],
  ᒧ: [180, 270],
  L: [0, 270],
  ᒣ: [90, 180],
  "-": [0, 180],
  "|": [90, 270],
  " ": [135, 135],
};

const digits = {
  0: [
    "ᒥ","-","-","ᒣ",
    "|","ᒥ","ᒣ","|",
    "|","|","|","|",
    "|","|","|","|",
    "|","L","ᒧ","|",
    "L","-","-","ᒧ",
  ],
  1: [
    " ","ᒥ","-","ᒣ",
    " ","L","ᒣ","|",
    " "," ","|","|",
    " "," ","|","|",
    " "," ","|","|",
    " "," ","L","ᒧ",
  ],
  2: [
    "ᒥ","-","-","ᒣ",
    "L","-","ᒣ","|",
    "ᒥ","-","ᒧ","|",
    "|","ᒥ","-","ᒧ",
    "|","L","-","ᒣ",
    "L","-","-","ᒧ",
  ],
  3: [
    "ᒥ","-","-","ᒣ",
    "L","-","ᒣ","|",
    "ᒥ","-","ᒧ","|",
    "L","-","ᒣ","|",
    "ᒥ","-","ᒧ","|",
    "L","-","-","ᒧ",
  ],
  4: [
    "ᒥ","ᒣ","ᒥ","ᒣ",
    "|","|","|","|",
    "|","L","ᒧ","|",
    "L","-","ᒣ","|",
    " "," ","|","|",
    " "," ","L","ᒧ",
  ],
  5: [
    "ᒥ","-","-","ᒣ",
    "|","ᒥ","-","ᒧ",
    "|","L","-","ᒣ",
    "L","-","ᒣ","|",
    "ᒥ","-","ᒧ","|",
    "L","-","-","ᒧ",
  ],
  6: [
    "ᒥ","-","-","ᒣ",
    "|","ᒥ","-","ᒧ",
    "|","L","-","ᒣ",
    "|","ᒥ","ᒣ","|",
    "|","L","ᒧ","|",
    "L","-","-","ᒧ",
  ],
  7: [
    "ᒥ","-","-","ᒣ",
    "L","-","ᒣ","|",
    " "," ","|","|",
    " "," ","|","|",
    " "," ","|","|",
    " "," ","L","ᒧ",
  ],
  8: [
    "ᒥ","-","-","ᒣ",
    "|","ᒥ","ᒣ","|",
    "|","L","ᒧ","|",
    "|","ᒥ","ᒣ","|",
    "|","L","ᒧ","|",
    "L","-","-","ᒧ",
  ],
  9: [
    "ᒥ","-","-","ᒣ",
    "|","ᒥ","ᒣ","|",
    "|","L","ᒧ","|",
    "L","-","ᒣ","|",
    "ᒥ","-","ᒧ","|",
    "L","-","-","ᒧ",
  ],
};

const assignDigitAnglesToClocks = (digit,clockElement) => {
  const clockAngles = [];
  const digitClocks = digits[digit];

  for (const symbol of digitClocks) {
    const [angle1, angle2] = angles[symbol];
    clockAngles.push([angle1, angle2]);
  }

  clockElement.forEach((clock, index) => {
    const hands = clock.querySelectorAll(".hand");
    hands[0].style.transform = `rotate(${clockAngles[index][0]}deg)`;
    hands[1].style.transform = `rotate(${clockAngles[index][1]}deg)`;
  });

  return clockAngles;
};

const ClockOfClocks = () => {
  useEffect(() => {
    // This function runs the clock logic
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      const timeString = hours + minutes + seconds;

      const digitElements = document.querySelectorAll(".digit");
      
      // Safety check: if the elements aren't there, don't run
      if (digitElements.length === 0) return;

      timeString.split("").forEach((digit, index) => {
        const clocks = digitElements[index]?.querySelectorAll(".clock");
        if (clocks) {
          assignDigitAnglesToClocks(digit, clocks);
        }
      });
    };

    // 2. Start the interval
    const timerId = setInterval(updateClock, 1000);
    
    // Run it immediately once so we don't wait 1 second for the first tick
    updateClock();

    // 3. THE CLEANUP: This runs when the component is unmounted
    return () => {
      clearInterval(timerId);
    };
  }, []); // Empty array means this runs once on mount and cleans up on unmount

  return (
    <div className="w-full h-screen min-h-screen flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="clockofclocks items-center justify-center gap-4 grid grid-cols-2 md:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="digit" key={index}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="clock">
                <div className="hand"></div>
                <div className="hand"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClockOfClocks;
