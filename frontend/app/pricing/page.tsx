import type { Metadata } from 'next';
import LandingHeader from '@/src/components/landing/LandingHeader';
import Footer from '@/src/components/landing/Footer';
import CTASection from '@/src/components/landing/CTASection';
import PageHero from '@/src/components/public/PageHero';
import PricingCards from '@/src/components/public/PricingCards';
import ComparisonTable from '@/src/components/public/ComparisonTable';
import AddOnsSection from '@/src/components/public/AddOnsSection';
import FAQ from '@/src/components/public/FAQ';

export const metadata: Metadata = {
  title: 'Pricing — Insydr.AI | AI Chatbot Platform for Indian Businesses',
  description: 'Affordable AI chatbot plans starting at ₹799/month. Build, train, and embed AI chatbots on your website. Free plan available. No hidden fees.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
        <LandingHeader />
        
        <main>
            <PageHero 
                title="Simple, Transparent Pricing"
                description="Plans designed for Indian businesses. Start free, scale as you grow. All prices in ₹ INR."
                badge="Pricing"
            />

            <PricingCards />
            <ComparisonTable />
            <AddOnsSection />
            <FAQ />
            <CTASection />
        </main>

        <Footer />
    </div>
  );
}
