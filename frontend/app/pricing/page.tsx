import LandingHeader from '@/src/components/landing/LandingHeader';
import Footer from '@/src/components/landing/Footer';
import CTASection from '@/src/components/landing/CTASection';
import PageHero from '@/src/components/public/PageHero';
import PricingCards from '@/src/components/public/PricingCards';
import ComparisonTable from '@/src/components/public/ComparisonTable';
import FAQ from '@/src/components/public/FAQ';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
        <LandingHeader />
        
        <main>
            <PageHero 
                title="Simple, Transparent Pricing"
                description="Start for free, scale as you grow. No hidden fees."
                badge="Pricing"
            />

            <PricingCards />
            <ComparisonTable />
            <FAQ />
            <CTASection />
        </main>

        <Footer />
    </div>
  );
}
