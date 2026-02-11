import LandingHeader from '@/src/components/landing/LandingHeader';
import Footer from '@/src/components/landing/Footer';
import PageHero from '@/src/components/public/PageHero';
import Roadmap from '@/src/components/public/Roadmap';
import ContactSection from '@/src/components/public/ContactSection';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
        <LandingHeader />
        
        <main>
            <PageHero 
                title="Democratizing AI for Everyone"
                description="We believe that powerful AI tools shouldn't be reserved for tech giants. We're building Insydr to give every business an autonomous workforce."
                badge="Our Mission"
            />

            <section className="py-20 max-w-4xl mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Why Insydr Exists</h2>
                        <div className="space-y-4 text-gray-400 leading-relaxed">
                            <p>
                                The internet is full of static websites that force users to hunt for information. We believe the future of the web is conversational.
                            </p>
                            <p>
                                Businesses leave millions on the table because they can't respond to every visitor instantly. Hiring human teams 24/7 is expensive and unscalable.
                            </p>
                            <p>
                                Insydr bridges this gap by providing an intelligent, tireless, and charming AI agent that represents your brand perfectly, every time.
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                         <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full opacity-50" />
                         <div className="relative bg-white/5 border border-white/10 p-8 rounded-2xl">
                            <div className="text-4xl font-bold text-white mb-2">24/7</div>
                            <div className="text-sm text-gray-500 mb-8">Availability</div>
                            
                            <div className="text-4xl font-bold text-white mb-2">&lt; 1s</div>
                            <div className="text-sm text-gray-500 mb-8">Response Time</div>
                            
                            <div className="text-4xl font-bold text-white mb-2">100%</div>
                            <div className="text-sm text-gray-500">Scalability</div>
                         </div>
                    </div>
                </div>
            </section>

            <Roadmap />
            <ContactSection />
        </main>

        <Footer />
    </div>
  );
}
