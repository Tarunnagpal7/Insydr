'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  CpuChipIcon, 
  BoltIcon, 
  PresentationChartLineIcon,
  CalendarDaysIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: "AI Sales Agent",
    description: "A 24/7 sales rep that knows your product inside out and handles objections instantly. It never sleeps, never takes a break, and always follows up.",
    icon: ChatBubbleLeftRightIcon,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20"
  },
  {
    name: "Smart Knowledge Base",
    description: "Upload docs, PDFs, or URLs. The AI learns your business context in minutes. It updates automatically as your content changes.",
    icon: DocumentArrowUpIcon,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20"
  },
  {
    name: "Lead Scoring & Routing",
    description: "Automatically qualify leads based on conversation intent and budget. Route high-value prospects directly to your human sales team's Slack or CRM.",
    icon: PresentationChartLineIcon,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20"
  },
  {
    name: "Conversation Analytics",
    description: "Uncover hidden insights from visitor chats. See what questions are being asked most often and where visitors are dropping off.",
    icon: CpuChipIcon,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20"
  },
  {
    name: "Instant Meeting Booking",
    description: "Connect your calendar (Google/Outlook) and let AI schedule demos with qualified leads directly in the chat, without the back-and-forth emails.",
    icon: CalendarDaysIcon,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    border: "border-pink-400/20"
  },
];

const FeatureVisual = ({ title, color }: { title: string, color: string }) => {
  // 1. AI Sales Agent Visual
  if (title === "AI Sales Agent") {
    return (
      <div className="w-full h-full p-8 flex items-center justify-center">
        <div className="w-full max-w-sm bg-[#0A0A0B] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 text-xs text-gray-500">Live Chat</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-700 shrink-0" />
              <div className="bg-white/10 rounded-lg rounded-tl-none p-3 text-xs text-gray-300">
                Is this enterprise ready?
              </div>
            </div>
            <div className="flex gap-2 flex-row-reverse">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">AI</div>
              <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg rounded-tr-none p-3 text-xs text-blue-100">
                Yes! We offer SSO, SOC2 compliance, and dedicated support for enterprise teams.
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-700 shrink-0" />
              <div className="bg-white/10 rounded-lg rounded-tl-none p-3 text-xs text-gray-300">
                Perfect, can we book a demo?
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Smart Knowledge Base Visual
  if (title === "Smart Knowledge Base") {
    return (
      <div className="w-full h-full p-8 flex items-center justify-center">
        <div className="w-full max-w-sm bg-[#0A0A0B] border border-white/10 rounded-xl shadow-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400">knowledge_base</span>
            <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div className="space-y-2">
            {[
              { name: "pricing_tier_2024.pdf", size: "2.4 MB", status: "Learned" },
              { name: "api_documentation.md", size: "145 KB", status: "Learned" },
              { name: "company_handbook.docx", size: "1.1 MB", status: "Processing..." }
            ].map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <DocumentArrowUpIcon className="h-4 w-4 text-purple-400" />
                  <div>
                    <div className="text-xs text-gray-200">{file.name}</div>
                    <div className="text-[10px] text-gray-500">{file.size}</div>
                  </div>
                </div>
                {file.status === "Processing..." ? (
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Lead Scoring Visual
  if (title === "Lead Scoring & Routing") {
    return (
      <div className="w-full h-full p-8 flex items-center justify-center">
        <div className="w-full max-w-sm space-y-3">
          {/* Lead Card */}
          <div className="bg-[#0A0A0B] border border-white/10 rounded-xl p-4 shadow-xl">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500" />
                <div>
                  <div className="text-sm font-bold text-white">Sarah Miller</div>
                  <div className="text-xs text-gray-400">VP of Engineering</div>
                </div>
              </div>
              <div className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                98/100
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[98%]" />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Budget Confirmed</span>
                <span>Ready to Buy</span>
              </div>
            </div>
          </div>
          
          {/* Slack Notification */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-3 flex items-start gap-3 transform translate-x-4">
            <div className="w-6 h-6 rounded bg-[#E01E5A] flex items-center justify-center shrink-0">
              <BoltIcon className="h-3 w-3 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-white mb-0.5">New Hot Lead 🔥</div>
              <div className="text-[10px] text-gray-400">Sarah M. just booked a demo. Routing to @sales-team</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Analytics Visual
  if (title === "Conversation Analytics") {
    return (
      <div className="w-full h-full p-8 flex items-center justify-center">
        <div className="w-full max-w-sm bg-[#0A0A0B] border border-white/10 rounded-xl shadow-2xl p-4">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs font-bold text-gray-300">Conversation Topics</h4>
            <div className="text-[10px] text-gray-500">Last 7 Days</div>
          </div>
          <div className="space-y-4">
            {[
              { label: "Pricing Questions", val: 75, col: "bg-amber-500" },
              { label: "Integration Support", val: 45, col: "bg-blue-500" },
              { label: "Feature Requests", val: 30, col: "bg-purple-500" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{item.label}</span>
                  <span>{item.val}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full">
                  <div className={`h-full rounded-full ${item.col}`} style={{ width: `${item.val}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 flex gap-4">
            <div className="flex-1 text-center border-r border-white/5">
              <div className="text-lg font-bold text-white">2.4m</div>
              <div className="text-[10px] text-gray-500">Messages</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-lg font-bold text-green-400">+12%</div>
              <div className="text-[10px] text-gray-500">Conversion</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Meeting Visual
  if (title === "Instant Meeting Booking") {
    return (
      <div className="w-full h-full p-8 flex items-center justify-center">
        <div className="w-full max-w-sm bg-[#0A0A0B] border border-white/10 rounded-xl shadow-2xl p-4">
          <div className="text-center mb-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-pink-500/20 flex items-center justify-center mb-2">
              <CalendarDaysIcon className="h-5 w-5 text-pink-500" />
            </div>
            <h4 className="text-sm font-bold text-white">Book a Demo</h4>
            <p className="text-xs text-gray-500">Select a time with Sarah</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['Mon', 'Tue', 'Wed'].map((d) => (
              <div key={d} className="text-center p-2 bg-white/5 rounded-lg border border-white/5">
                <div className="text-[10px] text-gray-400 mb-1">{d}</div>
                <div className="text-xs font-bold text-white">24</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {['9:00 AM', '10:30 AM', '2:00 PM'].map((t, i) => (
              <div key={t} className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer ${i === 1 ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
                <span>{t}</span>
                {i === 1 && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent" />;
};

const Card = ({ title, description, icon: Icon, color, bg, border, index, progress, range, targetScale }: any) => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start end', 'start start']
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [2, 1]);
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div ref={container} className="h-screen flex items-center justify-center sticky top-0">
      <motion.div 
        style={{ scale, top: `calc(-5vh + ${index * 25}px)` }} 
        className={`flex flex-col relative -top-[25%] h-[500px] w-full max-w-4xl rounded-[30px] padding-0 origin-top border border-white/10 bg-[#0A0A0B] shadow-2xl overflow-hidden`}
      >
        <div className="flex h-full flex-col md:flex-row">
          <div className="w-full md:w-[40%] p-12 flex flex-col justify-center gap-6 z-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${bg} ${border} border`}>
              <Icon className={`h-8 w-8 ${color}`} />
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight">{title}</h2>
            <p className="text-lg text-gray-400 leading-relaxed">{description}</p>
          </div>

          <div className="w-full md:w-[60%] h-full relative overflow-hidden bg-gradient-to-br from-black to-zinc-900 border-l border-white/5">
            <FeatureVisual title={title} color={color} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function FeaturesSection() {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end']
  });

  return (
    <section ref={container} className="relative bg-black" id="features">
      {/* Intro */}
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium mb-6">
            <BoltIcon className="h-4 w-4" />
            POWERFUL CAPABILITIES
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Everything You Need to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">Automate Growth</span>
          </h2>
        </div>
      </div>

      {/* Stacking Cards */}
      <div className="px-6 pb-32">
        {features.map((feature, i) => {
          const targetScale = 1 - ((features.length - i) * 0.05);
          return (
            <Card
              key={i}
              i={i}
              {...feature}
              title={feature.name}
              index={i}
              progress={scrollYProgress}
              range={[i * 0.25, 1]}
              targetScale={targetScale}
            />
          );
        })}
      </div>
    </section>
  );
}
