import LandingHeader from '@/src/components/landing/LandingHeader';
import Footer from '@/src/components/landing/Footer';
import CTASection from '@/src/components/landing/CTASection';
import PageHero from '@/src/components/public/PageHero';
import FeatureSection from '@/src/components/public/FeatureSection';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
      <LandingHeader />
      
      <main>
        <PageHero 
          title="Platform Features"
          description="Everything you need to build, deploy, and manage powerful AI agents that drive revenue."
          badge="End-to-End Solution"
        />

        <FeatureSection 
          title="No-Code Agent Builder"
          description="Build sophisticated AI agents in minutes without writing a single line of code. Our intuitive drag-and-drop interface lets you define behaviors, personalities, and goals effortlessly."
          bullets={[
            "Visual drag-and-drop workflow editor",
            "Custom personality & tone settings",
            "Multi-step conversation flows",
            "Instant preview & testing playground"
          ]}
          gradient="from-blue-600/20 to-cyan-600/20"
        />

        <FeatureSection 
          title="Knowledge Base (RAG)"
          description="Train your AI on your own data. Upload documents, crawl websites, or connect to your existing knowledge base to give your agents context-aware intelligence."
          bullets={[
            "Support for PDF, DOCX, TXT, and Markdown",
            "Automatic website crawling & indexing",
            "Real-time vector embeddings",
            "Smart context retrieval for accurate answers"
          ]}
          reversed
          gradient="from-purple-600/20 to-pink-600/20"
        />

        <FeatureSection 
          title="Widget SDK & Embeds"
          description="Deploy your agent anywhere. Use our lightweight, highly customizable widget or integrate directly into your application using our powerful SDK."
          bullets={[
            "Lightweight JavaScript snippet (<20kb)",
            "Fully customizable UI/UX to match your brand",
            "React, Vue, and Angular component wrappers",
            "Event listeners and callbacks for deep integration"
          ]}
          gradient="from-amber-600/20 to-orange-600/20"
        />

        <FeatureSection 
          title="Advanced Analytics"
          description="Gain deep insights into your agent's performance. Track engagement, conversion rates, and user sentiment to continuously optimize your AI's effectiveness."
          bullets={[
            "Real-time conversation monitoring",
            "Sentiment analysis & topic clustering",
            "Conversion tracking & funnels",
            "Exportable reports & data visualization"
          ]}
          reversed
          gradient="from-emerald-600/20 to-teal-600/20"
        />

        <FeatureSection 
          title="API & Developer Tools"
          description="Built for developers, by developers. Access all platform capabilities programmatically through our robust REST API."
          bullets={[
            "Comprehensive REST API Documentation",
            "Webhooks for real-time events",
            "Manage agents, conversations, and data via API",
            "Sandbox environment for testing"
          ]}
          gradient="from-indigo-600/20 to-violet-600/20"
        />

        <FeatureSection 
          title="Enterprise-Grade Security"
          description="Your data security is our top priority. We adhere to strict security standards to ensure your information and your customers' data is protected."
          bullets={[
            "SOC 2 Type II Compliant (Coming Soon)",
            "GDPR & CCPA Ready",
            "Data encryption in transit and at rest",
            "Role-based access control (RBAC)"
          ]}
          reversed
          gradient="from-red-600/20 to-rose-600/20"
        />

        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
