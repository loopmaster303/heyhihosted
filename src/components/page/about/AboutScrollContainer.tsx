"use client";

import ScrollReveal from './ScrollReveal';
import AboutHero from './AboutHero';
import AboutWhatIs from './AboutWhatIs';
import AboutFeatures from './AboutFeatures';
import AboutHowTo from './AboutHowTo';
import AboutPrivacy from './AboutPrivacy';
import AboutFAQ from './AboutFAQ';
import AboutCTA from './AboutCTA';

export default function AboutScrollContainer() {
  return (
    <div className="w-full space-y-14 md:space-y-20 pb-14 md:pb-20">
      <ScrollReveal>
        <AboutHero />
      </ScrollReveal>
      <AboutWhatIs />
      <AboutFeatures />
      <AboutHowTo />
      <AboutPrivacy />
      <AboutFAQ />
      <AboutCTA />
    </div>
  );
}
