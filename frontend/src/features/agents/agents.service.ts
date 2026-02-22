import apiClient from '@/src/lib/api';

export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  agent_type: string;
  status: string;
  is_active: boolean;
  version: string;
  avatar_url?: string | null;
  configuration?: any;
  behavior_settings?: BehaviorSettings;
  response_config?: ResponseConfig;
  conversation_rules?: ConversationRules;
  allowed_domains?: string[];
  greeting_message?: string;
  created_at: string;
  updated_at: string;
}

export interface BehaviorSettings {
  tone?: string;
  response_style?: string;
  temperature?: number;
}

export interface AgentTypeInfo {
  label: string;
  description: string;
  suggested_greeting: string;
  default_behavior: BehaviorSettings;
}

export interface ResponseConfig {
  max_length?: number;
  confidence_threshold?: number;
  fallback_message?: string;
  show_citations?: boolean;
  response_format?: string; // 'paragraphs' | 'bullets' | 'numbered' | 'mixed'
}

export interface ConversationRules {
  allowed_topics?: string[];
  blocked_words?: string[];
  greeting_message?: string;
  end_message?: string;
  cta_email?: string;
  cta_email_verified?: boolean;
}

export interface CreateAgentPayload {
  name: string;
  description?: string;
  agent_type: string;
  configuration?: Record<string, any>;
  behavior_settings?: Record<string, any>;
  response_config?: ResponseConfig;
  conversation_rules?: ConversationRules;
  document_ids?: string[];
  allowed_domains?: string[];
}

export interface AgentLimitInfo {
  can_create: boolean;
  current_count: number;
  max_allowed: number; // -1 means unlimited
  tier: string;
}

export const getAgentTypes = async (): Promise<Record<string, AgentTypeInfo>> => {
  const response = await apiClient.get<Record<string, AgentTypeInfo>>('/agents/types');
  return response.data;
};

export const getAgents = async (workspaceId: string): Promise<Agent[]> => {
  const response = await apiClient.get<Agent[]>('/agents/', {
    params: { workspace_id: workspaceId },
  });
  return response.data;
};

export const getAgent = async (agentId: string): Promise<Agent> => {
  const response = await apiClient.get<Agent>(`/agents/${agentId}`);
  return response.data;
};

export const createAgent = async (workspaceId: string, payload: CreateAgentPayload): Promise<Agent> => {
  const response = await apiClient.post<Agent>('/agents/', payload, {
    params: { workspace_id: workspaceId },
  });
  return response.data;
};

export const deleteAgent = async (agentId: string): Promise<void> => {
  await apiClient.delete(`/agents/${agentId}`);
};

export const updateAgent = async (agentId: string, payload: Partial<CreateAgentPayload> & { status?: string; is_active?: boolean }): Promise<Agent> => {
  const response = await apiClient.patch<Agent>(`/agents/${agentId}`, payload);
  return response.data;
};

export const getAgentLimit = async (workspaceId: string): Promise<AgentLimitInfo> => {
  const response = await apiClient.get<AgentLimitInfo>('/agents/limit', {
    params: { workspace_id: workspaceId },
  });
  return response.data;
};

export const uploadAgentAvatar = async (agentId: string, file: File): Promise<Agent> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<Agent>(`/agents/${agentId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteAgentAvatar = async (agentId: string): Promise<Agent> => {
  const response = await apiClient.delete<Agent>(`/agents/${agentId}/avatar`);
  return response.data;
};

export const toggleAgentActive = async (agentId: string): Promise<Agent> => {
  const response = await apiClient.patch<Agent>(`/agents/${agentId}/toggle-active`);
  return response.data;
};

export const chatWithAgent = async (agentId: string, message: string): Promise<string> => {
  const response = await apiClient.post<{ response: string }>(`/agents/${agentId}/chat`, {
    message: message,
    agent_id: agentId 
  });
  return response.data.response;
};

// ─── CTA Email Verification ───

export const sendCtaEmailOtp = async (agentId: string, email: string): Promise<{ message: string }> => {
  const response = await apiClient.post(`/agents/${agentId}/cta-email/send-otp`, { email });
  return response.data;
};

export const verifyCtaEmailOtp = async (agentId: string, email: string, otp: string): Promise<{ message: string; verified: boolean }> => {
  const response = await apiClient.post(`/agents/${agentId}/cta-email/verify-otp`, { email, otp });
  return response.data;
};

