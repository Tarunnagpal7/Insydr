'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

const frequencies = [
  { value: 'monthly', label: 'Monthly', priceSuffix: '/month' },
  { value: 'annually', label: 'Annually', priceSuffix: '/year' },
];

const tiers = [
  {
    name: 'Free',
    id: 'tier-free',
    href: '/login',
    price: { monthly: '$0', annually: '$0' },
    description: 'Perfect for testing and personal projects.',
    features: [
      '1 Workspace',
      '1 Agent',
      '50 Conversations / month',
      'Basic Analytics',
      'Community Support',
    ],
    highlighted: false,
    cta: 'Start for free',
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '/signup',
    price: { monthly: '$49', annually: '$490' },
    description: 'For growing businesses and startups.',
    features: [
      '5 Workspaces',
      '5 Agents',
      '5,000 Conversations / month',
      'Custom Knowledge Base (100MB)',
      'Widget Customization',
      'Email Support',
      'Remove "Powered by Insydr"',
    ],
    highlighted: true,
    cta: 'Get started',
  },
  {
    name: 'Business',
    id: 'tier-business',
    href: '/contact',
    price: { monthly: '$199', annually: '$1990' },
    description: 'For teams that need scale and security.',
    features: [
      'Unlimited Workspaces',
      'Unlimited Agents',
      '50,000 Conversations / month',
      'Unlimited Knowledge Base',
      'API Access',
      'Priority 24/7 Support',
      'SSO & SAML',
      'Custom Integrations',
    ],
    highlighted: false,
    cta: 'Contact Sales',
  },
];

export default function PricingCards() {
  const [frequency, setFrequency] = useState(frequencies[0]);

  return (
    <div className="py-12" id="pricing">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Toggle */}
        <div className="flex justify-center mb-16">
          <div className="relative flex p-1 bg-white/5 rounded-full border border-white/10">
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
               {/* Animated background could go here */}
            </div>
            {frequencies.map((option) => (
              <button
                key={option.value}
                onClick={() => setFrequency(option)}
                className={`${
                  frequency.value === option.value ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                } relative rounded-full px-6 py-2 text-sm font-medium transition-all duration-200`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`relative flex flex-col p-8 rounded-3xl border ${
                tier.highlighted 
                  ? 'bg-gradient-to-b from-white/10 to-white/5 border-red-500/50 shadow-2xl shadow-red-900/20' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="text-sm text-gray-400">{tier.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  {tier.price[frequency.value as keyof typeof tier.price]}
                </span>
                <span className="text-gray-500">{frequency.priceSuffix}</span>
              </div>

              <a
                href={tier.href}
                className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all ${
                  tier.highlighted
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {tier.cta}
              </a>

              <ul className="mt-8 space-y-4 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckIcon className={`h-5 w-5 shrink-0 ${tier.highlighted ? 'text-red-500' : 'text-gray-500'}`} />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
