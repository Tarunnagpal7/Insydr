'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useAppSelector } from '@/src/store/hooks';
import Link from 'next/link';
import {
  CreditCardIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  DocumentIcon,
  CircleStackIcon,
  ArrowPathIcon,
  SparklesIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  getSubscription,
  getUsage,
  getInvoices,
  createPortalSession,
  createCheckout,
  syncCheckout,
  type SubscriptionInfo,
  type UsageStats,
  type Invoice,
} from '@/src/lib/billing';
import toast from 'react-hot-toast';

// Plan display info
const PLAN_INFO: Record<string, { name: string; price: string; color: string; icon: string }> = {
  FREE: { name: 'Free', price: '₹0', color: 'from-gray-500 to-gray-600', icon: '🆓' },
  STARTER: { name: 'Starter', price: '₹799/mo', color: 'from-blue-500 to-blue-600', icon: '🚀' },
  GROWTH: { name: 'Growth', price: '₹2,499/mo', color: 'from-red-500 to-red-600', icon: '🔥' },
  PRO: { name: 'Pro', price: '₹6,999/mo', color: 'from-purple-500 to-purple-600', icon: '🏢' },
  ENTERPRISE: { name: 'Enterprise', price: 'Custom', color: 'from-amber-500 to-amber-600', icon: '🏛️' },
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; icon: React.ElementType }> = {
    active: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500', icon: CheckBadgeIcon },
    trialing: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500', icon: SparklesIcon },
    past_due: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500', icon: ExclamationTriangleIcon },
    canceled: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', dot: 'bg-red-500', icon: XCircleIcon },
  };
  const c = config[status] || config.active;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${c.bg}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <span className={`text-sm font-medium capitalize ${c.text}`}>{status.replace('_', ' ')}</span>
    </div>
  );
}

// Usage progress bar
function UsageBar({ label, icon: Icon, used, limit, unit }: {
  label: string;
  icon: React.ElementType;
  used: number;
  limit: number;
  unit?: string;
}) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-sm font-bold text-white">
          {used.toLocaleString('en-IN')}
          <span className="text-gray-500 font-normal">
            {' / '}
            {isUnlimited ? '∞' : limit.toLocaleString('en-IN')}
            {unit ? ` ${unit}` : ''}
          </span>
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="w-full h-2 rounded-full bg-emerald-500/20">
          <div className="h-full rounded-full bg-emerald-500/40 w-full" />
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace } = useAppSelector((state) => state.workspace);

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [invoiceList, setInvoiceList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchBillingData = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [subData, usageData, invoiceData] = await Promise.all([
        getSubscription(workspaceId),
        getUsage(workspaceId),
        getInvoices(workspaceId),
      ]);
      setSubscription(subData);
      setUsage(usageData);
      setInvoiceList(invoiceData);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    const handleUrlParams = async () => {
      if (typeof window === 'undefined') return;
      
      const searchParams = new URLSearchParams(window.location.search);
      const success = searchParams.get('success');
      const sessionId = searchParams.get('session_id');
      const canceled = searchParams.get('canceled');

      if (success === 'true' && sessionId) {
        try {
          await syncCheckout(sessionId);
          toast.success('Subscription upgraded successfully!');
        } catch (e) {
          console.error('Failed to sync checkout:', e);
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (canceled === 'true') {
        toast.error('Checkout was canceled.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      fetchBillingData();
    };

    handleUrlParams();
  }, [fetchBillingData]);

  if (!currentWorkspace) return null;

  const tier = (subscription?.plan || currentWorkspace.subscription_tier || 'FREE').toUpperCase();
  const planInfo = PLAN_INFO[tier] || PLAN_INFO.FREE;
  const isFree = tier === 'FREE';

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const url = await createPortalSession(workspaceId);
      window.location.href = url;
    } catch {
      toast.error('Unable to open billing portal. Make sure you have an active subscription.');
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'inr') {
      return `₹${(amount / 100).toLocaleString('en-IN')}`;
    }
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-zinc-900/80 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
        <p className="text-gray-400 text-sm mt-2">Manage your plan, track usage, and view invoices.</p>
      </motion.div>

      {/* ─── Section 1: Current Plan ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${planInfo.color} flex items-center justify-center text-2xl shadow-lg`}>
              {planInfo.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Current Plan</p>
              <p className="text-2xl font-bold text-white">{planInfo.name}</p>
              <p className="text-sm text-gray-400">{planInfo.price}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={subscription?.status || 'active'} />

            {subscription?.current_period_end && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <CalendarDaysIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-400">
                  {subscription.cancel_at_period_end ? 'Cancels' : 'Renews'}{' '}
                  {formatDate(subscription.current_period_end)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment method */}
        {subscription?.payment_method && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
            <CreditCardIcon className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-300">
              {subscription.payment_method.brand?.toUpperCase()} •••• {subscription.payment_method.last4}
              <span className="text-gray-500 ml-2">
                Expires {subscription.payment_method.exp_month}/{subscription.payment_method.exp_year}
              </span>
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 pt-5 border-t border-white/5 flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center gap-2"
          >
            {isFree ? 'Upgrade Plan' : 'Change Plan'}
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </Link>

          {!isFree && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl border border-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CreditCardIcon className="h-4 w-4" />
              {portalLoading ? 'Opening...' : 'Manage Billing'}
            </button>
          )}

          <button
            onClick={fetchBillingData}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl border border-white/10 transition-all"
            title="Refresh"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* ─── Section 2: Usage Dashboard ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-gray-500" />
            Usage This Month
          </h3>
          {usage?.billing_period_start && (
            <span className="text-xs text-gray-500">
              Since {formatDate(usage.billing_period_start)}
            </span>
          )}
        </div>

        {usage ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UsageBar
              label="Messages"
              icon={ChatBubbleLeftRightIcon}
              used={usage.messages.used}
              limit={usage.messages.limit}
            />
            <UsageBar
              label="AI Agents"
              icon={CpuChipIcon}
              used={usage.agents.used}
              limit={usage.agents.limit}
            />
            <UsageBar
              label="Documents"
              icon={DocumentIcon}
              used={usage.documents.used}
              limit={usage.documents.limit}
            />
            <UsageBar
              label="Storage"
              icon={CircleStackIcon}
              used={usage.storage_mb.used}
              limit={usage.storage_mb.limit}
              unit="MB"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">No usage data available.</p>
        )}
      </motion.div>

      {/* ─── Section 3: Invoice History ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-gray-500" />
            Invoice History
          </h3>
        </div>

        {invoiceList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoiceList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-sm text-white font-medium">{inv.number || inv.id.slice(-8)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(inv.created)}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{formatAmount(inv.amount, inv.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : inv.status === 'open'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.invoice_pdf && (
                        <a
                          href={inv.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 justify-end"
                        >
                          Download
                          <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <CalendarDaysIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No invoices yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Invoices will appear here once you subscribe to a paid plan.
            </p>
          </div>
        )}
      </motion.div>

      {/* ─── Quick upgrade CTA (for free users) ─── */}
      {isFree && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-600/10 to-purple-600/10 border border-red-500/20 rounded-2xl p-8 text-center"
        >
          <SparklesIcon className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Unlock More with a Paid Plan</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Get more messages, agents, advanced analytics, lead generation, and API access starting at just ₹799/month.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/30"
          >
            View Pricing Plans
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
