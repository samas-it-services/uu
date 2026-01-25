/**
 * Custom Render Utilities
 * Render components with providers for testing
 */

import { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { TestProviders, TestProvidersWithClient, createTestQueryClient } from './test-providers';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  queryClient?: QueryClient;
}

/**
 * Custom render function that wraps components with all necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const { initialRoute, queryClient: providedClient, ...renderOptions } = options;
  const queryClient = providedClient || createTestQueryClient();

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (providedClient) {
      return (
        <TestProvidersWithClient queryClient={providedClient}>
          {children}
        </TestProvidersWithClient>
      );
    }
    return <TestProviders initialRoute={initialRoute}>{children}</TestProviders>;
  };

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Re-export everything from @testing-library/react
 */
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { renderWithProviders as render };
