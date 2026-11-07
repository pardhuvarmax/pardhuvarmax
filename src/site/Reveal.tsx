import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export function Reveal({ children, delay = 0, y = 28, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Pointer-follow glow for cards: sets --mx/--my used by the .glow CSS class. */
export function glow(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
}

export function SectionHead({ id, kicker, title, children }: { id?: string; kicker: string; title: ReactNode; children?: ReactNode }) {
  return (
    <Reveal className="sec-head">
      <span className="kicker">{kicker}</span>
      <h2 id={id}>{title}</h2>
      {children && <p className="sec-lede">{children}</p>}
    </Reveal>
  );
}
