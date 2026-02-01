import api from './api';

export interface ApiKey {
  id: string;
  workspace_id: string;
  name: string;
  key_prefix: string;
  allowed_domains: string[] | null;
  is_active: boolean;
  requests_count: number;
  last_used_at: string | null;
  created_at: string;
}

export interface ApiKeyCreate {
  name: string;
  allowed_domains?: string[];
}

export interface ApiKeyUpdate {
  name?: string;
  allowed_domains?: string[];
  is_active?: boolean;
}

export interface ApiKeyGenerated extends ApiKey {
  full_key: string;
}

export const apiKeyApi = {
  create: (workspaceId: string, data: ApiKeyCreate) => 
    api.post<ApiKeyGenerated>(`/workspaces/${workspaceId}/api-keys`, data),

  getAll: (workspaceId: string) => 
    api.get<ApiKey[]>(`/workspaces/${workspaceId}/api-keys`),

  update: (workspaceId: string, keyId: string, data: ApiKeyUpdate) => 
    api.patch<ApiKey>(`/workspaces/${workspaceId}/api-keys/${keyId}`, data),

  revoke: (workspaceId: string, keyId: string) => 
    api.delete(`/workspaces/${workspaceId}/api-keys/${keyId}`),
};
