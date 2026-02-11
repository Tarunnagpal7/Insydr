'use client';

import { motion } from 'framer-motion';

const milestones = [
  {
    quarter: "Q1 2024",
    title: "Foundation",
    items: ["Core Agent Builder", "Basic RAG Support", "Web Widget v1"],
    status: "done" 
  },
  {
    quarter: "Q2 2024",
    title: "Expansion",
    items: ["Advanced Analytics Dashboard", "Slack & Discord Integration", "Function Calling"],
    status: "current"
  },
  {
    quarter: "Q3 2024",
    title: "Intelligence",
    items: ["Multi-Agent Orchestration", "Voice Mode", "Auto-Optimization"],
    status: "upcoming"
  },
  {
    quarter: "Q4 2024",
    title: "Ecosystem",
    items: ["Plugin Marketplace", "Enterprise SSO", "Custom LLM Fine-tuning"],
    status: "upcoming"
  }
];

export default function Roadmap() {
  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Product Roadmap</h2>
          <p className="text-gray-400">Our journey to build the most advanced AI agent platform.</p>
        </div>

        <div className="relative border-l border-white/10 ml-4 md:ml-0 md:pl-0 space-y-12">
          {milestones.map((milestone, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="md:flex gap-8 relative pl-8 md:pl-0"
            >
              <div className={`absolute -left-[5px] top-2 w-3 h-3 rounded-full border-2 ${
                  milestone.status === 'done' ? 'bg-green-500 border-green-500' :
                  milestone.status === 'current' ? 'bg-black border-red-500 animate-pulse' :
                  'bg-black border-gray-600'
              }`} />

              <div className="md:w-32 md:text-right shrink-0">
                <span className={`text-sm font-bold font-mono ${
                   milestone.status === 'current' ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {milestone.quarter}
                </span>
              </div>

              <div className="flex-1 pb-8 border-b border-white/5 last:border-0 md:pb-0">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    {milestone.title}
                    {milestone.status === 'current' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-500 border border-red-500/20 uppercase tracking-widest">
                            In Progress
                        </span>
                    )}
                </h3>
                <ul className="space-y-2">
                  {milestone.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <div className={`w-1.5 h-1.5 rounded-full ${milestone.status === 'done' ? 'bg-green-500/50' : 'bg-gray-600'}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
