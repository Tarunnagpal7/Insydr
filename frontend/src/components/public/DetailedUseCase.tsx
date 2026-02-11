'use client';

import { motion } from 'framer-motion';

interface DetailedUseCaseProps {
  title: string;
  workflow: string[];
  outcomes: string[];
  example: string;
  reversed?: boolean;
}

export default function DetailedUseCase({ title, workflow, outcomes, example, reversed = false }: DetailedUseCaseProps) {
  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 lg:gap-24`}>
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="w-8 h-1 bg-red-500 rounded-full" />
              {title}
            </h3>

            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">How it Works</h4>
                <div className="space-y-4">
                  {workflow.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono text-gray-400 shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Outcomes</h4>
                <div className="grid grid-cols-2 gap-4">
                  {outcomes.map((outcome, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/5 text-sm text-green-400 font-medium text-center">
                      {outcome}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">
             <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">Example Conversation</span>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                  </div>
                </div>
                <div className="p-6">
                  <pre className="text-sm text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                    {example}
                  </pre>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
