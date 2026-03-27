'use client';

import { CheckIcon, MinusIcon } from '@heroicons/react/24/solid';

const features = [
  { name: 'Workspaces', free: '1', starter: '1', growth: '3', pro: '10', enterprise: 'Unlimited' },
  { name: 'Agents', free: '1', starter: '2', growth: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Messages / month', free: '100', starter: '2,000', growth: '10,000', pro: '30,000', enterprise: 'Custom' },
  { name: 'Documents', free: '3', starter: '25', growth: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Web Page Crawl', free: '10', starter: '50', growth: '500', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Storage', free: '10 MB', starter: '100 MB', growth: '500 MB', pro: '2 GB', enterprise: 'Custom' },
  { name: 'Remove Branding', free: false, starter: true, growth: true, pro: true, enterprise: true },
  { name: 'Widget Customization', free: 'Basic', starter: 'Colors + Avatar', growth: 'Full', pro: 'Full', enterprise: 'White-label' },
  { name: 'Analytics', free: 'Basic', starter: 'Basic+', growth: 'Advanced', pro: 'Advanced', enterprise: 'Advanced+' },
  { name: 'Lead Generation', free: false, starter: false, growth: true, pro: true, enterprise: true },
  { name: 'API Access', free: false, starter: false, growth: true, pro: true, enterprise: true },
  { name: 'Webhooks', free: false, starter: false, growth: true, pro: true, enterprise: true },
  { name: 'LLM Model Choice', free: 'Default', starter: 'Default', growth: 'Default', pro: 'Multi-model', enterprise: 'Custom' },
  { name: 'RBAC & Teams', free: false, starter: false, growth: false, pro: true, enterprise: true },
  { name: 'SSO / SAML', free: false, starter: false, growth: false, pro: false, enterprise: true },
  { name: 'Support', free: 'Community', starter: 'Email (48hr)', growth: 'Email (24hr)', pro: 'Priority (12hr)', enterprise: 'Dedicated' },
];

const planHeaders = [
  { key: 'free', label: 'Free', sublabel: '₹0', highlight: false },
  { key: 'starter', label: 'Starter', sublabel: '₹799/mo', highlight: false },
  { key: 'growth', label: 'Growth', sublabel: '₹2,499/mo', highlight: true },
  { key: 'pro', label: 'Pro', sublabel: '₹6,999/mo', highlight: false },
  { key: 'enterprise', label: 'Enterprise', sublabel: 'Custom', highlight: false },
];

function CellContent({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckIcon className="h-5 w-5 text-green-500" />
    ) : (
      <MinusIcon className="h-5 w-5 text-gray-700" />
    );
  }
  return <>{value}</>;
}

export default function ComparisonTable() {
  return (
    <section className="py-20 border-t border-white/5" id="compare-plans">
      <div className="max-w-[90rem] mx-auto px-6">
        <h3 className="text-3xl font-bold text-white mb-4 text-center">Compare Plans</h3>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Every feature you need, at a price that makes sense for the Indian market.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="p-5 text-sm font-medium text-gray-500 border-b border-white/10 w-[22%] sticky left-0 bg-[#0a0a0a] z-10">
                  Feature
                </th>
                {planHeaders.map((plan) => (
                  <th
                    key={plan.key}
                    className={`p-5 text-center border-b border-white/10 w-[15.6%] ${
                      plan.highlight ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <div className={`text-sm font-bold ${plan.highlight ? 'text-red-400' : 'text-white'}`}>
                      {plan.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{plan.sublabel}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {features.map((feature) => (
                <tr key={feature.name} className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-4 text-sm text-gray-300 font-medium sticky left-0 bg-[#0a0a0a] z-10">
                    {feature.name}
                  </td>
                  {planHeaders.map((plan) => {
                    const value = feature[plan.key as keyof typeof feature] as boolean | string;
                    return (
                      <td
                        key={plan.key}
                        className={`p-4 text-sm text-center ${
                          plan.highlight ? 'bg-red-500/5' : ''
                        } ${typeof value === 'string' ? 'text-gray-300' : ''}`}
                      >
                        <div className="flex justify-center">
                          <CellContent value={value} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
