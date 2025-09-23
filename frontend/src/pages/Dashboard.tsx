import React from 'react';
import { motion } from 'framer-motion';
import ICMDashboard from "./ICMDashboard";
import { useQuery } from '@tanstack/react-query';
import { healthApi, icmApi } from '../utils/api';
import {
  ChartBarIcon,
  CalculatorIcon,
  CurrencyDollarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  // Health check
  const { data: healthStatus } = useQuery({
    queryKey: ['health'],
    queryFn: () => healthApi.check(),
    refetchInterval: 60000, // Check every minute
  });

  // Common ICM scenarios
  const { data: commonScenarios } = useQuery({
    queryKey: ['icm-scenarios'],
    queryFn: () => icmApi.getScenarios(),
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const quickStats = [
    {
      name: 'ICM Calculations',
      value: '2,847',
      change: '+12%',
      changeType: 'positive',
      icon: CalculatorIcon,
    },
    {
      name: 'Hands Analyzed',
      value: '1,329',
      change: '+8%',
      changeType: 'positive',
      icon: ChartBarIcon,
    },
    {
      name: 'Expected Value',
      value: '$12,450',
      change: '+15%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Win Rate',
      value: '23.4%',
      change: '+2.1%',
      changeType: 'positive',
      icon: TrophyIcon,
    },
  ];

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          MTT Poker Solver Dashboard
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Professional tournament poker analysis with ICM calculations,
          hand evaluation, and optimal strategy generation.
        </p>
      </motion.div>

      {/* Status and Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div
            key={stat.name}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {stat.value}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm">
                      <span className="text-green-400">{stat.change}</span>
                      <span className="text-gray-500 ml-1">from last week</span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* System Status */}
      <motion.div variants={itemVariants}>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                healthStatus?.status === 200 ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className="text-gray-300">
                System Status: {healthStatus?.status === 200 ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main ICM Dashboard */}
      <motion.div variants={itemVariants}>
        <ICMDashboard />
      </motion.div>

      {/* Common Scenarios */}
      {commonScenarios?.data && (
        <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Common ICM Scenarios</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {commonScenarios.data.data.map((scenario: any, index: number) => (
              <div
                key={index}
                className="bg-gray-900/50 rounded-lg p-4 border border-gray-600"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {scenario.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {scenario.description}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Stacks:</span>
                    <span className="text-white font-mono">
                      {scenario.stacks.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Payouts:</span>
                    <span className="text-green-400 font-mono">
                      ${scenario.payouts.join(', $')}
                    </span>
                  </div>
                  {scenario.bubbleFactors && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Bubble Factors:</span>
                      <span className="text-yellow-400 font-mono">
                        {scenario.bubbleFactors.map((bf: number) => bf.toFixed(1)).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <button className="mt-4 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                  Load Scenario
                </button>
              </div>
            ))}
          </div>

          {commonScenarios.data.data.tips && (
            <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-2">ICM Tips</h4>
              <ul className="space-y-1">
                {commonScenarios.data.data.tips.map((tip: string, index: number) => (
                  <li key={index} className="text-blue-300 text-sm flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Feature Overview */}
      <motion.div variants={itemVariants} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Feature Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <CalculatorIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">ICM Calculator</h3>
            <p className="text-gray-400 text-sm">
              Real-time tournament equity calculations with bubble factor analysis
            </p>
          </div>

          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Push/Fold Charts</h3>
            <p className="text-gray-400 text-sm">
              Generate optimal push/fold ranges based on stack sizes and ICM
            </p>
          </div>

          <div className="text-center">
            <TrophyIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Hand Analysis</h3>
            <p className="text-gray-400 text-sm">
              Comprehensive hand evaluation with equity calculations
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;