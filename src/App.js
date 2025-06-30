import React from 'react';
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

function App() {
  return (
    <FlightDataProvider>
      <Router>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-auto">
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