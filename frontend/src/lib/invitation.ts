import api from './api';
import { WorkspaceMember, InvitationResponse } from './workspace';

export interface InvitationDetails {
  invitation: InvitationResponse;
  workspace_name: string;
  inviter_name: string;
}

export const invitationApi = {
  getDetails: (token: string) => api.get<InvitationDetails>(`/invitations/${token}`),
  accept: (token: string) => api.post<WorkspaceMember>(`/invitations/${token}/accept`),
};
