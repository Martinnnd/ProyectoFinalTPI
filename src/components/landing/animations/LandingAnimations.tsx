"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "../../../app/landing.module.css";
import { animateHero } from "./heroAnimation";
import { animateMemoryMap } from "./mapAnimation";
import { animateLandingSections } from "./sectionsAnimation";

type LandingAnimationsProps = {
  children: ReactNode;
};

gsap.registerPlugin(ScrollTrigger);

export default function LandingAnimations({ children }: LandingAnimationsProps) {
  const landingRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        {
          reducedMotion: "(prefers-reduced-motion: reduce)",
          mobile: "(max-width: 560px)",
          desktop: "(min-width: 561px)",
        },
        (mediaContext: any) => {
          const { reducedMotion, mobile } = mediaContext.conditions as {
            reducedMotion: boolean;
            mobile: boolean;
            desktop: boolean;
          };

          if (reducedMotion) return;

          animateHero({ mobile });
          animateMemoryMap({ mobile });
          animateLandingSections({ mobile });
        },
      );
    }, landingRef);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  return (
    <main ref={landingRef} className={styles.landing}>
      {children}
    </main>
  );
}
