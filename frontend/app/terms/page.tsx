import LandingHeader from '@/src/components/landing/LandingHeader';
import Footer from '@/src/components/landing/Footer';
import PageHero from '@/src/components/public/PageHero';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
        <LandingHeader />
        
        <main>
            <PageHero 
                title="Terms of Service"
                description="Please read these terms carefully before using our service."
                badge="Legal"
            />

            <section className="max-w-4xl mx-auto px-6 pb-32">
                 <div className="p-8 md:p-16 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm">
                    
                    <div className="mb-12 border-b border-white/10 pb-6">
                        <p className="text-sm text-gray-500 font-mono">
                            Last Updated: February 9, 2026
                        </p>
                    </div>

                    <div className="space-y-12 text-gray-400">
                        {/* Section 1 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">1. Acceptance of Terms</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                By accessing or using Insydr ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Service. These terms apply to all visitors, users, and others who access or use the Service.
                            </p>
                        </div>

                        {/* Section 2 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">2. Accounts</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                            </p>
                            <p className="leading-relaxed text-justify text-lg">
                                You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
                            </p>
                        </div>

                        {/* Section 3 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">3. Use License</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                Permission is granted to temporarily access and use the Service for personal or internal business purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
                            </p>
                            <ul className="list-disc pl-6 space-y-3 text-lg marker:text-red-500">
                                <li className="pl-2 text-justify">Modify or copy the materials.</li>
                                <li className="pl-2 text-justify">Use the materials for any commercial purpose not authorized by your plan.</li>
                                <li className="pl-2 text-justify">Attempt to decompile or reverse engineer any software contained on the Service.</li>
                                <li className="pl-2 text-justify">Remove any copyright or other proprietary notations from the materials.</li>
                                <li className="pl-2 text-justify">Transfer the materials to another person or "mirror" the materials on any other server.</li>
                            </ul>
                        </div>

                        {/* Section 4 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">4. Service Availability</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                We strive to keep the Service available 24/7, but we cannot guarantee uninterrupted access. We reserve the right to suspend or terminate the Service at our discretion without notice for maintenance, upgrades, or security reasons.
                            </p>
                        </div>

                        {/* Section 5 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">5. Intellectual Property</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Insydr and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                            </p>
                        </div>

                        {/* Section 6 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">6. Limitation of Liability</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                In no event shall Insydr, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content.
                            </p>
                        </div>

                        {/* Section 7 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">7. Governing Law</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                These Terms shall be governed and construed in accordance with the laws of Delaware, United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                            </p>
                        </div>

                        {/* Section 8 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">8. Changes</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                            </p>
                        </div>

                        {/* Section 9 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">9. Contact Us</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                If you have any questions about these Terms, please contact us at <a href="mailto:legal@insydr.ai" className="text-red-500 hover:text-red-400 border-b border-red-500/30 pb-0.5 transition-colors">legal@insydr.ai</a>.
                            </p>
                        </div>

                    </div>
                </div>
            </section>
        </main>

        <Footer />
    </div>
  );
}
