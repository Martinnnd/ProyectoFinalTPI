import styles from "./landing.module.css";
import DecadesSection from "../components/landing/DecadesSection";
import FinalCall from "../components/landing/FinalCall";
import Hero from "../components/landing/Hero";
import LandingFooter from "../components/landing/LandingFooter";
import LandingHeader from "../components/landing/LandingHeader";
import MemoryMapSection from "../components/landing/MemoryMapSection";
import StorySection from "../components/landing/StorySection";
import LandingAnimations from "../components/landing/animations/LandingAnimations";

export default function LandingPage() {
  return (
    <LandingAnimations>
      <div className={styles.heroShell} data-hero-shell>
        <div className={styles.heroMapBackdrop} data-hero-map aria-hidden="true" />
        <LandingHeader />
        <Hero />
      </div>
      <DecadesSection />
      <MemoryMapSection />
      <StorySection />
      <FinalCall />
      <LandingFooter />
    </LandingAnimations>
  );
}
