import { useMemo } from 'react';

// Animation variants for consistent motion design
export const useAnimations = () => {
  return useMemo(() => ({
    // Card hover animations
    cardHover: {
      initial: { scale: 1, rotate: 0, y: 0 },
      hover: {
        scale: 1.05,
        rotate: 2,
        y: -5,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20
        }
      },
      tap: {
        scale: 0.98,
        transition: { duration: 0.1 }
      }
    },

    // Button animations
    buttonPrimary: {
      initial: { scale: 1, boxShadow: "0 0 0px rgba(0, 255, 255, 0)" },
      hover: {
        scale: 1.02,
        boxShadow: "0 0 20px rgba(0, 255, 255, 0.4)",
        transition: { duration: 0.2 }
      },
      tap: {
        scale: 0.98,
        transition: { duration: 0.1 }
      }
    },

    // Panel slide in animations
    slideInLeft: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -50 },
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },

    slideInRight: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 50 },
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },

    slideInUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 50 },
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },

    // Stagger children animations
    staggerChildren: {
      animate: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1
        }
      }
    },

    // Floating animation for particles
    floating: {
      initial: { y: 0 },
      animate: {
        y: [-10, 10, -10],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    },

    // Pulse animation for important elements
    pulse: {
      initial: { scale: 1, opacity: 0.8 },
      animate: {
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    },

    // Loading spinner animation
    spinner: {
      animate: {
        rotate: 360,
        transition: {
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }
      }
    }
  }), []);
};

// Custom hook for hover animations with dynamic values
export const useHoverAnimation = (config: {
  scale?: number;
  rotate?: number;
  y?: number;
  duration?: number;
}) => {
  return useMemo(() => ({
    initial: {
      scale: 1,
      rotate: 0,
      y: 0
    },
    hover: {
      scale: config.scale || 1.05,
      rotate: config.rotate || 0,
      y: config.y || 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: config.duration || 0.2
      }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  }), [config]);
};

// Animation presets for common UI elements
export const animationPresets = {
  // Subtle hover for cards
  cardSubtle: {
    scale: 1.02,
    y: -2,
    duration: 0.2
  },

  // Strong hover for buttons
  buttonStrong: {
    scale: 1.05,
    y: -3,
    duration: 0.2
  },

  // Rotate hover for interactive elements
  rotate: {
    scale: 1.03,
    rotate: 2,
    duration: 0.3
  }
};