import LandingHeader from '@/src/components/landing/LandingHeader';
import Footer from '@/src/components/landing/Footer';
import CTASection from '@/src/components/landing/CTASection';
import PageHero from '@/src/components/public/PageHero';
import UseCaseGrid from '@/src/components/public/UseCaseGrid';
import DetailedUseCase from '@/src/components/public/DetailedUseCase';

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
        <LandingHeader />
        
        <main>
            <PageHero 
                title="Built for Every Team"
                description="From customer support to sales, see how different teams use Insydr to automate workflows and drive results."
                badge="Use Cases"
            />

            <UseCaseGrid />

            <div className="py-10">
                <DetailedUseCase 
                    title="Customer Support Automation"
                    workflow={[
                        "User arrives with a technical question about API integration.",
                        "Insydr recognizes the intent and searches the technical documentation.",
                        "It provides a precise answer with code snippets and links to the docs.",
                        "If the user is still stuck, it offers to escalate to a human engineer."
                    ]}
                    outcomes={[
                        "90% Deflection Rate",
                        "< 1s Response Time",
                        "24/7 Availability",
                        "Consistent Answers"
                    ]}
                    example={`User: "How do I authenticate with the API?"\n\nInsydr: "To authenticate, you need to include your API key in the header of your request. Here's an example in curl:\n\ncurl -H 'Authorization: Bearer YOUR_API_KEY' https://api.insydr.ai/v1/agents\n\nYou can generate an API key in your dashboard settings."`}
                />

                <DetailedUseCase 
                    title="Sales Qualification & Scheduling"
                    reversed
                    workflow={[
                        "Visitor lands on pricing page and lingers for more than 30 seconds.",
                        "Insydr proactively engages: 'Hi! I see you're looking at our Business plan. Do you have questions about the enterprise features?'",
                        "It qualifies the lead by asking about team size and budget.",
                        "If qualified, it checks the sales rep's calendar and books a meeting instantly."
                    ]}
                    outcomes={[
                        "3x More Leads",
                        "Automated Qualification",
                        "Instant Scheduling",
                        "Higher Conversion"
                    ]}
                     example={`Insydr: "Hi there! 👋 Are you looking to implement AI agents for your support team?"\n\nVisitor: "Yes, we have about 15 agents and we're drowning in tickets."\n\nInsydr: "I understand. For a team of that size, our Business Plan automates about 70% of Tier 1 queries. Would you like to see a quick demo of how it handles support tickets?"\n\nVisitor: "Sure."\n\nInsydr: "Great! Pick a time that works for you..."`}
                />
            </div>

            <CTASection />
        </main>

        <Footer />
    </div>
  );
}
