import { motion } from 'motion/react';

// Rich Blue Pen Ink color for an authentic handwritten scribble look
const DRAW_COLOR = 'oklch(0.53 0.18 250)';

/**
 * Stickman sitting on a border edge (like the photo frame) and swinging legs.
 */
export function SittingStickman() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '-26px', // Sit on top border
        right: '25px',
        width: '35px',
        height: '45px',
        pointerEvents: 'none',
        zIndex: 10,
      }}
      className="mnote"
    >
      <svg viewBox="0 0 35 45" className="w-full h-full">
        {/* Head */}
        <circle cx="17.5" cy="8" r="4.5" fill="none" stroke={DRAW_COLOR} strokeWidth="1.2" />
        
        {/* Torso (slanted back slightly) */}
        <line x1="17.5" y1="12.5" x2="16" y2="28" stroke={DRAW_COLOR} strokeWidth="1.2" />
        
        {/* Arms resting on the frame edge */}
        <line x1="16" y1="16" x2="10" y2="28" stroke={DRAW_COLOR} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="16" y1="16" x2="23" y2="28" stroke={DRAW_COLOR} strokeWidth="1.2" strokeLinecap="round" />
        
        {/* Left Leg (Dangling and swinging) */}
        <motion.path
          d="M 16 28 L 13 36 L 13 44"
          fill="none"
          stroke={DRAW_COLOR}
          strokeWidth="1.2"
          strokeLinecap="round"
          animate={{ d: [
            "M 16 28 L 13 36 L 13 44",
            "M 16 28 L 14 36 L 17 43",
            "M 16 28 L 13 36 L 13 44"
          ] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Right Leg (Dangling and swinging with offset) */}
        <motion.path
          d="M 16 28 L 19 36 L 17 44"
          fill="none"
          stroke={DRAW_COLOR}
          strokeWidth="1.2"
          strokeLinecap="round"
          animate={{ d: [
            "M 16 28 L 19 36 L 17 44",
            "M 16 28 L 18 36 L 14 43",
            "M 16 28 L 19 36 L 17 44"
          ] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </svg>
    </div>
  );
}

/**
 * Stickman sitting cross-legged next to introduction text reading a research manuscript.
 */
export function ReadingStickman() {
  return (
    <div
      style={{
        position: 'absolute',
        left: '-100px',
        top: '60px',
        width: '45px',
        height: '45px',
        pointerEvents: 'none',
        zIndex: 10,
      }}
      className="mnote"
    >
      <svg viewBox="0 0 45 45" className="w-full h-full">
        {/* Ground Line */}
        <line x1="2" y1="36" x2="43" y2="36" stroke={DRAW_COLOR} strokeWidth="1.1" strokeLinecap="round" />
        
        {/* Head (nodding slowly while reading) */}
        <motion.circle
          cx="20" cy="18" r="3"
          fill="none" stroke={DRAW_COLOR} strokeWidth="1.1"
          animate={{ cy: [18, 19.2, 18] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Torso */}
        <line x1="20" y1="21" x2="20" y2="30" stroke={DRAW_COLOR} strokeWidth="1.1" />
        
        {/* Crossed Legs */}
        <path d="M 20 30 C 14 30, 11 36, 17 36" fill="none" stroke={DRAW_COLOR} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M 20 30 C 26 30, 29 36, 23 36" fill="none" stroke={DRAW_COLOR} strokeWidth="1.1" strokeLinecap="round" />
        
        {/* Arms holding the book */}
        <line x1="20" y1="24" x2="14" y2="28" stroke={DRAW_COLOR} strokeWidth="1.1" strokeLinecap="round" />
        <line x1="20" y1="24" x2="26" y2="28" stroke={DRAW_COLOR} strokeWidth="1.1" strokeLinecap="round" />
        
        {/* The Open Manuscript Book */}
        <path d="M 14 28 Q 20 25 26 28 L 27 32 Q 20 29 13 32 Z" fill="none" stroke={DRAW_COLOR} strokeWidth="1.1" strokeLinejoin="round" />
        
        {/* Page flipping animation */}
        <motion.path
          d="M 20 26.5 C 20 26.5, 20 26.5, 20 26.5"
          fill="none"
          stroke={DRAW_COLOR}
          strokeWidth="0.8"
          animate={{ d: [
            "M 20 26.5 C 20 26.5, 20 26.5, 20 26.5",
            "M 20 26.5 Q 18 21 16 26.5",
            "M 20 26.5 C 20 26.5, 20 26.5, 20 26.5"
          ] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </svg>
    </div>
  );
}

/**
 * Stickman juggling neural weights/nodes (Juggling Cascade) next to Results section.
 */
export function JugglingStickman() {
  return (
    <div
      style={{
        position: 'absolute',
        right: '-110px',
        top: '30px',
        width: '65px',
        height: '65px',
        pointerEvents: 'none',
        zIndex: 10,
      }}
      className="mnote"
    >
      <svg viewBox="0 0 60 60" className="w-full h-full">
        {/* Head */}
        <circle cx="30" cy="22" r="3.8" fill="none" stroke={DRAW_COLOR} strokeWidth="1.2" />
        
        {/* Torso */}
        <line x1="30" y1="25.8" x2="30" y2="40" stroke={DRAW_COLOR} strokeWidth="1.2" />
        
        {/* Legs */}
        <line x1="30" y1="40" x2="24" y2="54" stroke={DRAW_COLOR} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="30" y1="40" x2="36" y2="54" stroke={DRAW_COLOR} strokeWidth="1.2" strokeLinecap="round" />
        
        {/* Left Arm (Juggling hand movement) */}
        <motion.path
          d="M 30 28 L 22 32 L 20 38"
          fill="none"
          stroke={DRAW_COLOR}
          strokeWidth="1.2"
          strokeLinecap="round"
          animate={{ d: [
            "M 30 28 L 22 32 L 20 38",
            "M 30 28 L 20 30 L 17 34",
            "M 30 28 L 22 32 L 20 38"
          ] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Right Arm (Juggling hand movement - opposite phase) */}
        <motion.path
          d="M 30 28 L 38 32 L 40 38"
          fill="none"
          stroke={DRAW_COLOR}
          strokeWidth="1.2"
          strokeLinecap="round"
          animate={{ d: [
            "M 30 28 L 38 32 L 40 38",
            "M 30 28 L 40 30 L 43 34",
            "M 30 28 L 38 32 L 40 38"
          ] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />

        {/* Juggled Balls (Cascade loop) */}
        {/* Ball 1 */}
        <motion.circle
          r="1.8"
          fill="none"
          stroke={DRAW_COLOR}
          strokeWidth="1.2"
          animate={{ 
            cx: [19, 30, 41, 30, 19], 
            cy: [35, 10, 35, 10, 35] 
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
        {/* Ball 2 */}
        <motion.circle
          r="1.8"
          fill="none"
          stroke={DRAW_COLOR}
          strokeWidth="1.2"
          animate={{ 
            cx: [41, 30, 19, 30, 41], 
            cy: [35, 10, 35, 10, 35] 
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', delay: 0.6 }}
        />
        {/* Ball 3 */}
        <motion.circle
          r="1.8"
          fill="none"
          stroke={DRAW_COLOR}
          strokeWidth="1.2"
          animate={{ 
            cx: [30, 41, 30, 19, 30], 
            cy: [10, 35, 10, 35, 10] 
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', delay: 1.2 }}
        />
      </svg>
    </div>
  );
}

/**
 * Stickman sitting at a desk typing furiously on a laptop (floating code squiggles).
 */
export function TypingStickman() {
  return (
    <div
      style={{
        position: 'absolute',
        left: '-105px',
        top: '60px',
        width: '55px',
        height: '55px',
        pointerEvents: 'none',
        zIndex: 10,
      }}
      className="mnote"
    >
      <svg viewBox="0 0 50 50" className="w-full h-full">
        {/* Desk */}
        <line x1="4" y1="38" x2="46" y2="38" stroke={DRAW_COLOR} strokeWidth="1.1" strokeLinecap="round" />
        
        {/* Chair Stool */}
        <line x1="12" y1="38" x2="15" y2="28" stroke={DRAW_COLOR} strokeWidth="1.1" />
        <line x1="16" y1="38" x2="15" y2="28" stroke={DRAW_COLOR} strokeWidth="1.1" />
        <line x1="10" y1="28" x2="20" y2="28" stroke={DRAW_COLOR} strokeWidth="1.2" />

        {/* Laptop Screen & Keyboard */}
        <path d="M 30 38 L 38 38 L 41 28" fill="none" stroke={DRAW_COLOR} strokeWidth="1.1" strokeLinecap="round" />

        {/* Typist Body (slanted forward) */}
        <circle cx="16" cy="14" r="3.2" fill="none" stroke={DRAW_COLOR} strokeWidth="1.1" />
        <line x1="16" y1="17.2" x2="15" y2="28" stroke={DRAW_COLOR} strokeWidth="1.1" />
        {/* Legs */}
        <line x1="15" y1="28" x2="18" y2="38" stroke={DRAW_COLOR} strokeWidth="1.1" strokeLinecap="round" />
        <line x1="15" y1="28" x2="11" y2="33" stroke={DRAW_COLOR} strokeWidth="1.1" strokeLinecap="round" />

        {/* Left Hand typing */}
        <motion.path
          d="M 16 20 L 24 23 L 32 37"
          fill="none"
          stroke={DRAW_COLOR}
          strokeWidth="1.1"
          strokeLinecap="round"
          animate={{ d: [
            "M 16 20 L 24 23 L 32 37",
            "M 16 20 L 22 25 L 31 37",
            "M 16 20 L 24 23 L 32 37"
          ] }}
          transition={{ duration: 0.15, repeat: Infinity, ease: 'linear' }}
        />

        {/* Right Hand typing */}
        <motion.path
          d="M 16 20 L 25 21 L 33 37"
          fill="none"
          stroke={DRAW_COLOR}
          strokeWidth="1.1"
          strokeLinecap="round"
          animate={{ d: [
            "M 16 20 L 25 21 L 33 37",
            "M 16 20 L 23 23 L 34 37",
            "M 16 20 L 25 21 L 33 37"
          ] }}
          transition={{ duration: 0.15, repeat: Infinity, ease: 'linear', delay: 0.07 }}
        />

        {/* Floating code brackets/dots rising from laptop screen */}
        <motion.text
          x="39"
          y="23"
          fill={DRAW_COLOR}
          fontSize="6px"
          fontFamily="monospace"
          animate={{ y: [23, 13, 23], opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
        >
          {`{}`}
        </motion.text>
        <motion.text
          x="42"
          y="20"
          fill={DRAW_COLOR}
          fontSize="5px"
          fontFamily="monospace"
          animate={{ y: [20, 8, 20], opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
        >
          ;
        </motion.text>
      </svg>
    </div>
  );
}
