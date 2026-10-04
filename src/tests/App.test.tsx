import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../app/App';

// Mock Phaser so JSDOM doesn't attempt to load WebGL/Canvas pipelines
vi.mock('phaser', () => {
  return {
    default: {
      AUTO: 'AUTO',
      Scale: {
        RESIZE: 'RESIZE',
        CENTER_BOTH: 'CENTER_BOTH',
      },
      BlendModes: {
        ADD: 'ADD',
      },
      Scene: class MockScene {},
      Game: class MockGame {
        destroy = vi.fn();
      },
    },
  };
});

describe('Tactical Command Console App Shell', () => {
  it('renders tactical command HUD header and telemetry', () => {
    render(<App />);
    expect(screen.getByText(/TACTICAL COMMAND HUD/i)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 1 VISUAL FOUNDATION/i)).toBeInTheDocument();
    expect(screen.getByText(/SCORE/i)).toBeInTheDocument();
    expect(screen.getByText(/1450/i)).toBeInTheDocument();
  });

  it('allows toggling reduced motion mode', () => {
    render(<App />);
    const toggleBtn = screen.getByRole('button', { name: /REDUCED MOTION: OFF/i });
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(
      screen.getByRole('button', { name: /REDUCED MOTION: ON/i })
    ).toBeInTheDocument();
  });

  it('allows previewing the pause modal', () => {
    render(<App />);
    const pausePreviewBtn = screen.getByRole('button', { name: /PREVIEW PAUSE/i });
    fireEvent.click(pausePreviewBtn);
    expect(screen.getByText(/COMBAT THREAD SUSPENDED/i)).toBeInTheDocument();
  });
});
