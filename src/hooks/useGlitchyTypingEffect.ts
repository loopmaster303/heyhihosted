
// src/hooks/useGlitchyTypingEffect.ts
"use client";
import { useState, useEffect } from "react";

export function useGlitchyTypingEffect(
  phases: string[],
  typingSpeed = 90,
  glitchPause = 800,
  loop = true,
  startDelay = 0 // Added startDelay
) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isCurrentPhaseFullyTyped, setIsCurrentPhaseFullyTyped] = useState(false);
  const [isDelayOver, setIsDelayOver] = useState(false);

  useEffect(() => {
    // Reset when phases or startDelay changes
    setCurrentPhaseIndex(0);
    setDisplayedText("");
    setIsCurrentPhaseFullyTyped(false);
    setIsDelayOver(false); // Reset delay flag

    if (startDelay > 0) {
      const timer = setTimeout(() => {
        setIsDelayOver(true);
      }, startDelay);
      return () => clearTimeout(timer);
    } else {
      setIsDelayOver(true); // No delay, proceed immediately
    }
  }, [phases, startDelay]); // Only react to phases and startDelay for initial setup

  useEffect(() => {
    if (!isDelayOver || !phases || phases.length === 0) {
      if (phases && phases.length > 0 && isDelayOver) { // Handle case where phases might be empty initially
         // If delay is over but no phases, mark as complete if appropriate
         if(phases.length === 0) setIsCurrentPhaseFullyTyped(true);
      } else if (!phases || phases.length === 0) {
        setIsCurrentPhaseFullyTyped(true); // No phases, nothing to type
      }
      return;
    }

    // Reset for the current phase
    setDisplayedText("");
    setIsCurrentPhaseFullyTyped(false);
    let charIndex = 0;
    const currentTargetText = phases[currentPhaseIndex % phases.length];

    const typeCharacterInterval = setInterval(() => {
      if (charIndex < currentTargetText.length) {
        setDisplayedText((prev) => prev + currentTargetText[charIndex]);
        charIndex++;
      } else {
        clearInterval(typeCharacterInterval);
        setIsCurrentPhaseFullyTyped(true);

        // Transition to next phase after glitchPause
        const phaseTransitionTimer = setTimeout(() => {
          if (loop) {
            setCurrentPhaseIndex((prevIdx) => (prevIdx + 1)); // Loop indefinitely by incrementing (modulo handles array bounds)
          } else if (currentPhaseIndex < phases.length - 1) {
            setCurrentPhaseIndex((prevIdx) => prevIdx + 1); // Go to next phase if not looping and not last phase
          }
          // If not looping and it's the last phase, it will just stay on the last phase, fully typed.
        }, glitchPause);
        return () => clearTimeout(phaseTransitionTimer); // Cleanup transition timer
      }
    }, typingSpeed);

    return () => clearInterval(typeCharacterInterval); // Cleanup typing interval
  }, [currentPhaseIndex, phases, typingSpeed, glitchPause, loop, isDelayOver]);

  return { text: displayedText, isTypingPhaseComplete: !isCurrentPhaseFullyTyped };
}
