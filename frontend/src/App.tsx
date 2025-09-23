import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navigation from './components/Navigation';
import ParticleBackground from './components/ParticleBackground';
import GeometricOverlay from './components/GeometricOverlay';
import Dashboard from './pages/Dashboard';
import HandAnalyzer from './pages/HandAnalyzer';
import RangeVisualizer from './pages/RangeVisualizer';
import PushFoldCharts from './pages/PushFoldCharts';
import ScenarioBuilder from './pages/ScenarioBuilder';
import HandHistoryAnalyzer from './pages/HandHistoryAnalyzer';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen relative overflow-hidden">
          {/* Particle background - lowest layer */}
          <ParticleBackground particleCount={60} />

          {/* Geometric overlay - decorative layer */}
          <GeometricOverlay />

          {/* Main content layer */}
          <div className="relative z-20">
            <Navigation />

            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/hand-analyzer" element={<HandAnalyzer />} />
                <Route path="/range-visualizer" element={<RangeVisualizer />} />
                <Route path="/push-fold-charts" element={<PushFoldCharts />} />
                <Route path="/scenario-builder" element={<ScenarioBuilder />} />
                <Route path="/hand-history" element={<HandHistoryAnalyzer />} />
              </Routes>
            </main>
          </div>

          {/* Futuristic toaster notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#00ffff',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(15px)',
                fontFamily: 'Orbitron, system-ui, sans-serif',
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
              },
              success: {
                iconTheme: {
                  primary: '#00ff88',
                  secondary: '#000000',
                },
                style: {
                  borderColor: 'rgba(0, 255, 136, 0.3)',
                  color: '#00ff88',
                  boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff0099',
                  secondary: '#000000',
                },
                style: {
                  borderColor: 'rgba(255, 0, 153, 0.3)',
                  color: '#ff0099',
                  boxShadow: '0 0 20px rgba(255, 0, 153, 0.2)',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
