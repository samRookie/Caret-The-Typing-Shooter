import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatCard } from '@/ui/components/StatCard';
import { BootStatusLine, resetBootStatusSession } from '@/ui/components/BootStatusLine';
import { ProgressChart } from '@/ui/components/ProgressChart';
import { SettingsModal } from '@/ui/components/SettingsModal';
import { GameOverModal } from '@/ui/components/GameOverModal';
import { RunRecord, historyStore } from '@/shared/history/historyStore';
import { settingsStore } from '@/shared/settings/settingsStore';

describe('P6 Tactical Telemetry, Charts & Settings Tests', () => {
  beforeEach(() => {
    resetBootStatusSession();
    historyStore.clear();
    settingsStore.resetSettings();
    document.documentElement.removeAttribute('data-reduced-motion');
  });

  describe('StatCard Component', () => {
    it('renders label, value, and formatted unit when qualified', () => {
      render(
        <StatCard
          label="BEST SCORE"
          value="1,450"
          unit="pts"
          variant="accent"
        />
      );

      expect(screen.getByText('BEST SCORE')).toBeInTheDocument();
      expect(screen.getByText('1,450')).toBeInTheDocument();
      expect(screen.getByText('pts')).toBeInTheDocument();
    });

    it('renders "--" and qualification hint when unqualified', () => {
      render(
        <StatCard
          label="BEST ACCURACY"
          value="95.5%"
          qualified={false}
          qualificationHint="< 100 keys"
          variant="success"
        />
      );

      expect(screen.getByText('BEST ACCURACY')).toBeInTheDocument();
      expect(screen.getByText('--')).toBeInTheDocument();
      expect(screen.getByText('< 100 keys')).toBeInTheDocument();
      expect(screen.queryByText('95.5%')).toBeNull();
    });
  });

  describe('BootStatusLine Component', () => {
    it('renders status text with aria-hidden="true" on first mount and hides on subsequent mounts', () => {
      const { unmount } = render(<BootStatusLine />);
      const el = screen.getByText(/SYSTEM ONLINE \/\/ READY/i);
      expect(el).toBeInTheDocument();
      expect(el).toHaveAttribute('aria-hidden', 'true');

      unmount();

      // Second mount in same session must not render
      const { container } = render(<BootStatusLine />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('ProgressChart Component', () => {
    const mockRuns: RunRecord[] = [
      { id: 1, endedAt: '', score: 100, wave: 1, maxStreak: 3, wordsDestroyed: 4, hits: 15, misses: 1, accuracy: 93.7, grossWpm: 20, netWpm: 18, durationSeconds: 30 },
      { id: 2, endedAt: '', score: 250, wave: 2, maxStreak: 5, wordsDestroyed: 8, hits: 30, misses: 2, accuracy: 93.7, grossWpm: 25, netWpm: 23, durationSeconds: 45 },
      { id: 3, endedAt: '', score: 400, wave: 2, maxStreak: 6, wordsDestroyed: 12, hits: 45, misses: 1, accuracy: 97.8, grossWpm: 30, netWpm: 28, durationSeconds: 60 },
      { id: 4, endedAt: '', score: 650, wave: 3, maxStreak: 8, wordsDestroyed: 18, hits: 65, misses: 3, accuracy: 95.5, grossWpm: 32, netWpm: 30, durationSeconds: 80 },
      { id: 5, endedAt: '', score: 950, wave: 4, maxStreak: 12, wordsDestroyed: 24, hits: 90, misses: 2, accuracy: 97.8, grossWpm: 35, netWpm: 34, durationSeconds: 100 },
    ];

    it('renders SVG chart with summary aria-label and accessible data table', () => {
      render(<ProgressChart runs={mockRuns} initialMetric="wave" />);

      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg.getAttribute('aria-label')).toContain('Recent wave trend over 5 runs');

      // Table for screen readers
      const table = screen.getByRole('table', { hidden: true });
      expect(table).toBeInTheDocument();
      expect(screen.getAllByRole('row', { hidden: true })).toHaveLength(6); // 1 header + 5 rows
    });

    it('allows switching metrics via buttons and arrow keys', () => {
      render(<ProgressChart runs={mockRuns} initialMetric="wave" />);

      const scoreRadio = screen.getByRole('radio', { name: 'SCORE' });
      fireEvent.click(scoreRadio);
      expect(scoreRadio).toHaveAttribute('aria-checked', 'true');

      // Arrow navigation
      fireEvent.keyDown(scoreRadio, { key: 'ArrowRight' });
      const accRadio = screen.getByRole('radio', { name: 'ACCURACY' });
      expect(accRadio).toHaveAttribute('aria-checked', 'true');
    });

    it('handles flat values without dividing by zero or throwing', () => {
      const flatRuns: RunRecord[] = [
        { id: 1, endedAt: '', score: 100, wave: 1, maxStreak: 1, wordsDestroyed: 1, hits: 1, misses: 0, accuracy: 100, grossWpm: 10, netWpm: 10, durationSeconds: 10 },
        { id: 2, endedAt: '', score: 100, wave: 1, maxStreak: 1, wordsDestroyed: 1, hits: 1, misses: 0, accuracy: 100, grossWpm: 10, netWpm: 10, durationSeconds: 10 },
      ];

      expect(() => render(<ProgressChart runs={flatRuns} />)).not.toThrow();
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('SettingsModal Component', () => {
    it('toggles combat SFX and reflects in settingsStore', () => {
      const onClose = vi.fn();
      render(<SettingsModal isOpen={true} onClose={onClose} />);

      const sfxBtn = screen.getByRole('button', { name: /ENABLED/i });
      fireEvent.click(sfxBtn);
      expect(settingsStore.getSettings().sfxEnabled).toBe(false);
      expect(screen.getByRole('button', { name: /MUTED/i })).toBeInTheDocument();
    });

    it('adjusts combat SFX volume slider and updates settingsStore', () => {
      const onClose = vi.fn();
      render(<SettingsModal isOpen={true} onClose={onClose} />);

      const slider = screen.getByRole('slider', { name: /Combat SFX Volume/i });
      fireEvent.change(slider, { target: { value: '0.8' } });
      expect(settingsStore.getSettings().sfxVolume).toBe(0.8);
    });

    it('handles career statistics reset with confirmation safeguard', () => {
      // Seed a run into store
      historyStore.append({
        id: 1,
        endedAt: new Date().toISOString(),
        score: 500,
        wave: 2,
        maxStreak: 5,
        wordsDestroyed: 10,
        hits: 40,
        misses: 2,
        accuracy: 95.2,
        grossWpm: 30,
        netWpm: 28,
        durationSeconds: 60,
      });
      expect(historyStore.load()).toHaveLength(1);

      const onStatsCleared = vi.fn();
      render(
        <SettingsModal
          isOpen={true}
          onClose={vi.fn()}
          onStatsCleared={onStatsCleared}
        />
      );

      const resetBtn = screen.getByRole('button', { name: /RESET CAREER STATISTICS/i });
      fireEvent.click(resetBtn);

      // Confirmation prompt must appear
      expect(screen.getByText(/CONFIRM PURGE ALL PILOT RECORDS/i)).toBeInTheDocument();

      // Cancel button should abort
      const cancelBtn = screen.getByRole('button', { name: /CANCEL/i });
      fireEvent.click(cancelBtn);
      expect(historyStore.load()).toHaveLength(1);

      // Confirm purge
      fireEvent.click(screen.getByRole('button', { name: /RESET CAREER STATISTICS/i }));
      const confirmBtn = screen.getByRole('button', { name: /CONFIRM PURGE/i });
      fireEvent.click(confirmBtn);

      expect(historyStore.load()).toHaveLength(0);
      expect(onStatsCleared).toHaveBeenCalledTimes(1);
    });
  });

  describe('GameOverModal Record Intelligence (Decision D13)', () => {
    it('renders "NEW RECORD! WAVE 0N REACHED" and best score banner when records are broken', () => {
      render(
        <GameOverModal
          score={2500}
          wave={5}
          streak={10}
          accuracy={95}
          evaluation={{
            isFirstRun: false,
            isNewWaveRecord: true,
            isNewScoreRecord: true,
            previousBestWave: 4,
            previousBestScore: 2000,
          }}
          comparison={{
            bestScore: 2500,
            bestWave: 5,
            prevScore: 1800,
            prevWave: 3,
          }}
          onRestart={vi.fn()}
        />
      );

      expect(screen.getByText(/NEW RECORD! WAVE 05 REACHED/i)).toBeInTheDocument();
      expect(screen.getByText(/★ NEW BEST SCORE: 2,500 PTS ★/i)).toBeInTheDocument();
      expect(screen.getByText(/THIS MISSION/i)).toBeInTheDocument();
      expect(screen.getByText(/CAREER BEST/i)).toBeInTheDocument();
      expect(screen.getByText(/PREVIOUS MISSION/i)).toBeInTheDocument();
    });

    it('renders "FIRST MISSION LOGGED · WAVE 0N" on the player\'s first ever run', () => {
      render(
        <GameOverModal
          score={500}
          wave={1}
          streak={4}
          accuracy={92}
          evaluation={{
            isFirstRun: true,
            isNewWaveRecord: false,
            isNewScoreRecord: false,
            previousBestWave: 0,
            previousBestScore: 0,
          }}
          onRestart={vi.fn()}
        />
      );

      expect(screen.getByText(/FIRST MISSION LOGGED · WAVE 01/i)).toBeInTheDocument();
      expect(screen.queryByText(/NEW RECORD/i)).toBeNull();
    });

    it('renders "VESSEL DESTROYED · WAVE 0N" when no career records were broken', () => {
      render(
        <GameOverModal
          score={300}
          wave={1}
          streak={3}
          accuracy={88}
          evaluation={{
            isFirstRun: false,
            isNewWaveRecord: false,
            isNewScoreRecord: false,
            previousBestWave: 6,
            previousBestScore: 3000,
          }}
          onRestart={vi.fn()}
        />
      );

      expect(screen.getByText(/VESSEL DESTROYED · WAVE 01/i)).toBeInTheDocument();
    });
  });
});
