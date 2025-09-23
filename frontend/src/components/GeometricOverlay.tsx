import React from 'react';
import { motion } from 'framer-motion';

const GeometricOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-neon-cyan/20 rotate-45"
        animate={{
          rotate: [45, 225, 45],
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute top-3/4 right-1/4 w-24 h-24 border-2 border-neon-blue/20 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 360, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute top-1/2 right-1/6 w-16 h-16 border-2 border-neon-green/20"
        style={{
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
        }}
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Circuit-like lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#0099ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8800ff" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Animated circuit paths */}
        <motion.path
          d="M50 100 L200 100 L200 250 L400 250 L400 150 L600 150"
          stroke="url(#circuitGradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="10,5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            repeatType: "reverse"
          }}
        />

        <motion.path
          d="M100 300 L300 300 L300 450 L500 450 L500 350 L700 350"
          stroke="url(#circuitGradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="15,10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            repeatType: "reverse",
            delay: 1
          }}
        />

        {/* Circuit nodes */}
        <motion.circle
          cx="200"
          cy="100"
          r="4"
          fill="#00ffff"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.circle
          cx="400"
          cy="250"
          r="3"
          fill="#0099ff"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />

        <motion.circle
          cx="500"
          cy="450"
          r="5"
          fill="#8800ff"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </svg>

      {/* Corner accent elements */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <motion.div
          className="w-full h-full border-l-2 border-t-2 border-neon-cyan/30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <div className="absolute top-4 left-4 w-3 h-3 bg-neon-cyan/50 rounded-full animate-pulse" />
      </div>

      <div className="absolute top-0 right-0 w-32 h-32">
        <motion.div
          className="w-full h-full border-r-2 border-t-2 border-neon-blue/30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
        />
        <div className="absolute top-4 right-4 w-3 h-3 bg-neon-blue/50 rounded-full animate-pulse" />
      </div>

      <div className="absolute bottom-0 left-0 w-32 h-32">
        <motion.div
          className="w-full h-full border-l-2 border-b-2 border-neon-green/30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
        />
        <div className="absolute bottom-4 left-4 w-3 h-3 bg-neon-green/50 rounded-full animate-pulse" />
      </div>

      <div className="absolute bottom-0 right-0 w-32 h-32">
        <motion.div
          className="w-full h-full border-r-2 border-b-2 border-neon-purple/30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
        />
        <div className="absolute bottom-4 right-4 w-3 h-3 bg-neon-purple/50 rounded-full animate-pulse" />
      </div>

      {/* Data stream effect */}
      <motion.div
        className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-neon-cyan/30 to-transparent"
        animate={{
          x: [0, window.innerWidth || 1920],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 2
        }}
      />

      <motion.div
        className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent"
        animate={{
          y: [0, window.innerHeight || 1080],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 3,
          delay: 1
        }}
      />
    </div>
  );
};

export default GeometricOverlay;