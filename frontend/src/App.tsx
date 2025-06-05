/**
 * Main App component with routing and authentication context
 * Provides Firebase authentication and React Router setup
 */
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LobbyPage } from './pages/LobbyPage';
import { DuelPage } from './pages/DuelPage';
import { CardGalleryPage } from './pages/CardGalleryPage';

/**
 * Loading component for Suspense fallback
 */
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

/**
 * Main App component
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<LobbyPage />} />
            <Route path="/duel" element={<DuelPage />} />
            <Route path="/cards" element={<CardGalleryPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
