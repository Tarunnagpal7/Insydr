import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './auth.store';
import workspaceReducer from './workspace.store';

import agentReducer from './agent.store';

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  workspace: workspaceReducer,
  agent: agentReducer,
});

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
