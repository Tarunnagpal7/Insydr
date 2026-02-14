import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { workspaceApi, Workspace, WorkspaceCreate, WorkspaceUpdate, WorkspaceMember, WorkspaceMemberAdd, InvitationResponse } from '@/src/lib/workspace';

// Workspace State Interface
export interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  invitations: InvitationResponse[];
  members: WorkspaceMember[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
}

// Initial State
const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: null,
  invitations: [],
  members: [],
  isLoading: false,
  isCreating: false,
  error: null,
};

// Async Thunks
// ... (existing thunks)

export const fetchInvitations = createAsyncThunk(
  'workspace/fetchInvitations',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      const response = await workspaceApi.getInvitations(workspaceId);
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to fetch invitations';
      return rejectWithValue(message);
    }
  }
);

// Async Thunks
export const fetchWorkspaces = createAsyncThunk(
  'workspace/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await workspaceApi.getAll();
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to fetch workspaces';
      return rejectWithValue(message);
    }
  }
);

export const fetchWorkspace = createAsyncThunk(
  'workspace/fetchOne',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      const response = await workspaceApi.getById(workspaceId);
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to fetch workspace';
      return rejectWithValue(message);
    }
  }
);

export const createWorkspace = createAsyncThunk(
  'workspace/create',
  async (data: WorkspaceCreate, { rejectWithValue }) => {
    try {
      const response = await workspaceApi.create(data);
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to create workspace';
      return rejectWithValue(message);
    }
  }
);

export const updateWorkspace = createAsyncThunk(
  'workspace/update',
  async ({ id, data }: { id: string; data: WorkspaceUpdate }, { rejectWithValue }) => {
    try {
      const response = await workspaceApi.update(id, data);
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to update workspace';
      return rejectWithValue(message);
    }
  }
);

export const deleteWorkspace = createAsyncThunk(
  'workspace/delete',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      await workspaceApi.delete(workspaceId);
      return workspaceId;
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to delete workspace';
      return rejectWithValue(message);
    }
  }
);

// Member Thunks
export const fetchMembers = createAsyncThunk(
  'workspace/fetchMembers',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      const response = await workspaceApi.getMembers(workspaceId);
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to fetch members';
      return rejectWithValue(message);
    }
  }
);

export const inviteMember = createAsyncThunk(
  'workspace/inviteMember',
  async ({ workspaceId, data }: { workspaceId: string; data: WorkspaceMemberAdd }, { rejectWithValue }) => {
    try {
      const response = await workspaceApi.createInvitation(workspaceId, data);
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to invite member';
      return rejectWithValue(message);
    }
  }
);

export const removeMember = createAsyncThunk(
  'workspace/removeMember',
  async ({ workspaceId, memberId }: { workspaceId: string; memberId: string }, { rejectWithValue }) => {
    try {
      await workspaceApi.removeMember(workspaceId, memberId);
      return memberId;
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to remove member';
      return rejectWithValue(message);
    }
  }
);

// Workspace Slice
const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setCurrentWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.currentWorkspace = action.payload;
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('current_workspace', JSON.stringify(action.payload));
      }
    },
    clearCurrentWorkspace: (state) => {
      state.currentWorkspace = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('current_workspace');
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Workspaces
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workspaces = action.payload.workspaces;
        
        // Auto-select first workspace if none selected
        if (!state.currentWorkspace && action.payload.workspaces.length > 0) {
          state.currentWorkspace = action.payload.workspaces[0];
          if (typeof window !== 'undefined') {
            localStorage.setItem('current_workspace', JSON.stringify(action.payload.workspaces[0]));
          }
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Single Workspace
    builder
      .addCase(fetchWorkspace.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkspace.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWorkspace = action.payload;
        
        // Update in workspaces list
        const index = state.workspaces.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.workspaces[index] = action.payload;
        }
      })
      .addCase(fetchWorkspace.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Workspace
    builder
      .addCase(createWorkspace.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.isCreating = false;
        state.workspaces.unshift(action.payload);
        state.currentWorkspace = action.payload;
        if (typeof window !== 'undefined') {
          localStorage.setItem('current_workspace', JSON.stringify(action.payload));
        }
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });

    // Update Workspace
    builder
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        const index = state.workspaces.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.workspaces[index] = action.payload;
        }
        if (state.currentWorkspace?.id === action.payload.id) {
          state.currentWorkspace = action.payload;
          if (typeof window !== 'undefined') {
            localStorage.setItem('current_workspace', JSON.stringify(action.payload));
          }
        }
      })
      .addCase(updateWorkspace.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Delete Workspace
    builder
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.workspaces = state.workspaces.filter(w => w.id !== action.payload);
        if (state.currentWorkspace?.id === action.payload) {
          state.currentWorkspace = state.workspaces[0] || null;
          if (typeof window !== 'undefined') {
            if (state.workspaces[0]) {
              localStorage.setItem('current_workspace', JSON.stringify(state.workspaces[0]));
            } else {
              localStorage.removeItem('current_workspace');
            }
          }
        }
      })
      .addCase(deleteWorkspace.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Invitations
    builder
        .addCase(fetchInvitations.fulfilled, (state, action) => {
            state.invitations = action.payload;
        })
        .addCase(inviteMember.fulfilled, (state, action) => {
            state.invitations.push(action.payload);
        });

    // Members
    builder
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.members = action.payload.members;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.members = state.members.filter(m => m.id !== action.payload);
      });
  },
});

export const { setCurrentWorkspace, clearCurrentWorkspace, clearError } = workspaceSlice.actions;
export const fetchWorkspaceById = fetchWorkspace; // Alias for clarity
export default workspaceSlice.reducer;

