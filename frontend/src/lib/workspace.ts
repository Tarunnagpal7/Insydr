import api from './api';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  timezone: string;
  subscription_tier: string;
  owner_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  stats?: {
    total_agents: number;
    total_documents: number;
    total_conversations: number;
    total_messages: number;
  };
  role?: string;
}

export interface WorkspaceCreate {
  name: string;
  timezone?: string;
  settings?: Record<string, any>;
}

export interface WorkspaceUpdate {
  name?: string;
  logo_url?: string;
  timezone?: string;
  settings?: Record<string, any>;
}

export interface WorkspaceListResponse {
  workspaces: Workspace[];
  total: number;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: string;
  joined_at: string;
  user_email?: string;
  user_name?: string;
}

export interface WorkspaceMemberAdd {
  email: string;
  role?: string;
}

export const workspaceApi = {
  // Workspace CRUD
  getAll: () => api.get<WorkspaceListResponse>('/workspaces'),
  
  getById: (id: string) => api.get<Workspace>(`/workspaces/${id}`),
  
  create: (data: WorkspaceCreate) => api.post<Workspace>('/workspaces', data),
  
  update: (id: string, data: WorkspaceUpdate) => 
    api.patch<Workspace>(`/workspaces/${id}`, data),
  
  delete: (id: string) => api.delete(`/workspaces/${id}`),

  // Member Management
  addMember: (workspaceId: string, data: WorkspaceMemberAdd) =>
    api.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, data),
  
  getMembers: (workspaceId: string) =>
    api.get<{ members: WorkspaceMember[]; total: number }>(`/workspaces/${workspaceId}/members`),
  
  removeMember: (workspaceId: string, memberId: string) =>
    api.delete(`/workspaces/${workspaceId}/members/${memberId}`),
};
