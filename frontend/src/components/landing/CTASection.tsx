'use client';

import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function CTASection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-gradient-to-br from-red-600/20 to-purple-600/20 rounded-[3rem] p-12 md:p-20 text-center border border-white/10 relative overflow-hidden">
          {/* Noise/Texture Overlay could go here */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl -z-10" />
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Accelerate Your <br />
            Pipeline?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join hundreds of forward-thinking companies using AI to convert traffic into revenue today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-white text-black hover:bg-gray-100 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
            >
              Get Started for Free
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 hover:bg-white/5 text-white rounded-xl font-medium transition-all">
              Book a Demo
            </button>
          </div>
          
          <p className="mt-6 text-sm text-gray-500">
            No credit card required. 14-day free trial on enterprise features.
          </p>
        </div>
      </div>
    </section>
  );
}
