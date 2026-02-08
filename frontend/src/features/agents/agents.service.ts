import apiClient from '@/src/lib/api';

export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  status: string;
  version: string;
  configuration?: any;
  behavior_settings?: any;
  allowed_domains?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateAgentPayload {
  name: string;
  description?: string;
  agent_type: string;
  configuration?: Record<string, any>;
  behavior_settings?: Record<string, any>;
  document_ids?: string[];
  allowed_domains?: string[];
}

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

export const updateAgent = async (agentId: string, payload: Partial<CreateAgentPayload> & { status?: string }): Promise<Agent> => {
  const response = await apiClient.patch<Agent>(`/agents/${agentId}`, payload);
  return response.data;
};

export const chatWithAgent = async (agentId: string, message: string): Promise<string> => {
  const response = await apiClient.post<{ response: string }>(`/agents/${agentId}/chat`, {
    message: message,
    agent_id: agentId 
  });
  return response.data.response;
};
