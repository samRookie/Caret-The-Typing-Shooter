import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingOverlay } from '@/ui/components/LoadingOverlay';
import { MenuScreen } from '@/ui/components/MenuScreen';
import { PauseModal } from '@/ui/components/PauseModal';
import { GameOverModal } from '@/ui/components/GameOverModal';
import { GAME_TITLE, GAME_SUBTITLE, HOW_TO_PLAY_TEXT } from '@/shared/config/branding';

describe('8.B React Screens & Modals Tests', () => {
  describe('LoadingOverlay', () => {
    it('renders progress bar with proper aria attributes and updates progress', () => {
      const { rerender } = render(<LoadingOverlay progress={45} />);

      expect(screen.getByText(GAME_TITLE)).toBeInTheDocument();
      expect(screen.getByText(GAME_SUBTITLE)).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '45');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');

      rerender(<LoadingOverlay progress={90} />);
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(progressbar).toHaveAttribute('aria-valuenow', '90');
    });
  });

  describe('MenuScreen', () => {
    it('renders title, subtitle, difficulty radio group, how-to-play text, and handles Enter', () => {
      const onSelectDifficulty = vi.fn();
      const onPlay = vi.fn();

      render(
        <MenuScreen
          difficulty="normal"
          onSelectDifficulty={onSelectDifficulty}
          onPlay={onPlay}
        />
      );

      expect(screen.getByText(GAME_TITLE)).toBeInTheDocument();
      expect(screen.getByText(GAME_SUBTITLE)).toBeInTheDocument();
      expect(screen.getByText(HOW_TO_PLAY_TEXT)).toBeInTheDocument();

      // Check radio group
      const relaxedRadio = screen.getByDisplayValue('relaxed');
      const normalRadio = screen.getByDisplayValue('normal');
      const intenseRadio = screen.getByDisplayValue('intense');

      expect(normalRadio).toBeChecked();
      expect(relaxedRadio).not.toBeChecked();

      fireEvent.click(intenseRadio);
      expect(onSelectDifficulty).toHaveBeenCalledWith('intense');

      // Click play
      const playBtn = screen.getByRole('button', { name: /INITIATE ENGAGEMENT/i });
      fireEvent.click(playBtn);
      expect(onPlay).toHaveBeenCalledTimes(1);

      // Enter key triggers onPlay
      fireEvent.keyDown(window, { key: 'Enter' });
      expect(onPlay).toHaveBeenCalledTimes(2);
    });
  });

  describe('PauseModal', () => {
    it('renders as accessible dialog and handles actions', () => {
      const onResume = vi.fn();
      const onRestart = vi.fn();
      const onQuitToMenu = vi.fn();

      render(
        <PauseModal
          onResume={onResume}
          onRestart={onRestart}
          onQuitToMenu={onQuitToMenu}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      const resumeBtn = screen.getByRole('button', { name: /RESUME ENGAGEMENT/i });
      const restartBtn = screen.getByRole('button', { name: /RESTART RUN/i });
      const quitBtn = screen.getByRole('button', { name: /QUIT TO MENU/i });

      fireEvent.click(resumeBtn);
      expect(onResume).toHaveBeenCalledTimes(1);

      fireEvent.click(restartBtn);
      expect(onRestart).toHaveBeenCalledTimes(1);

      fireEvent.click(quitBtn);
      expect(onQuitToMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('GameOverModal', () => {
    it('renders metrics, seed, rating, and handles restart/menu actions', () => {
      const onRestart = vi.fn();
      const onQuitToMenu = vi.fn();

      render(
        <GameOverModal
          score={3500}
          wave={4}
          streak={15}
          accuracy={96}
          seed={1337}
          result={{
            outcome: 'defeat',
            score: 3500,
            wave: 4,
            wavesCompleted: 3,
            maxStreak: 15,
            wordsDestroyed: 12,
            wordsCompleted: 12,
            hits: 80,
            misses: 3,
            accuracy: 96,
            grossWpm: 48,
            netWpm: 48,
            wpm: 48,
            durationSeconds: 45,
            durationMs: 45000,
            rating: 'S',
          }}
          onRestart={onRestart}
          onQuitToMenu={onQuitToMenu}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      expect(screen.getByText('3500')).toBeInTheDocument();
      expect(screen.getByText('04')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('96%')).toBeInTheDocument();
      expect(screen.getByText('48')).toBeInTheDocument();
      expect(screen.getByText('GRADE S')).toBeInTheDocument();
      expect(screen.getByText('1337')).toBeInTheDocument();

      const restartBtn = screen.getByRole('button', { name: /RESTART/i });
      const quitBtn = screen.getByRole('button', { name: /RETURN TO COMMAND MENU/i });

      fireEvent.click(restartBtn);
      expect(onRestart).toHaveBeenCalledTimes(1);

      fireEvent.click(quitBtn);
      expect(onQuitToMenu).toHaveBeenCalledTimes(1);
    });
  });
});
