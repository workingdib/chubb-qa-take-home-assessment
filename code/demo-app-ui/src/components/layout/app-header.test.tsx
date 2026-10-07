import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/src/features/auth/stores/use-auth-store';
import { AppHeader } from './app-header';

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/src/features/theme/components/theme-picker', () => ({
  ThemePicker: () => null,
}));

vi.mock('@/src/components/connection-status-indicator', () => ({
  ConnectionStatusIndicator: () => null,
}));

describe('AppHeader logout', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    pushMock.mockReset();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.clear();

    useAuthStore.setState({
      user: {
        userId: 'claimant-123',
        email: 'claimant@example.com',
        name: 'Test Claimant',
        role: 'CLAIMANT',
      },
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('logs the user out only after the server accepts a CSRF-protected request', async () => {
    // Arrange
    document.cookie = 'XSRF-TOKEN=test-csrf-token; path=/';
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const user = userEvent.setup();
    render(<AppHeader />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    // Assert
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({
            'X-XSRF-TOKEN': 'test-csrf-token',
          }),
        })
      );
    });
    expect(screen.queryByText('Welcome, Test Claimant')).not.toBeInTheDocument();
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('keeps the user signed in when the server rejects logout', async () => {
    // Arrange
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));
    const user = userEvent.setup();
    render(<AppHeader />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    // Assert
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(screen.getByText('Welcome, Test Claimant')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeEnabled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
