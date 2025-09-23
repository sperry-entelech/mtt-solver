import { Variants, Transition } from 'framer-motion';

// Enhanced easing curves for futuristic feel
export const easings = {
  cyber: [0.175, 0.885, 0.32, 1.275],
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.175, 0.885, 0.42, 1.38],
} as const;

// Common animation durations
export const durations = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
} as const;

// Page transition variants
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: durations.slow,
      ease: easings.cyber,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
};

// Card hover animations
export const cardHover: Variants = {
  initial: {
    scale: 1,
    rotateY: 0,
    z: 0,
  },
  hover: {
    scale: 1.05,
    rotateY: 5,
    z: 50,
    transition: {
      duration: durations.normal,
      ease: easings.cyber,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: durations.fast,
      ease: easings.smooth,
    },
  },
};

// Button interactions
export const buttonVariants: Variants = {
  initial: {
    scale: 1,
    backgroundPosition: '0% 50%',
  },
  hover: {
    scale: 1.05,
    backgroundPosition: '100% 50%',
    transition: {
      duration: durations.normal,
      ease: easings.cyber,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: durations.fast,
      ease: easings.smooth,
    },
  },
};

// Stagger animation for lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    x: -10,
  },
  animate: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      duration: durations.normal,
      ease: easings.cyber,
    },
  },
};

// Slide animations
export const slideLeft: Variants = {
  initial: {
    x: -50,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: durations.slow,
      ease: easings.cyber,
    },
  },
  exit: {
    x: 50,
    opacity: 0,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
};

export const slideRight: Variants = {
  initial: {
    x: 50,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: durations.slow,
      ease: easings.cyber,
    },
  },
  exit: {
    x: -50,
    opacity: 0,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
};

// Fade animations
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slow,
      ease: easings.cyber,
    },
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
};

export const fadeInDown: Variants = {
  initial: {
    opacity: 0,
    y: -30,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slow,
      ease: easings.cyber,
    },
  },
  exit: {
    opacity: 0,
    y: 30,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
};

// Scale animations
export const scaleIn: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: durations.slow,
      ease: easings.bounce,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
};

// Modal/overlay animations
export const modalOverlay: Variants = {
  initial: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  animate: {
    opacity: 1,
    backdropFilter: 'blur(10px)',
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
};

export const modalContent: Variants = {
  initial: {
    scale: 0.9,
    opacity: 0,
    y: 20,
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slow,
      ease: easings.cyber,
    },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    y: 20,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
};

// Loader/spinner animations
export const spinRotate: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulseGlow: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: easings.smooth,
    },
  },
};

// Navigation animations
export const navItemHover: Variants = {
  initial: {
    x: 0,
    scale: 1,
  },
  hover: {
    x: 3,
    scale: 1.05,
    transition: {
      duration: durations.fast,
      ease: easings.cyber,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: durations.fast,
      ease: easings.smooth,
    },
  },
};

// Chart/data visualization animations
export const chartEnter: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: durations.slower,
      ease: easings.cyber,
      delay: 0.2,
    },
  },
};

// Floating elements
export const floatAnimation: Variants = {
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: easings.smooth,
    },
  },
};

// Glitch effect for errors or attention
export const glitchEffect: Variants = {
  animate: {
    x: [0, -2, 2, 0],
    skew: [0, 2, -2, 0],
    transition: {
      duration: 0.2,
      repeat: 3,
      ease: 'linear',
    },
  },
};

// Common transition presets
export const transitions = {
  cyber: {
    duration: durations.normal,
    ease: easings.cyber,
  },
  smooth: {
    duration: durations.normal,
    ease: easings.smooth,
  },
  bounce: {
    duration: durations.slow,
    ease: easings.bounce,
  },
  elastic: {
    duration: durations.slow,
    ease: easings.elastic,
  },
  spring: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
  } as Transition,
} as const;

// Utility functions for dynamic animations
export const createStagger = (delay: number = 0.1) => ({
  animate: {
    transition: {
      staggerChildren: delay,
      delayChildren: delay,
    },
  },
});

export const createSlideVariant = (
  direction: 'left' | 'right' | 'up' | 'down',
  distance: number = 50
): Variants => {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const multiplier = direction === 'right' || direction === 'down' ? 1 : -1;

  return {
    initial: {
      [axis]: distance * multiplier,
      opacity: 0,
    },
    animate: {
      [axis]: 0,
      opacity: 1,
      transition: {
        duration: durations.slow,
        ease: easings.cyber,
      },
    },
    exit: {
      [axis]: distance * -multiplier,
      opacity: 0,
      transition: {
        duration: durations.normal,
        ease: easings.smooth,
      },
    },
  };
};

export const createScaleVariant = (
  initialScale: number = 0.8,
  animateScale: number = 1
): Variants => ({
  initial: {
    scale: initialScale,
    opacity: 0,
  },
  animate: {
    scale: animateScale,
    opacity: 1,
    transition: {
      duration: durations.slow,
      ease: easings.bounce,
    },
  },
  exit: {
    scale: initialScale,
    opacity: 0,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
});