'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { ThemeProvider } from '@/components/theme-provider';
import { NotificationProvider } from '@/components/ui/notification';
import '../i18n';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ThemeProvider>
    </Provider>
  );
}