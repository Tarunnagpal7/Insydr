'use client';

import { motion } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  CurrencyDollarIcon, 
  BookOpenIcon, 
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

const useCases = [
  {
    title: "Customer Support",
    icon: ChatBubbleLeftRightIcon,
    problem: "Support teams are overwhelmed with repetitive queries, leading to slow response times and burnt-out agents.",
    solution: "Insydr automates 80% of Tier 1 support tickets instantly, 24/7.",
    benefits: ["24/7 Availability", "Instant Response Time", "Reduced Support Costs"],
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "Sales Assistant",
    icon: CurrencyDollarIcon,
    problem: "Leads visit your site and leave without engaging because no one is there to answer their questions immediately.",
    solution: "Insydr engages visitors proactively, qualifies them, and books meetings for your sales team.",
    benefits: ["Increased Conversion", "Qualified Pipeline", "Automated Scheduling"],
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    title: "Internal Knowledge Bot",
    icon: BookOpenIcon,
    problem: "Employees waste hours searching for documents or asking colleagues for information that exists in the wiki.",
    solution: "A private Insydr agent trained on your internal docs answers employee questions instantly on Slack or Teams.",
    benefits: ["Productivity Boost", "Instant Knowledge Access", "Reduced Onboarding Time"],
    gradient: "from-purple-500 to-pink-500"
  },
  {
    title: "FAQ Bot",
    icon: QuestionMarkCircleIcon,
    problem: "Customers keep asking the same simple questions that are already in your FAQ, but they don't read it.",
    solution: "Turn your static FAQ page into an interactive conversational agent that guides users to the right answer.",
    benefits: ["Better UX", "Zero Maintenance", "Always Up-to-Date"],
    gradient: "from-amber-500 to-orange-500"
  }
];

export default function UseCaseGrid() {
  return (
    <section className="py-20 bg-black/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-purple-900/10 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl mb-6 flex items-center justify-center bg-gradient-to-br ${useCase.gradient} bg-opacity-10 text-white shadow-lg`}>
                  <useCase.icon className="h-6 w-6" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4">{useCase.title}</h3>
                
                <div className="mb-6 space-y-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Problem</span>
                    <p className="text-sm text-gray-400 mt-1">{useCase.problem}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Solution</span>
                    <p className="text-sm text-gray-300 mt-1">{useCase.solution}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {useCase.benefits.map((benefit, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
