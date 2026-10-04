import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TacticalButton } from '@/ui/components/TacticalButton';
import { MetricCard } from '@/ui/components/MetricCard';
import { ActiveTargetReadout } from '@/ui/components/ActiveTargetReadout';
import { LoadingOverlay } from '@/ui/components/LoadingOverlay';
import { PauseModal } from '@/ui/components/PauseModal';
import { GameOverModal } from '@/ui/components/GameOverModal';

describe('TacticalButton Component', () => {
  it('renders button label and fires click handler', () => {
    const handleClick = vi.fn();
    render(<TacticalButton onClick={handleClick}>ENGAGE</TacticalButton>);
    const btn = screen.getByRole('button', { name: /ENGAGE/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', () => {
    const handleClick = vi.fn();
    render(
      <TacticalButton disabled onClick={handleClick}>
        LOCKED
      </TacticalButton>
    );
    const btn = screen.getByRole('button', { name: /LOCKED/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe('MetricCard Component', () => {
  it('renders telemetry label and value', () => {
    render(<MetricCard label="ACCURACY" value={98} suffix="%" variant="accent" />);
    expect(screen.getByText(/ACCURACY/i)).toBeInTheDocument();
    expect(screen.getByText('98')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });
});

describe('ActiveTargetReadout Component', () => {
  it('correctly segments typed, next, and remaining characters', () => {
    const { container } = render(
      <ActiveTargetReadout word="TARGET" typedIndex={2} isTargeted={true} />
    );

    // Characters at index 0 and 1 should have class 'word-plate-char-typed'
    const typedChars = container.querySelectorAll('.word-plate-char-typed');
    expect(typedChars.length).toBe(2);
    expect(typedChars[0]?.textContent).toBe('T');
    expect(typedChars[1]?.textContent).toBe('A');

    // Character at index 2 ('R') should have class 'word-plate-char-next'
    const nextChar = container.querySelector('.word-plate-char-next');
    expect(nextChar).not.toBeNull();
    expect(nextChar?.textContent).toBe('R');

    // Remaining characters ('G', 'E', 'T') should have class 'word-plate-char-remaining'
    const remainingChars = container.querySelectorAll('.word-plate-char-remaining');
    expect(remainingChars.length).toBe(3);
  });
});

describe('LoadingOverlay Component', () => {
  it('displays progress percentage and status message', () => {
    render(<LoadingOverlay progress={65} statusMessage="LOADING ASSETS" />);
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText(/LOADING ASSETS/i)).toBeInTheDocument();
  });
});

describe('PauseModal Component', () => {
  it('handles resume and reduced-motion toggle', () => {
    const handleResume = vi.fn();
    const handleToggle = vi.fn();
    render(
      <PauseModal
        onResume={handleResume}
        reducedMotion={false}
        onToggleReducedMotion={handleToggle}
      />
    );
    fireEvent.click(screen.getByText(/RESUME ENGAGEMENT/i));
    expect(handleResume).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText(/REDUCED MOTION/i));
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});

describe('GameOverModal Component', () => {
  it('displays summary metrics and triggers restart', () => {
    const handleRestart = vi.fn();
    render(
      <GameOverModal
        score={3200}
        wave={3}
        streak={14}
        accuracy={96}
        onRestart={handleRestart}
      />
    );
    expect(screen.getByText(/VESSEL DESTROYED/i)).toBeInTheDocument();
    expect(screen.getByText('3200')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/INITIALIZE NEW RUN/i));
    expect(handleRestart).toHaveBeenCalledTimes(1);
  });
});
