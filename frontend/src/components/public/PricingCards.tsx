'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import {
  SparklesIcon,
  RocketLaunchIcon,
  FireIcon,
  BuildingOffice2Icon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

const frequencies = [
  { value: 'monthly', label: 'Monthly', priceSuffix: '/mo' },
  { value: 'annually', label: 'Annually', priceSuffix: '/yr' },
];

interface TierFeature {
  text: string;
  included: boolean;
}

interface Tier {
  name: string;
  id: string;
  href: string;
  icon: React.ElementType;
  price: { monthly: string; annually: string };
  originalAnnual?: string;
  description: string;
  badge?: string;
  limits: string[];
  features: TierFeature[];
  highlighted: boolean;
  cta: string;
  gradient: string;
  iconColor: string;
}

const tiers: Tier[] = [
  {
    name: 'Free',
    id: 'tier-free',
    href: '/signup',
    icon: SparklesIcon,
    price: { monthly: '₹0', annually: '₹0' },
    description: 'Perfect for testing and personal projects.',
    limits: [
      '1 Workspace',
      '1 Agent',
      '100 Messages / month',
      '3 Documents (2 MB each)',
      '10 MB Storage',
    ],
    features: [
      { text: 'Basic analytics', included: true },
      { text: 'Standard widget embed', included: true },
      { text: 'Community support', included: true },
      { text: '"Powered by Insydr" branding', included: true },
      { text: 'Remove branding', included: false },
      { text: 'API access', included: false },
      { text: 'Lead generation', included: false },
    ],
    highlighted: false,
    cta: 'Start for Free',
    gradient: 'from-gray-500/10 to-gray-600/5',
    iconColor: 'text-gray-400',
  },
  {
    name: 'Starter',
    id: 'tier-starter',
    href: '/signup',
    icon: RocketLaunchIcon,
    price: { monthly: '₹799', annually: '₹7,990' },
    originalAnnual: '₹9,588',
    description: 'For solopreneurs and small businesses.',
    limits: [
      '1 Workspace',
      '2 Agents',
      '2,000 Messages / month',
      '25 Documents (5 MB each)',
      '100 MB Storage',
    ],
    features: [
      { text: 'Remove "Powered by Insydr"', included: true },
      { text: 'Custom brand colors & avatar', included: true },
      { text: 'Basic analytics dashboard', included: true },
      { text: 'Conversation history', included: true },
      { text: 'Email support (48hr)', included: true },
      { text: 'API access', included: false },
      { text: 'Lead generation', included: false },
      { text: 'Webhooks', included: false },
    ],
    highlighted: false,
    cta: 'Get Started',
    gradient: 'from-blue-500/10 to-blue-600/5',
    iconColor: 'text-blue-400',
  },
  {
    name: 'Growth',
    id: 'tier-growth',
    href: '/signup',
    icon: FireIcon,
    price: { monthly: '₹2,499', annually: '₹24,990' },
    originalAnnual: '₹29,988',
    description: 'For startups and growing businesses.',
    badge: 'Most Popular',
    limits: [
      '3 Workspaces',
      '5 Agents',
      '10,000 Messages / month',
      'Unlimited Documents',
      '500 MB Storage',
    ],
    features: [
      { text: 'Everything in Starter', included: true },
      { text: 'Advanced analytics & insights', included: true },
      { text: 'Lead generation (email + OTP)', included: true },
      { text: 'API access & API keys', included: true },
      { text: 'Webhook integrations', included: true },
      { text: 'Source citations in responses', included: true },
      { text: 'Agent behavior config', included: true },
      { text: 'Priority email support (24hr)', included: true },
    ],
    highlighted: true,
    cta: 'Get Started',
    gradient: 'from-red-500/15 to-orange-500/5',
    iconColor: 'text-red-400',
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '/signup',
    icon: BuildingOffice2Icon,
    price: { monthly: '₹6,999', annually: '₹69,990' },
    originalAnnual: '₹83,988',
    description: 'For agencies and scaling companies.',
    limits: [
      '10 Workspaces',
      'Unlimited Agents',
      '30,000 Messages / month',
      'Unlimited Documents',
      '2 GB Storage',
    ],
    features: [
      { text: 'Everything in Growth', included: true },
      { text: 'Multi-model LLM routing', included: true },
      { text: 'RBAC & team collaboration', included: true },
      { text: 'Workspace invitations', included: true },
      { text: 'Document versioning', included: true },
      { text: 'Domain whitelisting per agent', included: true },
      { text: 'Priority support (12hr)', included: true },
    ],
    highlighted: false,
    cta: 'Get Started',
    gradient: 'from-purple-500/10 to-purple-600/5',
    iconColor: 'text-purple-400',
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '/contact',
    icon: BuildingLibraryIcon,
    price: { monthly: 'Custom', annually: 'Custom' },
    description: 'For large orgs needing compliance & SLA.',
    limits: [
      'Unlimited Everything',
      'Custom message volume',
      'Custom storage',
      'Dedicated infrastructure',
    ],
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'SSO / SAML integration', included: true },
      { text: 'SLA guarantees (99.9%)', included: true },
      { text: 'Dedicated DB isolation', included: true },
      { text: 'White-label (full rebrand)', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Dedicated success manager', included: true },
    ],
    highlighted: false,
    cta: 'Contact Sales',
    gradient: 'from-amber-500/10 to-amber-600/5',
    iconColor: 'text-amber-400',
  },
];

export default function PricingCards() {
  const [frequency, setFrequency] = useState(frequencies[0]);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handlePlanClick = async (tier: Tier) => {
    // Enterprise → contact page
    if (tier.id === 'tier-enterprise') {
      window.location.href = '/contact';
      return;
    }

    // Free → signup
    if (tier.id === 'tier-free') {
      window.location.href = '/signup';
      return;
    }

    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      // Not logged in → go to signup
      window.location.href = '/signup';
      return;
    }

    // Get workspace ID from localStorage or Redux
    // Try to get from the URL or stored workspace
    let workspaceId: string | null = null;
    try {
      const stored = localStorage.getItem('currentWorkspaceId');
      if (stored) {
        workspaceId = stored;
      }
    } catch {}

    if (!workspaceId) {
      // Fallback: fetch workspaces from API to get the first one
      try {
        const { default: apiClient } = await import('@/src/lib/api');
        const res = await apiClient.get('/workspaces');
        const workspaces = res.data?.workspaces;
        if (workspaces && workspaces.length > 0) {
          workspaceId = workspaces[0].id;
        }
      } catch {
        // If API fails, redirect to dashboard
        window.location.href = '/dashboard';
        return;
      }
    }

    if (!workspaceId) {
      window.location.href = '/dashboard';
      return;
    }

    // Map tier ID → plan name for the API
    const planMap: Record<string, string> = {
      'tier-starter': 'STARTER',
      'tier-growth': 'GROWTH',
      'tier-pro': 'PRO',
    };
    const plan = planMap[tier.id];
    if (!plan) return;

    const interval = frequency.value === 'annually' ? 'annual' : 'monthly';

    setCheckoutLoading(tier.id);
    try {
      const { createCheckout } = await import('@/src/lib/billing');
      const url = await createCheckout(workspaceId, plan, interval);
      window.location.href = url;
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to start checkout. Please try again.';
      alert(msg);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="py-12" id="pricing">
      <div className="max-w-[90rem] mx-auto px-6">

        {/* Toggle */}
        <div className="flex justify-center mb-16">
          <div className="relative flex p-1 bg-white/5 rounded-full border border-white/10">
            {frequencies.map((option) => (
              <button
                key={option.value}
                onClick={() => setFrequency(option)}
                className={`${
                  frequency.value === option.value
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-200'
                } relative rounded-full px-6 py-2 text-sm font-medium transition-all duration-200`}
              >
                {option.label}
                {option.value === 'annually' && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-green-500/20 text-green-400 rounded-full">
                    SAVE 17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards — first 4 */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {tiers.slice(0, 4).map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className={`relative flex flex-col p-7 rounded-3xl border ${
                tier.highlighted
                  ? 'bg-gradient-to-b from-white/10 to-white/[0.03] border-red-500/50 shadow-2xl shadow-red-900/20 ring-1 ring-red-500/20'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              } transition-all duration-300`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-600 text-white text-[11px] font-bold rounded-full shadow-lg uppercase tracking-wider whitespace-nowrap">
                  {tier.badge}
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl bg-white/5 ${tier.iconColor}`}>
                  <tier.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
              </div>

              <p className="text-sm text-gray-400 mb-5 leading-relaxed">{tier.description}</p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className={`font-bold text-white ${
                    tier.price.monthly === 'Custom' ? 'text-3xl' : 'text-3xl'
                  }`}>
                    {tier.price[frequency.value as keyof typeof tier.price]}
                  </span>
                  {tier.price.monthly !== 'Custom' && tier.price.monthly !== '₹0' && (
                    <span className="text-gray-500 text-sm">{frequency.priceSuffix}</span>
                  )}
                </div>
                {frequency.value === 'annually' && tier.originalAnnual && (
                  <p className="text-xs text-gray-500 mt-1 line-through">{tier.originalAnnual}/yr</p>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => handlePlanClick(tier)}
                disabled={checkoutLoading === tier.id}
                className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all duration-200 block disabled:opacity-60 ${
                  tier.highlighted
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30 hover:shadow-red-900/50'
                    : 'bg-white/90 text-black hover:bg-white'
                }`}
              >
                {checkoutLoading === tier.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Processing…
                  </span>
                ) : tier.cta}
              </button>

              {/* Limits */}
              <div className="mt-6 mb-4">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Plan Limits</p>
                <ul className="space-y-2">
                  {tier.limits.map((limit) => (
                    <li key={limit} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        tier.highlighted ? 'bg-red-500' : 'bg-gray-600'
                      }`} />
                      {limit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Features */}
              <div className="mt-auto pt-4 border-t border-white/5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Features</p>
                <ul className="space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <CheckIcon className={`h-4 w-4 shrink-0 mt-0.5 ${
                          tier.highlighted ? 'text-red-500' : 'text-green-500/80'
                        }`} />
                      ) : (
                        <XMarkIcon className="h-4 w-4 shrink-0 mt-0.5 text-gray-600" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enterprise — full width */}
        {tiers.filter(t => t.id === 'tier-enterprise').map((tier) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mt-6 relative flex flex-col md:flex-row items-start md:items-center justify-between p-8 md:p-10 rounded-3xl border border-white/10 bg-gradient-to-r from-amber-500/5 via-white/[0.02] to-amber-500/5 hover:border-amber-500/30 transition-all duration-300"
          >
            <div className="flex-1 mb-6 md:mb-0">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl bg-white/5 ${tier.iconColor}`}>
                  <tier.icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-xl">{tier.description}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {tier.features.map((feature) => (
                  <span key={feature.text} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckIcon className="h-4 w-4 text-amber-500 shrink-0" />
                    {feature.text}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <div>
                <span className="text-3xl font-bold text-white">₹24,999+</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <button
                onClick={() => handlePlanClick(tier)}
                className="px-8 py-3 bg-amber-500/90 hover:bg-amber-500 text-black rounded-xl font-bold transition-all text-sm whitespace-nowrap"
              >
                {tier.cta}
              </button>
            </div>
          </motion.div>
        ))}

      </div>
    </div>
  );
}
