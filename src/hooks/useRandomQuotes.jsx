import { useState, useCallback } from "react";

function useRandomQuote() {
  const getRandomQuote = useCallback(() => {
    const quotes = [
      "You only live once, but if you do it right, once is enough.",
      "Creativity is knowing how to hide your sources.",
      "It’s no use going back to yesterday, because I was a different person then.",
      "Women and cats will do as they please, and men and dogs should relax and get used to the idea.",
      "A day without sunshine is like, you know, night.",
    ];
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }, []);

  const [quote, setQuote] = useState(getRandomQuote);

  const refreshQuote = useCallback(() => {
    setQuote(getRandomQuote());
  }, [getRandomQuote]);

  return { quote, refreshQuote };
}

export default useRandomQuote;
