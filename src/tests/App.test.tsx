import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../app/App';

describe('Tactical Command Console App Shell', () => {
  beforeEach(() => {
    // Reset search params to default before each test
    window.history.replaceState({}, '', '/');
  });

  it('renders clean tactical command console in standard mode and starts game', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.game-shell')).toBeInTheDocument();
    expect(container.querySelector('.viewport-container')).toBeInTheDocument();
    expect(screen.queryByText(/TACTICAL COMMAND CONSOLE/i)).toBeNull();

    // Start game from Menu screen
    const playBtn = screen.getByRole('button', { name: /INITIATE ENGAGEMENT/i });
    fireEvent.click(playBtn);

    expect(screen.getByText(/SCORE/i)).toBeInTheDocument();
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });

  it('renders preview switchboard and mock telemetry when ?preview=1 is set in DEV', () => {
    window.history.replaceState({}, '', '/?preview=1');
    render(<App />);
    expect(screen.getByText(/PREVIEW SWITCHBOARD/i)).toBeInTheDocument();
    expect(screen.getByText(/1450/i)).toBeInTheDocument();
    const pausePreviewBtn = screen.getByRole('button', { name: /PREVIEW PAUSE/i });
    fireEvent.click(pausePreviewBtn);
    expect(screen.getByText(/COMBAT THREAD SUSPENDED/i)).toBeInTheDocument();
  });

  it('allows toggling reduced motion mode', () => {
    render(<App />);
    const playBtn = screen.getByRole('button', { name: /INITIATE ENGAGEMENT/i });
    fireEvent.click(playBtn);

    const pauseBtn = screen.getByRole('button', { name: /PAUSE · ESC/i });
    fireEvent.click(pauseBtn);

    const toggleBtn = screen.getByRole('button', { name: /REDUCED MOTION/i });
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /REDUCED MOTION \[ENABLED\]/i })).toBeInTheDocument();
  });
});
