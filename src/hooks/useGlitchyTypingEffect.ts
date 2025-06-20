
"use client";
import { useState, useEffect } from "react";

export function useGlitchyTypingEffect(
  phases: string[],        // Array of strings, each is a phase
  typingSpeed = 90,    // Speed of typing characters
  glitchPause = 800,   // Pause after a phase is typed before moving to next
  loop = true,           // Whether to loop through phases
  startDelay = 0       // Delay before the effect starts
) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false); // Is a character being typed right now?
  const [isDelaying, setIsDelaying] = useState(startDelay > 0); // Is the initial startDelay active?

  useEffect(() => {
    // Reset all states when phases or startDelay fundamentally change
    setCurrentPhaseIndex(0);
    setDisplayedText("");
    setIsTyping(false);
    setIsDelaying(startDelay > 0);

    if (startDelay > 0) {
      const delayTimer = setTimeout(() => {
        setIsDelaying(false);
      }, startDelay);
      return () => clearTimeout(delayTimer);
    }
  }, [phases, startDelay]); // Only react to phases array identity or startDelay value change

  useEffect(() => {
    if (isDelaying || !phases || phases.length === 0) {
      if (!isDelaying && (!phases || phases.length === 0)) {
        setIsTyping(false); // No phases to type after delay
      }
      return;
    }

    // Current phase logic
    const targetText = phases[currentPhaseIndex % phases.length];
    if (!targetText && phases.length > 0) { // Should ideally not happen if phases is valid
        setIsTyping(false);
        return;
    }
    if (!targetText && phases.length === 0) { // No text if no phases
        setIsTyping(false);
        setDisplayedText("");
        return;
    }


    setDisplayedText(""); // Reset text for the new phase
    setIsTyping(true);    // Start typing
    let charIndex = 0;

    const typingInterval = setInterval(() => {
      if (charIndex < targetText.length) {
        setDisplayedText(targetText.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval); // Typing of current phase complete
        setIsTyping(false); // No longer actively typing characters

        // Pause before next phase or end
        const pauseTimer = setTimeout(() => {
          if (loop) {
            setCurrentPhaseIndex(prevIdx => prevIdx + 1); // Loop to next phase
          } else if (currentPhaseIndex < phases.length - 1) {
            setCurrentPhaseIndex(prevIdx => prevIdx + 1); // Go to next phase (non-looping)
          }
          // If not looping and it's the last phase, it stays here. isTyping remains false.
        }, glitchPause);
        // No explicit cleanup for pauseTimer here as it's self-contained and triggers state change
      }
    }, typingSpeed);

    return () => {
      clearInterval(typingInterval);
      // No need to clear pauseTimer here as it's short-lived and its effect (state change) will trigger new effect runs
    };
  }, [currentPhaseIndex, phases, typingSpeed, glitchPause, loop, isDelaying]);

  // For the cursor: true if delay is active OR if (delay is over AND we are actively typing characters)
  const showCursor = isDelaying || (!isDelaying && isTyping);

  return {
    text: displayedText,
    isTypingPhaseComplete: !showCursor // If cursor is shown, phase is not complete. If cursor hidden, phase is complete/paused.
                                      // This matches the expectation of page.tsx: currentPhaseNotYetTyped
  };
}
