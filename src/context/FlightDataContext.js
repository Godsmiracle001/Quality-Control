import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'briechUasSheets';

// Hardcoded mock data for ARSENIO 004
const mockSheets = {
  'ARSENIO 004': {
    sheetName: 'ARSENIO 004',
    headers: [
      'S/N', 'MISSION DATE', 'MISSION OBJECTIVE', 'FLIGHT ID', 'TAKE-OFF TIME', 'LANDING TIME', 'TOTAL FLIGHT TIME',
      'BATTERY 1 (3S) QTY', 'BATTERY 1 (3S) TAKE-OFF VOLTAGE', 'BATTERY 1 (3S) LANDING VOLTAGE', 'BATTERY 1 (3S) VOLTAGE USED',
      'BATTERY 2 (2S) QTY', 'BATTERY 2 (2S) TAKE-OFF VOLTAGE', 'BATTERY 2 (2S) LANDING VOLTAGE', 'BATTERY 2 (2S) VOLTAGE USED',
      'COMMENT'
    ],
    data: [
      { 'S/N': '1', 'MISSION DATE': '2025-03-08', 'MISSION OBJECTIVE': 'Flight Test (Stabilize, Qloiter)', 'FLIGHT ID': 'BRIECHUAS_08032025_1535', 'TAKE-OFF TIME': '', 'LANDING TIME': 'NIL', 'TOTAL FLIGHT TIME': '', 'BATTERY 1 (3S) QTY': '2', 'BATTERY 1 (3S) TAKE-OFF VOLTAGE': '12.30', 'BATTERY 1 (3S) LANDING VOLTAGE': '12.30', 'BATTERY 1 (3S) VOLTAGE USED': '0.00', 'BATTERY 2 (2S) QTY': '2', 'BATTERY 2 (2S) TAKE-OFF VOLTAGE': '59.43', 'BATTERY 2 (2S) LANDING VOLTAGE': '59.43', 'BATTERY 2 (2S) VOLTAGE USED': '0.00', 'COMMENT': 'Due to the inability to meet up with standard, Flight Test could not continue.' },
      { 'S/N': '2', 'MISSION DATE': '2025-03-10', 'MISSION OBJECTIVE': 'Flight Test 1 (Qloiter)', 'FLIGHT ID': 'BRIECHUAS_11032025_0954', 'TAKE-OFF TIME': '10:05', 'LANDING TIME': '10:09:40', 'TOTAL FLIGHT TIME': '0:04:40', 'BATTERY 1 (3S) QTY': '2', 'BATTERY 1 (3S) TAKE-OFF VOLTAGE': '12.32', 'BATTERY 1 (3S) LANDING VOLTAGE': '12.26', 'BATTERY 1 (3S) VOLTAGE USED': '0.06', 'BATTERY 2 (2S) QTY': '2', 'BATTERY 2 (2S) TAKE-OFF VOLTAGE': '59.46', 'BATTERY 2 (2S) LANDING VOLTAGE': '59.43', 'BATTERY 2 (2S) VOLTAGE USED': '0.03', 'COMMENT': 'Fuel level calibration need to be carried out, Engine running should be recorded to enable proper maintenance, Particle at Right Rear Wing need to be removed.' },
      { 'S/N': '3', 'MISSION DATE': '2025-03-10', 'MISSION OBJECTIVE': 'Flight Test 2 (Qloiter/Qloiter Before and After Take-off)', 'FLIGHT ID': 'BRIECHUAS_10032025_1645', 'TAKE-OFF TIME': '16:50', 'LANDING TIME': '16:52:53', 'TOTAL FLIGHT TIME': '0:02:53', 'BATTERY 1 (3S) QTY': '2', 'BATTERY 1 (3S) TAKE-OFF VOLTAGE': '12.32', 'BATTERY 1 (3S) LANDING VOLTAGE': '12.26', 'BATTERY 1 (3S) VOLTAGE USED': '0.06', 'BATTERY 2 (2S) QTY': '2', 'BATTERY 2 (2S) TAKE-OFF VOLTAGE': '59.33', 'BATTERY 2 (2S) LANDING VOLTAGE': '59.31', 'BATTERY 2 (2S) VOLTAGE USED': '0.02', 'COMMENT': 'Test left the Boom tip was clipped off.' },
      { 'S/N': '4', 'MISSION DATE': '2025-03-10', 'MISSION OBJECTIVE': 'Flight Test (Qloiter/Qloiter After Take-off)', 'FLIGHT ID': 'BRIECHUAS_12032025_1015', 'TAKE-OFF TIME': '11:15', 'LANDING TIME': '11:17:36', 'TOTAL FLIGHT TIME': '0:02:36', 'BATTERY 1 (3S) QTY': '2', 'BATTERY 1 (3S) TAKE-OFF VOLTAGE': '12.28', 'BATTERY 1 (3S) LANDING VOLTAGE': '12.24', 'BATTERY 1 (3S) VOLTAGE USED': '0.04', 'BATTERY 2 (2S) QTY': '2', 'BATTERY 2 (2S) TAKE-OFF VOLTAGE': '59.41', 'BATTERY 2 (2S) LANDING VOLTAGE': '53.91', 'BATTERY 2 (2S) VOLTAGE USED': '5.50', 'COMMENT': 'Subjecting the Aircraft to go for longer range to test for endurance, batteries were initially used for calibration tests before Qloiter Test.' },
      { 'S/N': '5', 'MISSION DATE': '2025-03-14', 'MISSION OBJECTIVE': 'FBWA', 'FLIGHT ID': 'BRIECHUAS_14032025_1005', 'TAKE-OFF TIME': '10:07', 'LANDING TIME': '10:19:45', 'TOTAL FLIGHT TIME': '0:12:45', 'BATTERY 1 (3S) QTY': '2', 'BATTERY 1 (3S) TAKE-OFF VOLTAGE': '12.39', 'BATTERY 1 (3S) LANDING VOLTAGE': '12.23', 'BATTERY 1 (3S) VOLTAGE USED': '0.16', 'BATTERY 2 (2S) QTY': '2', 'BATTERY 2 (2S) TAKE-OFF VOLTAGE': '59.41', 'BATTERY 2 (2S) LANDING VOLTAGE': '55.26', 'BATTERY 2 (2S) VOLTAGE USED': '4.15', 'COMMENT': 'The left Telemetry Antenna removed during flight test, Particle movement at Right Back Wing, Flight Log should be checked for any abnormality.' },
      // ... (add more rows as needed from your screenshot)
    ]
  }
};

const FlightDataContext = createContext();

export const useFlightData = () => useContext(FlightDataContext);

export const FlightDataProvider = ({ children }) => {
  // Load from localStorage if available
  const getInitialSheets = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return mockSheets;
      }
    }
    return mockSheets;
  };

  const [sheets, setSheets] = useState(getInitialSheets);
  const [selectedSheet, setSelectedSheet] = useState(Object.keys(getInitialSheets())[0]);

  // Save to localStorage whenever sheets change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  }, [sheets]);

  // Import all sheets from Excel
  const importAllSheets = (importedSheets) => {
    setSheets(importedSheets);
    setSelectedSheet(Object.keys(importedSheets)[0]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(importedSheets));
  };

  // Add a new entry to the selected sheet
  const addEntry = (entry) => {
    setSheets(prev => {
      const updated = {
        ...prev,
        [selectedSheet]: {
          ...prev[selectedSheet],
          data: [entry, ...(prev[selectedSheet]?.data || [])]
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Reset all data (clear localStorage and reload mock)
  const resetSheets = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSheets(mockSheets);
    setSelectedSheet(Object.keys(mockSheets)[0]);
  };

  return (
    <FlightDataContext.Provider value={{
      sheets,
      selectedSheet,
      setSelectedSheet,
      importAllSheets,
      addEntry,
      resetSheets,
      currentSheet: sheets[selectedSheet] || { headers: [], data: [] }
    }}>
      {children}
    </FlightDataContext.Provider>
  );
}; 