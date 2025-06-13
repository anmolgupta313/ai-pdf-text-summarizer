"use client"
import React, { useEffect, useState } from "react";

const Animation = () => {
  const text = "Welcome to the summarizer";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text[currentIndex]);
      currentIndex++;
      if (currentIndex === text.length) {
        clearInterval(interval);
      }
    }, 100); // 100ms per character, adjust as needed

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-container">
      <span className="typed-text">{displayedText}</span>
      <span className="cursor" />
    </div>
  );
};

export default Animation;
