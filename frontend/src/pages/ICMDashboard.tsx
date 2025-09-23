import React from 'react';
import { motion } from 'framer-motion';

const ICMDashboard: React.FC = () => {
  return (
    <motion.div
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-4xl font-bold text-neon-cyan mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        ICM Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tournament Setup */}
        <motion.div
          className="card-futuristic p-6"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-neon-blue mb-4">Tournament Setup</h2>
          <p className="text-gray-300">Configure your tournament parameters here.</p>
          {/* Placeholder for tournament setup form */}
          <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-neon-cyan/20">
            <p className="text-neon-cyan">🚧 Tournament setup form coming soon...</p>
          </div>
        </motion.div>

        {/* ICM Results */}
        <motion.div
          className="card-futuristic p-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-neon-green mb-4">ICM Values</h2>
          <p className="text-gray-300">Real-time ICM calculations will appear here.</p>
          {/* Placeholder for ICM results */}
          <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-neon-green/20">
            <p className="text-neon-green">📊 ICM calculations ready to deploy...</p>
          </div>
        </motion.div>

        {/* Push/Fold Analysis */}
        <motion.div
          className="card-futuristic p-6 lg:col-span-2"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-neon-purple mb-4">Push/Fold Analysis</h2>
          <p className="text-gray-300">Optimal tournament decisions based on ICM.</p>
          {/* Placeholder for push/fold analysis */}
          <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-neon-purple/20">
            <p className="text-neon-purple">🎯 Strategy engine ready for action...</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ICMDashboard;