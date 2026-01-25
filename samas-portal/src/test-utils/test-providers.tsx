/**
 * Test Providers Wrapper
 * Wraps components with all necessary providers for testing
 */

import { FC, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface TestProvidersProps {
  children: ReactNode;
  initialRoute?: string;
}

// Create a fresh QueryClient for each test
// eslint-disable-next-line react-refresh/only-export-components
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const TestProviders: FC<TestProvidersProps> = ({
  children,
  // initialRoute is reserved for future MemoryRouter usage
  initialRoute: _initialRoute = '/'
}) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Provider with custom QueryClient (for specific test scenarios)
interface TestProvidersWithClientProps {
  children: ReactNode;
  queryClient: QueryClient;
}

export const TestProvidersWithClient: FC<TestProvidersWithClientProps> = ({
  children,
  queryClient,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};
