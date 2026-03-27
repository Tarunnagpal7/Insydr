'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major payment methods popular in India — UPI (GPay, PhonePe, Paytm), credit/debit cards (Visa, Mastercard, RuPay), net banking, and wallets via Razorpay. For Enterprise plans, we also support bank transfers and invoicing."
  },
  {
    question: "Can I switch plans later?",
    answer: "Absolutely. You can upgrade or downgrade your plan at any time from your account settings. When upgrading, we'll prorate the difference. When downgrading, changes take effect at the start of the next billing cycle."
  },
  {
    question: "What happens if I exceed my message limit?",
    answer: "We'll notify you when you're at 80% and 100% of your limit. If you exceed it, you can purchase additional messages — ₹499 per 1,000 extra messages on Starter, ₹399 on Growth, and ₹349 on Pro. Your agents continue to work uninterrupted."
  },
  {
    question: "What's included in the Free plan?",
    answer: "The Free plan includes 1 workspace, 1 AI agent, 100 messages per month, 3 documents (max 2 MB each), basic analytics, and community support via Discord. The only limitation is the mandatory \"Powered by Insydr\" branding on the widget."
  },
  {
    question: "Do you offer annual discounts?",
    answer: "Yes! When you choose annual billing, you save 17% compared to monthly billing. For example, the Growth plan is ₹2,499/month on monthly billing, but effectively ₹2,082/month when billed annually at ₹24,990/year."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, there's no lock-in contract. You can cancel your subscription at any time. Your plan remains active until the end of the current billing period, after which your account reverts to the Free plan."
  },
  {
    question: "Is GST included in the prices?",
    answer: "The prices shown are exclusive of GST. An additional 18% GST will be applied on all paid plans as per Indian tax regulations. GST-compliant invoices are generated automatically for every transaction."
  },
  {
    question: "Do you offer custom Enterprise pricing?",
    answer: "Yes! For organizations with specific compliance, SLA, or scale requirements, we offer custom Enterprise plans starting at ₹24,999/month. This includes dedicated infrastructure, SSO/SAML, white-labeling, and a dedicated success manager. Contact our sales team for a tailored quote."
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 border-t border-white/5" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <h3 className="text-3xl font-bold text-white mb-4 text-center">Frequently Asked Questions</h3>
        <p className="text-gray-400 text-center mb-12">
          Everything you need to know about our pricing.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-white/10 rounded-2xl bg-white/[0.03] overflow-hidden hover:border-white/15 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="font-medium text-white pr-8 text-sm">{faq.question}</span>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-400 shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
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
                    <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
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
