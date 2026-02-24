/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModeToggle } from '@/components/mode-toggle';
import { ThemeProvider } from 'next-themes';
import React from 'react';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ModeToggle Component', () => {
    it('renders correctly', () => {
        render(<ModeToggle />);
        expect(screen.getByRole('button')).toBeDefined();
        expect(screen.getByText(/Toggle theme/i)).toBeDefined();
    });
});
