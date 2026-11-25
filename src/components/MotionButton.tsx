import { Children, type ButtonHTMLAttributes, type CSSProperties } from 'react';

// Letter roll adapted from AnimatedLabel in Reliaaaa/LandingPageReliaaaa (114b76f).
export function RollingLabel({ children: text }: { children: string }) {
  let index = 0;
  return (
    <span className="roll-label">
      <span className="roll-accessible">{text}</span>
      <span className="roll-visual" aria-hidden="true">
        {text.split(/(\s+)/).map((word, wordIndex) => /^\s+$/.test(word) ? word : (
          <span className="roll-word" key={wordIndex}>
            {Array.from(word, (letter, letterIndex) => (
              <span className="roll-letter" key={letterIndex} data-letter={letter}
                style={{ '--roll-index': Math.min(index++, 18) } as CSSProperties}>
                {letter}
              </span>
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}

export function MotionButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={['motion-button', className].filter(Boolean).join(' ')}>
      {Children.map(children, child => typeof child === 'string' && child.trim()
        ? <RollingLabel>{child.trim()}</RollingLabel>
        : child)}
    </button>
  );
}
