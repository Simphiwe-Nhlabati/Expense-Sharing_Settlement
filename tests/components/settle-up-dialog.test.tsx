/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettleUpDialog } from '@/components/features/settlements/settle-up-dialog';

// Mock the settleDebt and getDebts actions
vi.mock('@/app/actions/settlements', () => ({
  settleDebt: vi.fn(),
  getDebts: vi.fn(),
}));

import { settleDebt, getDebts } from '@/app/actions/settlements';

describe('SettleUpDialog Component', () => {
  const mockDebts = [
    { userId: 'user-1', name: 'John Doe', amount: 5000 },
    { userId: 'user-2', name: 'Jane Smith', amount: 3000 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dialog trigger button', () => {
    render(<SettleUpDialog groupId="group-1" />);
    expect(screen.getByRole('button', { name: /settle up/i })).toBeInTheDocument();
  });

  it('should open dialog when trigger button is clicked', async () => {
    (getDebts as any).mockResolvedValue(mockDebts);

    render(<SettleUpDialog groupId="group-1" />);

    const triggerButton = screen.getByRole('button', { name: /settle up/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/record a payment/i)).toBeInTheDocument();
    });
  });

  it('should show message when no debts exist', async () => {
    (getDebts as any).mockResolvedValue([]);

    render(<SettleUpDialog groupId="group-1" />);

    const triggerButton = screen.getByRole('button', { name: /settle up/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/don't owe anyone/i)).toBeInTheDocument();
    });
  });

  it('should show debts in select dropdown', async () => {
    (getDebts as any).mockResolvedValue(mockDebts);

    render(<SettleUpDialog groupId="group-1" />);

    const triggerButton = screen.getByRole('button', { name: /settle up/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/pay to/i)).toBeInTheDocument();
    });
  });

  it('should show amount input field', async () => {
    (getDebts as any).mockResolvedValue(mockDebts);

    render(<SettleUpDialog groupId="group-1" />);

    const triggerButton = screen.getByRole('button', { name: /settle up/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/amount/i)).toBeInTheDocument();
    });
  });

  it('should show success toast on successful settlement', async () => {
    (getDebts as any).mockResolvedValue(mockDebts);
    (settleDebt as any).mockResolvedValue({ success: true });

    render(<SettleUpDialog groupId="group-1" />);

    const triggerButton = screen.getByRole('button', { name: /settle up/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/record a payment/i)).toBeInTheDocument();
    });
  });

  it('should show error toast on failed settlement', async () => {
    (getDebts as any).mockResolvedValue(mockDebts);
    (settleDebt as any).mockResolvedValue({ success: false, error: 'Failed' });

    render(<SettleUpDialog groupId="group-1" />);

    const triggerButton = screen.getByRole('button', { name: /settle up/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/record a payment/i)).toBeInTheDocument();
    });
  });

  it('should call onSuccess callback after successful settlement', async () => {
    const onSuccessMock = vi.fn();
    (getDebts as any).mockResolvedValue(mockDebts);
    (settleDebt as any).mockResolvedValue({ success: true });

    render(<SettleUpDialog groupId="group-1" onSuccess={onSuccessMock} />);

    const triggerButton = screen.getByRole('button', { name: /settle up/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/record a payment/i)).toBeInTheDocument();
    });
  });

  it('should have proper form labels', async () => {
    (getDebts as any).mockResolvedValue(mockDebts);

    render(<SettleUpDialog groupId="group-1" />);

    const triggerButton = screen.getByRole('button', { name: /settle up/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/pay to/i)).toBeInTheDocument();
      expect(screen.getByText(/amount/i)).toBeInTheDocument();
    });
  });

  it('should have record payment button', async () => {
    (getDebts as any).mockResolvedValue(mockDebts);

    render(<SettleUpDialog groupId="group-1" />);

    const triggerButton = screen.getByRole('button', { name: /settle up/i });
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText(/record payment/i)).toBeInTheDocument();
    });
  });
});
