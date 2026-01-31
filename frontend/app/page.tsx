import LandingHeader from '@/src/components/landing/LandingHeader';
import HeroSection from '@/src/components/landing/HeroSection';
import ProblemSection from '@/src/components/landing/ProblemSection';
import FeaturesSection from '@/src/components/landing/FeaturesSection';
import HowItWorksSection from '@/src/components/landing/HowItWorksSection';
import SocialProofSection from '@/src/components/landing/SocialProofSection';
import CTASection from '@/src/components/landing/CTASection';
import Footer from '@/src/components/landing/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
      <LandingHeader />
      
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SocialProofSection />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
}
