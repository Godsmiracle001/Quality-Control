import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inspections from './pages/Inspections';
import Defects from './pages/Defects';
import Production from './pages/Production';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import FlightLog from './pages/FlightLog';
import { FlightDataProvider } from './context/FlightDataContext';
import { Menu } from 'lucide-react';

function App() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  return (
    <FlightDataProvider>
      <Router>
        <div className="flex h-screen bg-gray-50">
          <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
          <main className="flex-1 overflow-auto">
            {/* Mobile header with hamburger */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow sticky top-0 z-30">
              <button onClick={() => setMobileSidebarOpen(true)} className="text-gray-700 focus:outline-none">
                <Menu className="h-7 w-7" />
              </button>
              <span className="font-bold text-lg text-primary-700">Briech UAS</span>
              <div className="w-7" /> {/* Spacer for symmetry */}
            </div>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/flight-log" element={<FlightLog />} />
              <Route path="/inspections" element={<Inspections />} />
              <Route path="/defects" element={<Defects />} />
              <Route path="/production" element={<Production />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </Router>
    </FlightDataProvider>
  );
}

export default App; 