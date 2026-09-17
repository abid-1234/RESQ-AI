/**
 * RESQ-AI — Single source of motion tokens
 * Prevents drift across MotionCursor / Pressable / Globe pulses
 */
export const easeOut = [0.16, 1, 0.3, 1] as const;
export const easeSpring = [0.34, 1.56, 0.64, 1] as const;

export const springSnappy = { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.6 };
export const springGentle = { type: 'spring' as const, stiffness: 220, damping: 26, mass: 0.8 };
export const springMolasses = { type: 'spring' as const, stiffness: 140, damping: 22, mass: 1 };

export const durations = { micro: 0.14, short: 0.22, medium: 0.42, long: 0.62, pulse: 2.8 } as const;

/* Framer Motion variants */
export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: durations.medium, ease: easeOut } },
};
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.32, ease: easeOut } },
};
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
export const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: easeOut } },
};

// CSS keyframe names exported for JS injection
export const rippleKeyframes = `
@keyframes rippleOut  { 0%{transform:scale(.35);opacity:.55} 100%{transform:scale(8.5);opacity:0} }
@keyframes rippleOut2 { 0%{transform:scale(.25);opacity:.32} 100%{transform:scale(11);opacity:0} }
@keyframes hazardPulse { 0%,100%{opacity:.11} 50%{opacity:.19} }
@keyframes sweepDash { 0%{stroke-dashoffset: 0} 100%{stroke-dashoffset: -28} }
`;
