
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Agent, CreateAgentPayload, getAgents, getAgent, createAgent as createAgentService } from '@/src/features/agents/agents.service';

interface AgentState {
  agents: Agent[];
  currentAgent: Agent | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AgentState = {
  agents: [],
  currentAgent: null,
  isLoading: false,
  error: null,
};

export const fetchAgents = createAsyncThunk(
  'agent/fetchAgents',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      return await getAgents(workspaceId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch agents');
    }
  }
);

export const fetchAgent = createAsyncThunk(
  'agent/fetchAgent',
  async (agentId: string, { rejectWithValue }) => {
    try {
      return await getAgent(agentId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch agent');
    }
  }
);

export const createAgent = createAsyncThunk(
  'agent/createAgent',
  async ({ workspaceId, data }: { workspaceId: string; data: CreateAgentPayload }, { rejectWithValue }) => {
    try {
      return await createAgentService(workspaceId, data);
    } catch (error: any) {
      const message = error?.response?.data?.detail || error.message || 'Failed to create agent';
      return rejectWithValue(message);
    }
  }
);

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    clearCurrentAgent: (state) => {
      state.currentAgent = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Agents
      .addCase(fetchAgents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action: PayloadAction<Agent[]>) => {
        state.isLoading = false;
        state.agents = action.payload;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Agent
      .addCase(fetchAgent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAgent.fulfilled, (state, action: PayloadAction<Agent>) => {
        state.isLoading = false;
        state.currentAgent = action.payload;
      })
      .addCase(fetchAgent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Agent
      .addCase(createAgent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAgent.fulfilled, (state, action: PayloadAction<Agent>) => {
        state.isLoading = false;
        state.agents.push(action.payload);
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentAgent, clearError } = agentSlice.actions;
export default agentSlice.reducer;
