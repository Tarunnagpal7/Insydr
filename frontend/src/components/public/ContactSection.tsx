'use client';

import { EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function ContactSection() {
  return (
    <section className="py-24 border-t border-white/5 bg-white/5">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-12">Get in Touch</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <EnvelopeIcon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-white font-bold mb-1">Email Us</h3>
                    <p className="text-gray-400 text-sm mb-4">For general inquiries and support</p>
                    <a href="mailto:hello@insydr.ai" className="text-red-500 hover:text-red-400 font-medium">hello@insydr.ai</a>
                </div>
            </div>

            <div className="p-8 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <MapPinIcon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-white font-bold mb-1">Visit Us</h3>
                    <p className="text-gray-400 text-sm mb-4">Our physical headquarters</p>
                    <p className="text-gray-300">
                        123 AI Boulevard<br />
                        San Francisco, CA 94103
                    </p>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
}
