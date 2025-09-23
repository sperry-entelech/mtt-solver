import React from 'react';
import { motion } from 'framer-motion';

const ScenarioBuilder: React.FC = () => {
  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Scenario Builder</h1>
        <p className="text-xl text-gray-400">
          Build and analyze custom tournament scenarios with detailed ICM calculations
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1v-1a2 2 0 114 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
        <p className="text-gray-400 mb-6">
          Advanced scenario building tools for tournament analysis
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Custom Tournaments</h3>
            <p className="text-gray-400 text-sm">
              Build tournaments with custom payout structures and blind levels
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Table Simulation</h3>
            <p className="text-gray-400 text-sm">
              Simulate complex multi-table tournament scenarios
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Strategy Testing</h3>
            <p className="text-gray-400 text-sm">
              Test different strategies against various opponent types
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ScenarioBuilder;