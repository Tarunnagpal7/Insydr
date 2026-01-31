'use client';

import { XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

export default function ProblemSection() {
  return (
    <section className="py-24 bg-black/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Your Current Website is <span className="text-red-500">Leaking Revenue</span>
          </h2>
          <p className="text-lg text-gray-400">
            98% of your visitors leave without taking action. Traditional forms and static chat widgets just don't cut it anymore in the AI era.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* The Old Way */}
          <div className="bg-red-950/10 border border-red-900/20 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 bg-red-500/10 rounded-bl-2xl border-b border-l border-red-500/20 text-red-400 text-sm font-bold">
              THE OLD WAY
            </div>
            
            <div className="space-y-6 mt-4">
              <div className="flex items-start gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                <XCircleIcon className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Static Forms</h3>
                  <p className="text-gray-400 text-sm">Visitors hate filling them out. High friction = high drop-off.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                <XCircleIcon className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">"Leave a Message"</h3>
                  <p className="text-gray-400 text-sm">Response time of 24+ hours usually means the lead is gone.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                <XCircleIcon className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Dumb Chatbots</h3>
                  <p className="text-gray-400 text-sm">Generic logic trees that frustrate users and kill brand trust.</p>
                </div>
              </div>
            </div>
          </div>

          {/* The New Way */}
          <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-3xl p-8 relative overflow-hidden ring-1 ring-emerald-500/20 shadow-2xl shadow-emerald-900/10">
            <div className="absolute top-0 right-0 p-4 bg-emerald-500/10 rounded-bl-2xl border-b border-l border-emerald-500/20 text-emerald-400 text-sm font-bold">
              THE INSYDR WAY
            </div>

            <div className="space-y-6 mt-4">
              <div className="flex items-start gap-4">
                <CheckCircleIcon className="h-6 w-6 text-emerald-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Active Engagement</h3>
                  <p className="text-gray-400 text-sm">AI identifies intent and initiates conversation proactively.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CheckCircleIcon className="h-6 w-6 text-emerald-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Instant Qualification</h3>
                  <p className="text-gray-400 text-sm">Natural conversation that qualifies leads while solving their problems.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircleIcon className="h-6 w-6 text-emerald-500 shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Zero-Friction Conversion</h3>
                  <p className="text-gray-400 text-sm">Book meetings or capture emails directly within the chat flow.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
