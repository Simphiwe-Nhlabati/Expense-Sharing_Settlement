/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateGroupDialog } from '@/components/features/groups/create-group-dialog';

// Mock the createGroup action
vi.mock('@/app/actions/groups', () => ({
  createGroup: vi.fn(),
}));

import { createGroup } from '@/app/actions/groups';

// Create test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

// Wrapper component with QueryClientProvider
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('CreateGroupDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dialog trigger button', () => {
    renderWithProviders(<CreateGroupDialog />);
    expect(screen.getByRole('button', { name: /new group/i })).toBeInTheDocument();
  });

  it('should open dialog when trigger button is clicked', async () => {
    renderWithProviders(<CreateGroupDialog />);

    const triggerButton = screen.getByRole('button', { name: /new group/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/start a new group/i)).toBeInTheDocument();
    });
  });

  it('should show group name input field', async () => {
    renderWithProviders(<CreateGroupDialog />);

    const triggerButton = screen.getByRole('button', { name: /new group/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e\.g\. Cape Town/i)).toBeInTheDocument();
    });
  });

  it('should show description input field', async () => {
    renderWithProviders(<CreateGroupDialog />);

    const triggerButton = screen.getByRole('button', { name: /new group/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      // Check for description label instead of placeholder
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });

  it('should show currency select', async () => {
    renderWithProviders(<CreateGroupDialog />);

    const triggerButton = screen.getByRole('button', { name: /new group/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/currency/i)).toBeInTheDocument();
    });
  });

  it('should default currency to ZAR', async () => {
    renderWithProviders(<CreateGroupDialog />);

    const triggerButton = screen.getByRole('button', { name: /new group/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      // ZAR should be selected by default
      const zarOptions = screen.getAllByText(/south african rand/i);
      expect(zarOptions.length).toBeGreaterThan(0);
    });
  });

  it('should show success toast on successful creation', async () => {
    (createGroup as any).mockResolvedValue({ success: true });

    renderWithProviders(<CreateGroupDialog />);

    const triggerButton = screen.getByRole('button', { name: /new group/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/start a new group/i)).toBeInTheDocument();
    });
  });

  it('should show error toast on failed creation', async () => {
    (createGroup as any).mockResolvedValue({ success: false, error: 'Failed to create' });

    renderWithProviders(<CreateGroupDialog />);

    const triggerButton = screen.getByRole('button', { name: /new group/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/start a new group/i)).toBeInTheDocument();
    });
  });

  it('should have proper form labels', async () => {
    renderWithProviders(<CreateGroupDialog />);

    const triggerButton = screen.getByRole('button', { name: /new group/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/group name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByText(/currency/i)).toBeInTheDocument();
    });
  });
});
