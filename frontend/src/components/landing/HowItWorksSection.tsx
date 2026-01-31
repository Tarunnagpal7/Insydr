'use client';

export default function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Connect Your Source",
      desc: "Add your website URL or upload documents. Insydr scrapes and learns your content automatically."
    },
    {
      num: "02",
      title: "Customize Your Agent",
      desc: "Set the tone, goals, and specific conversion triggers for your AI capabilities."
    },
    {
      num: "03",
      title: "Embed & Convert",
      desc: "Copy a simple code snippet to your site. Watch as visitors turn into qualified leads."
    }
  ];

  return (
    <section className="py-24 bg-black/20 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Live in Minutes, Not Months
          </h2>
          <p className="text-lg text-gray-400">
            No complex coding. No long implementation cycles. Just results.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

          {steps.map((step, idx) => (
            <div key={idx} className="relative pt-8 text-center">
              {/* Number Bubble */}
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-red-500/30 flex items-center justify-center text-xl font-bold text-white mx-auto mb-6 relative z-10 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                {step.num}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-gray-400 max-w-sm mx-auto">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
