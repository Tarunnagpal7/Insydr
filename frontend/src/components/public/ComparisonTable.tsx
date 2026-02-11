'use client';

import { CheckIcon, MinusIcon } from '@heroicons/react/24/solid';

const features = [
  { name: 'Number of Agents', free: '1', pro: '5', business: 'Unlimited' },
  { name: 'Conversations / mo', free: '50', pro: '5,000', business: '50,000' },
  { name: 'Knowledge Base Storage', free: '10 MB', pro: '100 MB', business: 'Unlimited' },
  { name: 'Custom Branding', free: false, pro: true, business: true },
  { name: 'API Access', free: false, pro: false, business: true },
  { name: 'Team Members', free: '1', pro: '5', business: 'Unlimited' },
  { name: 'Support', free: 'Community', pro: 'Email', business: '24/7 Priority' },
  { name: 'SSO & SAML', free: false, pro: false, business: true },
  { name: 'Custom Domain', free: false, pro: true, business: true },
  { name: 'Data Retention', free: '7 days', pro: '30 days', business: 'Unlimited' },
];

export default function ComparisonTable() {
  return (
    <section className="py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <h3 className="text-2xl font-bold text-white mb-12 text-center">Compare Plans</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-sm font-medium text-gray-500 border-b border-white/10 w-1/3">Feature</th>
                <th className="p-4 text-sm font-bold text-white border-b border-white/10 w-1/5">Free</th>
                <th className="p-4 text-sm font-bold text-red-500 border-b border-white/10 w-1/5">Pro</th>
                <th className="p-4 text-sm font-bold text-white border-b border-white/10 w-1/5">Business</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {features.map((feature) => (
                <tr key={feature.name} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sm text-gray-300">{feature.name}</td>
                  
                  <td className="p-4 text-sm text-gray-400">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? <CheckIcon className="h-5 w-5 text-green-500" /> : <MinusIcon className="h-5 w-5 text-gray-600" />
                    ) : feature.free}
                  </td>
                  
                  <td className="p-4 text-sm text-white font-medium">
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? <CheckIcon className="h-5 w-5 text-green-500" /> : <MinusIcon className="h-5 w-5 text-gray-600" />
                    ) : feature.pro}
                  </td>
                  
                  <td className="p-4 text-sm text-white font-medium">
                    {typeof feature.business === 'boolean' ? (
                      feature.business ? <CheckIcon className="h-5 w-5 text-green-500" /> : <MinusIcon className="h-5 w-5 text-gray-600" />
                    ) : feature.business}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
