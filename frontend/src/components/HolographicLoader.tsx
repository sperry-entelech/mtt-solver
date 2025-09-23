import React from 'react';
import { motion } from 'framer-motion';

interface HolographicLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const HolographicLoader: React.FC<HolographicLoaderProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-neon-cyan/30"
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: {
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          },
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />

      {/* Inner ring */}
      <motion.div
        className="absolute inset-2 rounded-full border border-neon-blue/50"
        animate={{
          rotate: -360,
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          },
          opacity: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />

      {/* Center core */}
      <motion.div
        className="absolute inset-4 rounded-full bg-neon-cyan/20 shadow-neon-cyan"
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Orbiting dots */}
      {[0, 120, 240].map((rotation, index) => (
        <motion.div
          key={index}
          className="absolute top-1/2 left-1/2"
          style={{
            transformOrigin: '0 0',
          }}
          animate={{
            rotate: 360 + rotation,
          }}
          transition={{
            duration: 2 + index * 0.5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <motion.div
            className={`${dotSize[size]} bg-neon-green rounded-full shadow-neon-green`}
            style={{
              x: size === 'sm' ? 20 : size === 'md' ? 28 : 36,
              y: -1,
            }}
            animate={{
              scale: [0.5, 1, 0.5],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.2,
            }}
          />
        </motion.div>
      ))}

      {/* Data stream lines */}
      <motion.div
        className="absolute top-0 left-1/2 w-px h-4 bg-gradient-to-t from-neon-purple to-transparent"
        animate={{
          opacity: [0, 1, 0],
          scaleY: [0, 1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-0 left-1/2 w-px h-4 bg-gradient-to-b from-neon-purple to-transparent"
        animate={{
          opacity: [0, 1, 0],
          scaleY: [0, 1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.75,
        }}
      />

      <motion.div
        className="absolute left-0 top-1/2 h-px w-4 bg-gradient-to-l from-neon-purple to-transparent"
        animate={{
          opacity: [0, 1, 0],
          scaleX: [0, 1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.25,
        }}
      />

      <motion.div
        className="absolute right-0 top-1/2 h-px w-4 bg-gradient-to-r from-neon-purple to-transparent"
        animate={{
          opacity: [0, 1, 0],
          scaleX: [0, 1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
    </div>
  );
};

export default HolographicLoader;