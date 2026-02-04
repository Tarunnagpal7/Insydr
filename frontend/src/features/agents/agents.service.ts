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
  created_at: string;
  updated_at: string;
}

export interface CreateAgentData {
  name: string;
  description?: string;
  agent_type?: string;
  configuration?: any;
  behavior_settings?: any;
}

export const getAgents = async (workspaceId: string): Promise<Agent[]> => {
  const response = await apiClient.get('/agents', {
    params: { workspace_id: workspaceId }
  });
  return response.data;
};

export const createAgent = async (workspaceId: string, data: CreateAgentData): Promise<Agent> => {
  const response = await apiClient.post('/agents', data, {
    params: { workspace_id: workspaceId }
  });
  return response.data;
};

export const getAgent = async (agentId: string): Promise<Agent> => {
  const response = await apiClient.get(`/agents/${agentId}`);
  return response.data;
};

export const chatWithAgent = async (agentId: string, message: string): Promise<string> => {
  const response = await apiClient.post(`/agents/${agentId}/chat`, {
    message,
    agent_id: agentId
  });
  return response.data.response;
};
