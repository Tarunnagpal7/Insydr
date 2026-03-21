'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '@/src/store/hooks';
import {
  CheckIcon,
  SparklesIcon,
  ArrowUpRightIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    period: '/month',
    description: 'Perfect for trying out the platform',
    features: [
      '1 AI Agent',
      '100 conversations/month',
      '10 documents',
      'Basic analytics',
      'Community support',
    ],
    cta: 'Current Plan',
    disabled: true,
    popular: false,
    color: 'from-gray-600 to-gray-700',
  },
  {
    id: 'pro',
    name: 'Professional',
    price: '$49',
    period: '/month',
    description: 'For growing businesses',
    features: [
      '5 AI Agents',
      'Unlimited conversations',
      '100 documents',
      'Advanced analytics',
      'Priority support',
      'Custom widget branding',
      'API access',
    ],
    cta: 'Upgrade to Pro',
    disabled: false,
    popular: true,
    color: 'from-red-600 to-red-700',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    period: '/month',
    description: 'For large organizations',
    features: [
      'Unlimited Agents',
      'Unlimited conversations',
      'Unlimited documents',
      'Custom analytics dashboards',
      'Dedicated support',
      'White-label widget',
      'SSO & SAML',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    disabled: false,
    popular: false,
    color: 'from-purple-600 to-purple-700',
  },
];

export default function BillingPage() {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  if (!currentWorkspace) return null;

  const currentPlan = currentWorkspace.subscription_tier || 'free';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
        <p className="text-gray-400 text-sm mt-2">Manage your plan and billing information.</p>
      </motion.div>

      {/* Current Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/20">
              <CreditCardIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Plan</p>
              <p className="text-xl font-bold text-white capitalize">{currentPlan === 'free' ? 'Starter' : currentPlan}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-400 font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          {[
            { label: 'Agents', value: currentWorkspace.stats?.total_agents || 0, max: currentPlan === 'free' ? 1 : currentPlan === 'pro' ? 5 : '∞' },
            { label: 'Documents', value: currentWorkspace.stats?.total_documents || 0, max: currentPlan === 'free' ? 10 : currentPlan === 'pro' ? 100 : '∞' },
            { label: 'Conversations', value: currentWorkspace.stats?.total_conversations || 0, max: currentPlan === 'free' ? 100 : '∞' },
            { label: 'Messages', value: currentWorkspace.stats?.total_messages || 0, max: '∞' },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-gray-500">{item.label}</p>
              <p className="text-lg font-bold text-white mt-1">
                {item.value}
                <span className="text-xs font-normal text-gray-500"> / {item.max}</span>
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Period Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-center gap-3"
      >
        <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
        <button
          onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
          className={`relative w-12 h-6 rounded-full transition-colors ${billingPeriod === 'annual' ? 'bg-red-600' : 'bg-white/10'}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
              billingPeriod === 'annual' ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className={`text-sm ${billingPeriod === 'annual' ? 'text-white' : 'text-gray-500'}`}>
          Annual 
          <span className="text-emerald-400 text-[10px] font-medium ml-1">Save 20%</span>
        </span>
      </motion.div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan, i) => {
          const isCurrentPlan = plan.id === currentPlan;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className={`relative bg-zinc-900/80 backdrop-blur-xl border rounded-2xl p-6 flex flex-col ${
                plan.popular ? 'border-red-500/40 shadow-lg shadow-red-900/10' : 'border-white/[0.08]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 rounded-full text-[10px] font-semibold text-white uppercase tracking-wide shadow-lg shadow-red-900/30">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-sm text-gray-500">{plan.period}</span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrentPlan}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isCurrentPlan
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
                    : plan.popular
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-900/20'
                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                }`}
                onClick={() => {
                  if (!isCurrentPlan) {
                    // Placeholder — would integrate with Stripe
                    alert(`Stripe checkout for ${plan.name} plan coming soon!`);
                  }
                }}
              >
                {isCurrentPlan ? 'Current Plan' : plan.cta}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Invoice History (Placeholder) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-gray-500" />
            Invoice History
          </h3>
        </div>
        <div className="text-center py-10">
          <CalendarDaysIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No invoices yet</p>
          <p className="text-xs text-gray-500 mt-1">Invoices will appear here once you subscribe to a paid plan.</p>
        </div>
      </motion.div>
    </div>
  );
}
