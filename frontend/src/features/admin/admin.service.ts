import apiClient from '@/src/lib/api';

// ─── Types ───

export interface PlatformStats {
  total_users: number;
  total_workspaces: number;
  total_agents: number;
  active_agents: number;
  total_documents: number;
  total_conversations: number;
  total_messages: number;
  total_api_keys: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string | null;
}

export interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  owner_name: string;
  owner_email: string;
  agent_count: number;
  document_count: number;
  conversation_count: number;
  member_count: number;
  created_at: string | null;
}

export interface AdminAgent {
  id: string;
  name: string;
  agent_type: string;
  status: string;
  is_active: boolean;
  workspace_name: string;
  workspace_id: string;
  conversation_count: number;
  created_at: string | null;
}

export interface AdminConversation {
  id: string;
  agent_name: string;
  agent_id: string;
  workspace_id: string;
  session_id: string;
  status: string;
  hostname: string | null;
  page_title: string | null;
  message_count: number;
  started_at: string | null;
  created_at: string | null;
}

export interface AdminDocument {
  id: string;
  title: string;
  source_type: string;
  status: string;
  workspace_name: string;
  workspace_id: string;
  created_at: string | null;
}

export interface AdminMessage {
  id: string;
  role: string;
  content: string;
  confidence_score: number | null;
  token_count: number | null;
  response_time_ms: number | null;
  created_at: string | null;
}

export interface AdminConversationDetail extends AdminConversation {
  workspace_name: string;
  user_ip: string | null;
  user_agent: string | null;
  referrer_url: string | null;
  ended_at: string | null;
  messages: AdminMessage[];
}

export interface AdminDocumentChunk {
  id: string;
  chunk_index: number;
  content: string;
  token_count: number;
}

export interface AdminDocumentDetail extends AdminDocument {
  source_url: string | null;
  file_path: string | null;
  version_number: number;
  language: string | null;
  meta: any;
  updated_at: string | null;
  chunks: AdminDocumentChunk[];
}

export interface AdminUserDetail extends AdminUser {
  owned_workspaces: { id: string; name: string; slug: string; subscription_tier: string }[];
  memberships: { workspace_id: string; workspace_name: string; role: string; joined_at: string | null }[];
}

export interface AdminWorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  timezone: string;
  language: string;
  owner_name: string;
  owner_email: string;
  created_at: string | null;
  members: { user_id: string; email: string; full_name: string; role: string; joined_at: string | null }[];
  agents: { id: string; name: string; agent_type: string; is_active: boolean; created_at: string | null }[];
  documents: { id: string; title: string; source_type: string; status: string; created_at: string | null }[];
  api_keys: { id: string; name: string; key_prefix: string; is_active: boolean; requests_count: number; last_used_at: string | null; created_at: string | null }[];
  collections: { id: string; name: string; description: string | null }[];
}

export interface AdminAgentDetail {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  agent_type: string;
  status: string;
  is_active: boolean;
  version: string;
  workspace_name: string;
  workspace_id: string;
  conversation_count: number;
  message_count: number;
  configuration: any;
  behavior_settings: any;
  response_config: any;
  conversation_rules: any;
  allowed_domains: string[] | null;
  greeting_message: string | null;
  fallback_message: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  widget_config: { appearance: any; behavior: any; security: any } | null;
  knowledge_collections: { id: string; name: string }[];
}

export interface AdminApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  allowed_domains: string[] | null;
  requests_count: number;
  workspace_name: string;
  workspace_id: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string | null;
}

export interface AdminActivity {
  type: 'conversation' | 'document' | 'agent';
  id: string;
  label: string;
  hostname?: string;
  status?: string;
  timestamp: string | null;
}

export interface AdminAlert {
  hash: string;
  type: string;
  message: string;
  stack_trace: string;
  first_seen: number;
  last_seen: number;
  count: number;
  status: string;
  context: any;
}

export interface SystemHealth {
  status: string;
  app: string;
  database: string;
  redis: string;
  disk: string;
  uptime_seconds: number;
}

// ─── API Calls ───

export const getAdminStats = async (): Promise<PlatformStats> => {
  const response = await apiClient.get<PlatformStats>('/admin/stats');
  return response.data;
};

export const getAdminUsers = async (limit = 100, offset = 0): Promise<{ total: number; users: AdminUser[] }> => {
  const response = await apiClient.get('/admin/users', { params: { limit, offset } });
  return response.data;
};

export const getAdminUserDetail = async (id: string): Promise<AdminUserDetail> => {
  const response = await apiClient.get(`/admin/users/${id}`);
  return response.data;
};

export const getAdminWorkspaces = async (limit = 100, offset = 0): Promise<{ total: number; workspaces: AdminWorkspace[] }> => {
  const response = await apiClient.get('/admin/workspaces', { params: { limit, offset } });
  return response.data;
};

export const getAdminWorkspaceDetail = async (id: string): Promise<AdminWorkspaceDetail> => {
  const response = await apiClient.get(`/admin/workspaces/${id}`);
  return response.data;
};

export const getAdminAgents = async (limit = 100, offset = 0): Promise<{ total: number; agents: AdminAgent[] }> => {
  const response = await apiClient.get('/admin/agents', { params: { limit, offset } });
  return response.data;
};

export const getAdminAgentDetail = async (id: string): Promise<AdminAgentDetail> => {
  const response = await apiClient.get(`/admin/agents/${id}`);
  return response.data;
};

export const getAdminConversations = async (limit = 50, offset = 0): Promise<{ total: number; conversations: AdminConversation[] }> => {
  const response = await apiClient.get('/admin/conversations', { params: { limit, offset } });
  return response.data;
};

export const getAdminConversationDetail = async (id: string): Promise<AdminConversationDetail> => {
  const response = await apiClient.get(`/admin/conversations/${id}`);
  return response.data;
};

export const getAdminDocuments = async (limit = 100, offset = 0): Promise<{ total: number; documents: AdminDocument[] }> => {
  const response = await apiClient.get('/admin/documents', { params: { limit, offset } });
  return response.data;
};

export const getAdminDocumentDetail = async (id: string): Promise<AdminDocumentDetail> => {
  const response = await apiClient.get(`/admin/documents/${id}`);
  return response.data;
};

export const getAdminApiKeys = async (limit = 100, offset = 0): Promise<{ total: number; api_keys: AdminApiKey[] }> => {
  const response = await apiClient.get('/admin/api-keys', { params: { limit, offset } });
  return response.data;
};

export const getAdminActivity = async (limit = 20): Promise<{ activity: AdminActivity[] }> => {
  const response = await apiClient.get('/admin/activity', { params: { limit } });
  return response.data;
};

// ─── Operations ───

export const toggleAgentActive = async (agentId: string): Promise<{ id: string; is_active: boolean }> => {
  const response = await apiClient.patch(`/admin/agents/${agentId}/toggle`);
  return response.data;
};

export const deleteAdminUser = async (userId: string): Promise<{ deleted: boolean; id: string }> => {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
};

export const revokeAdminApiKey = async (keyId: string): Promise<{ revoked: boolean; id: string }> => {
  const response = await apiClient.delete(`/admin/api-keys/${keyId}`);
  return response.data;
};

// ─── Monitoring ───

export const getAdminHealth = async (): Promise<SystemHealth> => {
  const response = await apiClient.get<SystemHealth>('/health/readiness');
  return response.data;
};

export const getMonitoringAlerts = async (): Promise<{ alerts: AdminAlert[] }> => {
  const response = await apiClient.get('/admin/monitoring/alerts');
  return response.data;
};

export const resolveMonitoringAlert = async (errorHash: string): Promise<any> => {
  const response = await apiClient.post(`/admin/monitoring/alerts/${errorHash}/resolve`);
  return response.data;
};

