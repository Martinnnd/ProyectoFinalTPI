import HeroExperience from "../components/landing/HeroExperience";
import DecadesSection from "../components/landing/DecadesSection";
import FinalCall from "../components/landing/FinalCall";
import LandingFooter from "../components/landing/LandingFooter";
import MemoryMapSection from "../components/landing/MemoryMapSection";
import StorySection from "../components/landing/StorySection";
import LandingAnimations from "../components/landing/animations/LandingAnimations";

export default function LandingPage() {
  return (
    <LandingAnimations>
      <HeroExperience />
      <DecadesSection />
      <MemoryMapSection />
      <StorySection />
      <FinalCall />
      <LandingFooter />
    </LandingAnimations>
  );
}
