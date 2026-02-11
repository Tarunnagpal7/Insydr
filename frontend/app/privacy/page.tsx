import LandingHeader from '@/src/components/landing/LandingHeader';
import Footer from '@/src/components/landing/Footer';
import PageHero from '@/src/components/public/PageHero';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
        <LandingHeader />
        
        <main>
            <PageHero 
                title="Privacy Policy"
                description="We care about your privacy. Here is how we handle your data."
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
                            <h3 className="text-2xl font-bold text-white">1. Introduction</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                Insydr ("we", "our", or "us") provides this Privacy Policy to explain our practices regarding the collection, use, and disclosure of information that we receive when you use our services. By accessing or using our Service, you agree to the terms of this Privacy Policy. We are committed to protecting your personal information and your right to privacy.
                            </p>
                        </div>

                        {/* Section 2 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">2. Information We Collect</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                We collect several types of information to provide and improve our Service to you. This includes information you provide directly to us and information we collect automatically.
                            </p>
                            <ul className="list-disc pl-6 space-y-3 text-lg marker:text-red-500">
                                <li className="pl-2"><strong className="text-white">Account Information:</strong> When you register, we collect your name, email address, password, and company information to set up your workspace.</li>
                                <li className="pl-2"><strong className="text-white">Payment Information:</strong> We use third-party processors (like Stripe) for payments. We do not store your full credit card information on our servers.</li>
                                <li className="pl-2"><strong className="text-white">Usage Data:</strong> We automatically collect data on how you interact with our Service, including IP addresses, browser types, and pages visited, to help us optimize the user experience.</li>
                                <li className="pl-2"><strong className="text-white">Customer Data:</strong> Data you upload or provide to your AI agents (e.g., knowledge base documents, chat logs) is processed solely to provide the Service to you.</li>
                            </ul>
                        </div>

                        {/* Section 3 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">3. How We Use Your Information</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                We use the collected data for various purposes driven by our commitment to providing a top-tier service:
                            </p>
                            <ul className="list-disc pl-6 space-y-3 text-lg marker:text-red-500">
                                <li className="pl-2 text-justify">To provide, operate, and maintain the Service effectively.</li>
                                <li className="pl-2 text-justify">To notify you about changes, updates, or new features of our Service.</li>
                                <li className="pl-2 text-justify">To provide customer support and respond to your requests.</li>
                                <li className="pl-2 text-justify">To detect, prevent, and address technical issues or security breaches.</li>
                                <li className="pl-2 text-justify">To monitor the usage of the Service and analyze trends to improve our offering.</li>
                            </ul>
                        </div>

                        {/* Section 4 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">4. Data Sharing & Disclosure</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                We respects your data usage. We do not sell your personal data. We may share your information only in the following circumstances:
                            </p>
                            <ul className="list-disc pl-6 space-y-3 text-lg marker:text-red-500">
                                <li className="pl-2"><strong className="text-white">Service Providers:</strong> Third-party companies that help us operate our Service (e.g., cloud hosting, analytics, email delivery).</li>
                                <li className="pl-2"><strong className="text-white">Legal Requirements:</strong> If required by law or in response to valid requests by public authorities (e.g., a court or a government agency).</li>
                                <li className="pl-2"><strong className="text-white">Business Transfers:</strong> In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                            </ul>
                        </div>

                        {/* Section 5 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">5. Data Security</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                The security of your data is important to us. We use commercially reasonable physical, administrative, and technical safeguards to preserve the integrity and security of all information we collect and share. This includes encryption of data in transit and at rest. However, no security system is impenetrable, and we cannot guarantee the security of our systems 100%.
                            </p>
                        </div>

                        {/* Section 6 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">6. Your Rights</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                Depending on your location (e.g., GDPR in Europe, CCPA in California), you may have rights regarding your personal data, including the right to access, correct, delete, or restrict its use. Please contact us if you wish to exercise any of these rights.
                            </p>
                        </div>

                        {/* Section 7 */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white">7. Contact Us</h3>
                            <p className="leading-relaxed text-justify text-lg">
                                If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@insydr.ai" className="text-red-500 hover:text-red-400 border-b border-red-500/30 pb-0.5 transition-colors">privacy@insydr.ai</a>.
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
