'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { ThemeProvider } from '@/components/theme-provider';
import { NotificationProvider } from '@/components/ui/notification';
import { ErrorBoundary } from '@/components/error-boundary';
import '../i18n';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}