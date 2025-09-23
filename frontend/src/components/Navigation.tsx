import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  ChartBarIcon,
  CalculatorIcon,
  TableCellsIcon,
  PuzzlePieceIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const Navigation: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      description: 'ICM calculations and overview',
      color: 'neon-cyan'
    },
    {
      name: 'Hand Analyzer',
      href: '/hand-analyzer',
      icon: CalculatorIcon,
      description: 'Analyze specific hands',
      color: 'neon-blue'
    },
    {
      name: 'Range Visualizer',
      href: '/range-visualizer',
      icon: TableCellsIcon,
      description: 'Visualize hand ranges',
      color: 'neon-green'
    },
    {
      name: 'Push/Fold Charts',
      href: '/push-fold-charts',
      icon: ChartBarIcon,
      description: 'Generate push/fold charts',
      color: 'neon-purple'
    },
    {
      name: 'Scenario Builder',
      href: '/scenario-builder',
      icon: PuzzlePieceIcon,
      description: 'Build custom scenarios',
      color: 'neon-pink'
    },
    {
      name: 'Hand History',
      href: '/hand-history',
      icon: DocumentTextIcon,
      description: 'Analyze hand histories',
      color: 'neon-cyan'
    },
  ];

  const logoVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: {
      scale: 1.05,
      rotate: 5,
      transition: { duration: 0.3 }
    }
  };

  const navItemVariants = {
    initial: { scale: 1, x: 0 },
    hover: {
      scale: 1.05,
      x: 3,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  return (
    <nav className="glass-dark border-b border-neon-cyan/20 sticky top-0 z-50 font-futura">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-blue rounded-xl flex items-center justify-center shadow-neon-cyan relative overflow-hidden"
              variants={logoVariants}
              initial="initial"
              whileHover="hover"
            >
              <span className="text-cyber-black font-bold text-sm tracking-wider z-10">MT</span>
              {/* Holographic effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-white/30 to-transparent transform -skew-x-12 animate-shimmer" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-neon-white tracking-wide">
                MTT Poker Solver
              </h1>
              <p className="text-xs text-neon-cyan/70 tracking-wider">
                Tournament Strategy Assistant
              </p>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="relative group"
                >
                  <motion.div
                    className={clsx(
                      'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                      'border border-transparent backdrop-blur-sm',
                      isActive
                        ? 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30 shadow-neon-cyan'
                        : 'text-neon-white/70 hover:text-neon-cyan hover:bg-cyber-dark-2/50 hover:border-neon-cyan/20'
                    )}
                    variants={navItemVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="tracking-wide">{item.name}</span>

                    {/* Hover glow effect */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-lg bg-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </motion.div>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan rounded-full shadow-neon-cyan"
                      layoutId="activeTab"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Tooltip */}
                  <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="glass-dark text-neon-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap border border-neon-cyan/20">
                      {item.description}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-cyber-dark-2"></div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              className="text-neon-cyan hover:text-neon-white p-2 rounded-lg border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Bars3Icon className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden border-t border-neon-cyan/20 pt-4 pb-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 gap-2">
                {navItems.map((item, index) => {
                  const isActive = location.pathname === item.href;

                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.href}
                        className={clsx(
                          'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300',
                          'border backdrop-blur-sm',
                          isActive
                            ? 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30 shadow-neon-cyan'
                            : 'text-neon-white/70 hover:text-neon-cyan hover:bg-cyber-dark-2/50 border-transparent hover:border-neon-cyan/20'
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="w-5 h-5" />
                        <div>
                          <div className="tracking-wide">{item.name}</div>
                          <div className="text-xs text-neon-white/50 mt-0.5">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navigation;