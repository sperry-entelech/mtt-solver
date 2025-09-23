import React from 'react';
import { motion } from 'framer-motion';

const HandHistoryAnalyzer: React.FC = () => {
  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Hand History Analyzer</h1>
        <p className="text-xl text-gray-400">
          Upload and analyze tournament hand histories with detailed ICM and strategic insights
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-600 rounded-full mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
        <p className="text-gray-400 mb-6">
          Advanced hand history analysis with ICM-aware decision evaluation
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Format Support</h3>
            <p className="text-gray-400 text-sm">
              Import histories from PokerStars, 888poker, partypoker, and more
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">ICM Analysis</h3>
            <p className="text-gray-400 text-sm">
              Evaluate decisions with tournament equity considerations
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Leak Detection</h3>
            <p className="text-gray-400 text-sm">
              Identify costly mistakes and optimization opportunities
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HandHistoryAnalyzer;