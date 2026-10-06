import styles from "./landing.module.css";
import DecadesSection from "../components/landing/DecadesSection";
import FinalCall from "../components/landing/FinalCall";
import Hero from "../components/landing/Hero";
import LandingFooter from "../components/landing/LandingFooter";
import LandingHeader from "../components/landing/LandingHeader";
import MemoryMapSection from "../components/landing/MemoryMapSection";
import StorySection from "../components/landing/StorySection";

export default function LandingPage() {
  return (
    <main className={styles.landing}>
      <div className={styles.heroShell}>
        <LandingHeader />
        <Hero />
      </div>
      <MemoryMapSection />
      <DecadesSection />
      <StorySection />
      <FinalCall />
      <LandingFooter />
    </main>
  );
}
