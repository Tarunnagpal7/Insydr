"use client";

import { Provider } from 'react-redux';
import { store } from '@/src/store';
import { useEffect } from 'react';
import { initializeAuth } from '@/src/store/auth.store';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(initializeAuth());
  }, []);

  return <>{children}</>;
}

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        {children}
      </AuthInitializer>
    </Provider>
  );
}
