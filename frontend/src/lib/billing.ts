import apiClient from './api';

// ─── Types ───

export interface SubscriptionInfo {
  plan: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  payment_method: {
    brand: string | null;
    last4: string | null;
    exp_month: number | null;
    exp_year: number | null;
  } | null;
}

export interface UsageItem {
  used: number;
  limit: number; // -1 = unlimited
}

export interface UsageStats {
  plan: string;
  agents: UsageItem;
  messages: UsageItem;
  documents: UsageItem;
  storage_mb: UsageItem;
  conversations: UsageItem;
  billing_period_start: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  period_start: string | null;
  period_end: string | null;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
}

// ─── API Methods ───

export async function createCheckout(
  workspaceId: string,
  plan: string,
  interval: string = 'monthly'
): Promise<string> {
  const res = await apiClient.post('/billing/checkout', {
    workspace_id: workspaceId,
    plan,
    interval,
  });
  return res.data.url;
}

export async function syncCheckout(sessionId: string): Promise<void> {
  await apiClient.post('/billing/sync', { session_id: sessionId });
}

export async function createPortalSession(workspaceId: string): Promise<string> {
  const res = await apiClient.post('/billing/portal', {
    workspace_id: workspaceId,
  });
  return res.data.url;
}

export async function getSubscription(workspaceId: string): Promise<SubscriptionInfo> {
  const res = await apiClient.get(`/billing/subscription/${workspaceId}`);
  return res.data;
}

export async function getUsage(workspaceId: string): Promise<UsageStats> {
  const res = await apiClient.get(`/billing/usage/${workspaceId}`);
  return res.data;
}

export async function getInvoices(workspaceId: string): Promise<Invoice[]> {
  const res = await apiClient.get(`/billing/invoices/${workspaceId}`);
  return res.data;
}
