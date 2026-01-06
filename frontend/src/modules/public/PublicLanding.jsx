import HeroSection from "./components/HeroSection.jsx";
import ProblemSection from "./components/ProblemSection.jsx";
import HowItWorksSection from "./components/HowItWorksSection.jsx";
import VerificationPowerSection from "./components/VerificationPowerSection.jsx";
import PublicCTASection from "./components/PublicCTASection.jsx";

export default function PublicLanding() {
  return (
    <div className="space-y-20">
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <VerificationPowerSection />
      <PublicCTASection />
    </div>
  );
}
