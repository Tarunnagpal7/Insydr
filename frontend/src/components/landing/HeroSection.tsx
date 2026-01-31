'use client';

import Link from 'next/link';
import { ArrowRightIcon, PlayCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left: Messaging */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-red-400 font-medium mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Trusted by 500+ High-Growth Teams
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight"
            >
              Turn Anonymous Visitors into <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">Pipeline</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Insydr is the autonomous AI agent that engages, qualifies, and converts your website traffic 24/7. Stop losing leads to slow response times.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 group"
              >
                Start Converting Free
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium border border-white/10 transition-all flex items-center justify-center gap-2">
                <PlayCircleIcon className="h-6 w-6 text-gray-400" />
                See How It Works
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 flex items-center gap-4 justify-center lg:justify-start text-sm text-gray-500"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-br from-gray-700 to-gray-800" />
                ))}
              </div>
              <p>Join 10,000+ marketers driving revenue</p>
            </motion.div>
          </div>

          {/* Right: Visual */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-1 w-full max-w-lg lg:max-w-none relative"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-red-600/30 to-purple-600/30 rounded-3xl blur-3xl transform rotate-6 scale-105" />
            
            {/* Interface Mockup */}
            <div className="relative bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 bg-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="ml-4 px-3 py-1 rounded-full bg-black/50 border border-white/5 text-xs text-gray-500 font-mono w-full max-w-[200px]">
                  insydr.ai/agent-demo
                </div>
              </div>
              
              <div className="p-6 space-y-4 min-h-[400px]">
                {/* Chat Message 1 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-xs font-bold text-white shrink-0">AI</div>
                  <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 max-w-[80%]">
                    <p className="text-sm text-gray-200">Hi there! 👋 I see you're looking at our Enterprise plan. Would you like to see a custom ROI calculation based on your current traffic?</p>
                  </div>
                </div>

                {/* Chat Message 2 */}
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-gray-700 shrink-0" />
                  <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-tr-none p-4 max-w-[80%]">
                    <p className="text-sm text-white">Yes, we have about 50k monthly visitors but conversion is low.</p>
                  </div>
                </div>

                {/* Chat Message 3 */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-xs font-bold text-white shrink-0">AI</div>
                  <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 max-w-[80%]">
                    <p className="text-sm text-gray-200">Got it. Based on 50k visitors, Insydr typically captures an additional <span className="text-red-400 font-bold">150-200 qualified leads</span> per month. </p>
                    <div className="mt-3 p-3 bg-black/20 rounded-xl border border-white/5">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Projected Value</span>
                        <span>$45,000/mo</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full w-[75%]" />
                      </div>
                    </div>
                    <button className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold text-white transition-colors">
                      Book a Demo to See More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
