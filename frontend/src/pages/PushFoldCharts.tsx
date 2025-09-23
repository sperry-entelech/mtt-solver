import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PushFoldCharts: React.FC = () => {
  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Push/Fold Charts</h1>
        <p className="text-xl text-gray-400">
          Generate optimal push/fold charts based on ICM and stack sizes
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
        <p className="text-gray-400 mb-6">
          Comprehensive push/fold chart generation with ICM optimization
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">ICM Optimization</h3>
            <p className="text-gray-400 text-sm">
              Charts adjusted for tournament equity and bubble factors
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Stack Scenarios</h3>
            <p className="text-gray-400 text-sm">
              Generate charts for various stack size configurations
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Export & Print</h3>
            <p className="text-gray-400 text-sm">
              Export charts for offline study and tournament reference
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PushFoldCharts;