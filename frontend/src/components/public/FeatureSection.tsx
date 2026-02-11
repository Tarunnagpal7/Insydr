'use client';

import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

interface FeatureSectionProps {
  title: string;
  description: string;
  bullets: string[];
  imageSrc?: string; // Placeholder for now if no image
  reversed?: boolean;
  gradient?: string;
}

export default function FeatureSection({ 
  title, 
  description, 
  bullets, 
  reversed = false,
  gradient = "from-red-600/20 to-purple-600/20"
}: FeatureSectionProps) {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 lg:gap-24`}>
          
          {/* Text Content */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                {title}
              </h2>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                {description}
              </p>
              
              <ul className="space-y-4">
                {bullets.map((bullet, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircleIcon className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-gray-300">{bullet}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Visual Content */}
          <div className="flex-1 w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-tr ${gradient} rounded-3xl blur-3xl opacity-30`} />
              <div className="relative bg-[#0A0A0B] border border-white/10 rounded-2xl aspect-[4/3] overflow-hidden shadow-2xl flex items-center justify-center group hover:border-white/20 transition-colors">
                {/* Placeholder UI - in real app would be Image or complex component */}
                 <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                 <div className="z-10 text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-white/10 transition-colors">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient}`} />
                    </div>
                    <p className="text-sm text-gray-500 font-mono">UI Representation: {title}</p>
                 </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
