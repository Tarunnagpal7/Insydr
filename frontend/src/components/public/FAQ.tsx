'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    question: "How does the free trial work?",
    answer: "You get 14 days of full access to the Business plan features. No credit card required. At the end of the trial, you can choose to upgrade or revert to the Free plan."
  },
  {
    question: "Can I change plans later?",
    answer: "Yes, you can upgrade or downgrade your plan at any time through your account settings. Changes take effect at the start of the next billing cycle."
  },
  {
    question: "What happens if I exceed my conversation limit?",
    answer: "We'll notify you when you're close to your limit. If you exceed it, your agents will still work but may respond with a generic message until you upgrade or the next month begins."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use industry-standard encryption for all data in transit and at rest. We do not use your data to train our public models without your explicit permission."
  },
  {
    question: "Do you offer custom integrations?",
    answer: "Yes! On our Business plan, our team will work with you to build custom integrations for your specific tech stack."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 border-t border-white/5">
      <div className="max-w-3xl mx-auto px-6">
        <h3 className="text-2xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h3>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-white pr-8">{faq.question}</span>
                <ChevronDownIcon 
                  className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} 
                />
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 pt-0 text-gray-400 text-sm leading-relaxed border-t border-white/5 mt-2 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
