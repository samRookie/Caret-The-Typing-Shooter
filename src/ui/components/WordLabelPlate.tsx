import React from 'react';

export interface WordLabelPlateProps {
  word: string;
  typedIndex?: number; // 0 means no character typed yet
  isTargeted?: boolean;
}

export const WordLabelPlate: React.FC<WordLabelPlateProps> = ({
  word,
  typedIndex = 0,
  isTargeted = false,
}) => {
  const chars = word.split('');

  return (
    <div
      className="word-plate-container"
      style={{
        borderColor: isTargeted ? 'var(--accent)' : 'var(--border)',
        boxShadow: isTargeted ? 'var(--glow-accent)' : '0 4px 16px rgba(0, 0, 0, 0.7)',
      }}
    >
      {chars.map((char, i) => {
        let charClass = 'word-plate-char-remaining';
        if (i < typedIndex) {
          charClass = 'word-plate-char-typed';
        } else if (i === typedIndex && isTargeted) {
          charClass = 'word-plate-char-next';
        }

        return (
          <span key={i} className={charClass}>
            {char}
          </span>
        );
      })}
    </div>
  );
};
