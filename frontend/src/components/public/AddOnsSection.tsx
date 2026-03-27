'use client';

import { motion } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  CircleStackIcon,
  UserPlusIcon,
  GlobeAltIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

const addOns = [
  {
    icon: ChatBubbleLeftRightIcon,
    name: 'Extra Messages',
    description: 'Additional 1,000 messages per month when you exceed your plan limit.',
    prices: [
      { tier: 'Starter', price: '₹499' },
      { tier: 'Growth', price: '₹399' },
      { tier: 'Pro', price: '₹349' },
    ],
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: CircleStackIcon,
    name: 'Extra Storage',
    description: 'Additional 500 MB of knowledge base storage for documents and embeddings.',
    prices: [{ tier: 'All plans', price: '₹199/mo' }],
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: UserPlusIcon,
    name: 'Extra Agents',
    description: 'Add more AI agents beyond your plan limit on Starter and Growth plans.',
    prices: [{ tier: 'Per agent', price: '₹299/mo' }],
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    icon: GlobeAltIcon,
    name: 'WhatsApp Integration',
    description: 'Connect your AI agent to WhatsApp Business for automated customer support.',
    prices: [{ tier: '', price: '₹999/mo' }],
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    comingSoon: true,
  },
  {
    icon: CpuChipIcon,
    name: 'Custom LLM Model',
    description: 'Bring your own fine-tuned model or choose a premium model for your agents.',
    prices: [{ tier: '', price: '₹1,999/mo' }],
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    comingSoon: true,
  },
];

export default function AddOnsSection() {
  return (
    <section className="py-20 border-t border-white/5" id="add-ons">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h3 className="text-3xl font-bold text-white mb-4">Flexible Add-Ons</h3>
          <p className="text-gray-400 max-w-xl mx-auto">
            Need more? Scale specific resources without upgrading your entire plan.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {addOns.map((addOn, index) => (
            <motion.div
              key={addOn.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="relative p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all group"
            >
              {addOn.comingSoon && (
                <span className="absolute top-4 right-4 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 rounded-full uppercase tracking-wider border border-amber-500/20">
                  Coming Soon
                </span>
              )}

              <div className={`inline-flex p-2.5 rounded-xl ${addOn.bg} mb-4`}>
                <addOn.icon className={`h-5 w-5 ${addOn.color}`} />
              </div>

              <h4 className="text-base font-bold text-white mb-2">{addOn.name}</h4>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">{addOn.description}</p>

              <div className="flex flex-wrap gap-2">
                {addOn.prices.map((p, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
                  >
                    {p.tier && (
                      <span className="text-[11px] text-gray-500 font-medium">{p.tier}:</span>
                    )}
                    <span className="text-sm font-bold text-white">{p.price}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
