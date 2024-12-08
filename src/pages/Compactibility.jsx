import { useState } from "react";

const Compactibility = () => {
  const [result, setResult] = useState(0);
  const [spouseName, setSpouseName] = useState("");
  const [brideName, setBrideName] = useState("");

  const handleBrideNameChange = (event) => {
    setBrideName(event.target.value); // Update state with the input value
  };

  const handleSpouseNameChange = (event) => {
    setSpouseName(event.target.value); // Update state with the input value
  };

  const calculateCompactibility = () => {
    console.log(spouseName + " & " + brideName);

    const name = (spouseName + brideName).replace(/\s+/g, "").split("");
    const letterMap = new Map();

    // name.forEach((letter) => {
    //   letterMap.set(letter, (letterMap.get(letter) || 0) + 1);
    // });

    name.forEach(letter => {
        console.log(letter);
        if (letterMap.get(letter)) {
            let count = letterMap.get(letter);
            letterMap.delete(letter);
            letterMap.set(letter, count + 1); // Increment count correctly
        } else {
            letterMap.set(letter, 1);
        }
    });
    console.log(letterMap);

    const sizesString = [...letterMap.values()].join(""); // Join with a comma and space

    console.log(sizesString);

    setResult(reduceToTwoDigits(parseInt(sizesString)));
  };

  function reduceToTwoDigits(num) {
    while (num.toString().length > 2) {
      const digits = num.toString().split("").map(Number); // Convert number to an array of digits
      let newNumber = ""; // Initialize the new number as a string

      const length = digits.length;

      // Iterate through mirrored pairs
      for (let i = 0; i < Math.floor(length / 2); i++) {
        const left = digits[i]; // Left-side digit
        const right = digits[length - 1 - i]; // Right-side digit

        // Add the pair and append to the new number
        newNumber += (left + right).toString();

        console.log(newNumber);
      }

      // If the length is odd, add the middle digit to the end of the array
      if (length % 2 !== 0) {
        const mid = Math.floor(length / 2);
        newNumber += digits[mid]; // Add the middle digit at the end
      }

      console.log("New Num - " + newNumber);

      // Update the number for the next iteration
      num = parseInt(newNumber, 10);
    }

    return num;
  }

  return (
    <section className="p-24 h-screen flex flex-col md:flex-row gap-4">
      <div className="border flex flex-col justify-center w-full p-5 gap-5">
        <h1 className="text-4xl font-bold mb-4">Compactibility Checker</h1>
        <div className="flex gap-2 items-center">
          <p className="w-1/4">Spouse Name : </p>
          <input
            type="text"
            className="px-5 w-full text-back bg-transparent py-2 border border-gray-500 rounded-md"
            id="spouseName"
            onChange={handleSpouseNameChange}
            value={spouseName}
          />
        </div>
        <div className="flex gap-2 items-center">
          <p className="w-1/4">Bride Name : </p>
          <input
            type="text"
            className="px-5 w-full text-back bg-transparent py-2 border border-gray-500 rounded-md"
            id="brideName"
            onChange={handleBrideNameChange}
            value={brideName}
          />
        </div>
        <button
          className="bg-yellow-300 py-5 rounded-md text-black font-bold"
          onClick={calculateCompactibility}
        >
          Calculate
        </button>

        <div className="flex justify-between w-full gap-5">
          <h1 className="text-2xl font-bold">Compacitbility</h1>
          <p className="result w-32 aspect-square bg-yellow-300 border rounded-full flex items-center justify-center text-4xl text-black font-bold">
            {result}
            <span className="text-sm">%</span>
          </p>
        </div>
      </div>
    </section>
  );
};
export default Compactibility;
