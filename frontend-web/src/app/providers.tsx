'use client';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '../store';
import { useEffect } from 'react';
import { fetchMe } from '../store/slices/authSlice';
import { useAppDispatch } from '../hooks/useRedux';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
});

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) dispatch(fetchMe());
  }, [dispatch]);
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AppInitializer>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: { background: '#282828', color: '#fff', border: '1px solid #535353' },
                success: { iconTheme: { primary: '#1db954', secondary: '#fff' } },
              }}
            />
          </AppInitializer>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
