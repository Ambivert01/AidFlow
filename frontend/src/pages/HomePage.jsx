import Hero from "../components/public/Hero";
import Stats from "../components/public/Stats";
import HowItWorks from "../components/public/HowItWorks";
import FeatureHighlights from "../components/public/FeatureHighlights";
import CampaignPreview from "../components/public/CampaignPreview";
import AuditPreview from "../components/public/AuditPreview";
import CTASection from "../components/public/CTASection";

/**
 * Public Homepage
 * Entry gateway for AidFlow
 * Shows live transparency dashboard and onboarding CTAs
 */
export default function HomePage() {
  return (
    <div className="homepage">
      {/* Hero Section with main CTA */}
      <Hero />

      {/* Live Transparency Stats */}
      <Stats />

      {/* How It Works Flow */}
      <div id="how-it-works"><HowItWorks /></div>

      {/* Feature Highlights */}
      <FeatureHighlights />

      {/* Active Campaigns Preview */}
      <CampaignPreview />

      {/* Public Audit Trail Preview */}
      <AuditPreview />

      {/* Final CTA Section */}
      <CTASection />
    </div>
  );
}
