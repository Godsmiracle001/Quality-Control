import React, { useState, useEffect } from 'react';
import api from '../components/api';
import * as XLSX from 'xlsx';
import { Edit, Trash2 } from 'lucide-react';

const columns = [
  { key: 'DRONE MODEL', label: 'Drone Model', allOnly: true },
  { key: 'MISSION DATE', label: 'Mission Date', required: true },
  { key: 'MISSION OBJECTIVE', label: 'Mission Objective', required: true },
  { key: 'FLIGHT ID', label: 'Flight ID', required: true },
  { key: 'TAKE-OFF TIME', label: 'Take-off Time' },
  { key: 'LANDING TIME', label: 'Landing Time' },
  { key: 'TOTAL FLIGHT TIME', label: 'Total Flight Time' },
  { key: 'BATTERY 1 (S) TAKE-OFF VOLTAGE', label: 'Battery 1 Take-off V' },
  { key: 'BATTERY 1 (S) LANDING VOLTAGE', label: 'Battery 1 Landing V' },
  { key: 'BATTERY 1 (S) VOLTAGE USED', label: 'Battery 1 Used V' },
  { key: 'BATTERY 2 (S) TAKE-OFF VOLTAGE', label: 'Battery 2 Take-off V' },
  { key: 'BATTERY 2 (S) LANDING VOLTAGE', label: 'Battery 2 Landing V' },
  { key: 'BATTERY 2 (S) VOLTAGE USED', label: 'Battery 2 Used V' },
  { key: 'COMMENT', label: 'Comment' },
];

const ALL_MODELS = '__ALL_MODELS__';

// Add this function to map backend keys to frontend keys
function mapBackendToFrontend(flight) {
  return {
    'DRONE MODEL': flight.drone_model,
    'MISSION DATE': flight.mission_date,
    'MISSION OBJECTIVE': flight.mission_objective,
    'FLIGHT ID': flight.flight_id,
    'TAKE-OFF TIME': flight.takeoff_time,
    'LANDING TIME': flight.landing_time,
    'TOTAL FLIGHT TIME': flight.total_flight_time,
    'BATTERY 1 (S) TAKE-OFF VOLTAGE': flight.battery1_takeoff_voltage,
    'BATTERY 1 (S) LANDING VOLTAGE': flight.battery1_landing_voltage,
    'BATTERY 1 (S) VOLTAGE USED': flight.battery1_voltage_used,
    'BATTERY 2 (S) TAKE-OFF VOLTAGE': flight.battery2_takeoff_voltage,
    'BATTERY 2 (S) LANDING VOLTAGE': flight.battery2_landing_voltage,
    'BATTERY 2 (S) VOLTAGE USED': flight.battery2_voltage_used,
    'COMMENT': flight.comment,
    id: flight.id // keep the id for edit/delete
  };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateFlightTime(takeoff, landing) {
  if (!takeoff || !landing) return '';
  // Parse as HH:MM:SS or HH:MM AM/PM
  let t1 = takeoff.trim();
  let t2 = landing.trim();
  // Support for AM/PM
  const parseTime = (t) => {
    if (t.toLowerCase().includes('am') || t.toLowerCase().includes('pm')) {
      const d = new Date(`1970-01-01T${t}`);
      return d;
    }
    // Assume 24h format
    const [h, m, s] = t.split(':');
    return new Date(1970, 0, 1, Number(h), Number(m), s ? Number(s) : 0);
  };
  const start = parseTime(t1);
  const end = parseTime(t2);
  if (isNaN(start) || isNaN(end)) return '';
  let diff = (end - start) / 1000; // seconds
  if (diff < 0) diff += 24 * 3600; // handle overnight flights
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = Math.floor(diff % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function calculateBatteryUsed(takeoff, landing) {
  const t = parseFloat(takeoff);
  const l = parseFloat(landing);
  if (isNaN(t) || isNaN(l)) return '';
  return (t - l).toString();
}

const FlightLog = () => {
  // All hooks at the top!
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(() => Object.fromEntries(columns.map(col => [col.key, ''])));
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [showDeleteId, setShowDeleteId] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState('ALL');
  const [selectedModel, setSelectedModel] = useState('ALL');
  const allKnownModels = [
    'Arsenio 001', 'Arsenio 002', 'Arsenio 003', 'Arsenio 004', 'Arsenio 005',
    'Argini 001', 'Argini 002', 'Argini 003', 'Argini 004', 'Argini 005',
    'Damisa 001', 'Damisa 002', 'Damisa 003', 'Damisa 004', 'Damisa 005',
    'Xander 001', 'Xander 002', 'Xander 003', 'Xander 004', 'Xander 005'
  ];
  const [flightLogs, setFlightLogs] = useState([]);
  // Now declare filteredFlights
  const filteredFlights = flightLogs.filter(flight => {
    if (selectedFamily !== 'ALL' && !(flight['DRONE MODEL'] || '').startsWith(selectedFamily)) return false;
    if (selectedModel !== 'ALL' && flight['DRONE MODEL'] !== selectedModel) return false;
    return columns.some(col => String(flight[col.key] || '').toLowerCase().includes(search.toLowerCase()));
  });
  // Remove useFlightData, use local state for API integration
  // const { sheets, selectedSheet, setSelectedSheet, currentSheet, addEntry, updateEntry, deleteEntry, resetSheets } = useFlightData();
  const [loading, setLoading] = useState(true);
  const droneFamilies = ['ALL', 'Arsenio', 'Argini', 'Damisa', 'Xander'];

  // Fetch flight logs from backend
  const fetchFlightLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/flight-logs');
      setFlightLogs(res.data.map(mapBackendToFrontend));
      setError('');
    } catch (err) {
      setError('Failed to load flight logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlightLogs();
  }, []);

  const handleSearch = (e) => setSearch(e.target.value);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    for (const col of columns) {
      if (col.required && !form[col.key].trim()) {
        setError(`${col.label} is required.`);
        return;
      }
    }
    // Calculate total flight time
    const takeoff = form['TAKE-OFF TIME'];
    const landing = form['LANDING TIME'];
    const totalFlightTime = calculateFlightTime(takeoff, landing);
    // Calculate battery used
    const battery1Used = calculateBatteryUsed(form['BATTERY 1 (S) TAKE-OFF VOLTAGE'], form['BATTERY 1 (S) LANDING VOLTAGE']);
    const battery2Used = calculateBatteryUsed(form['BATTERY 2 (S) TAKE-OFF VOLTAGE'], form['BATTERY 2 (S) LANDING VOLTAGE']);
    const formWithCalcs = {
      ...form,
      'TOTAL FLIGHT TIME': totalFlightTime,
      'BATTERY 1 (S) VOLTAGE USED': battery1Used,
      'BATTERY 2 (S) VOLTAGE USED': battery2Used
    };
    try {
      if (editId) {
        await api.put(`/flight-logs/${editId}`, formWithCalcs);
      } else {
        await api.post('/flight-logs', formWithCalcs);
      }
      setShowModal(false);
      setForm(Object.fromEntries(columns.map(col => [col.key, ''])));
      setEditId(null);
      fetchFlightLogs();
    } catch (err) {
      setError('Failed to save flight log.');
    }
  };

  const handleExport = () => {
    const workbook = XLSX.utils.book_new();
    // This part needs to be adapted to fetch data from the backend
    // For now, it will export an empty workbook or require backend integration
    // For demonstration, let's assume we fetch all data from the backend
    // This requires a separate API call to fetch all flight logs
    // For now, we'll just create an empty workbook
    const worksheet = XLSX.utils.json_to_sheet([]); // Placeholder for headers
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Flight Logs');
    XLSX.writeFile(workbook, 'briech-uas-flight-summary.xlsx');
  };

  const openEdit = (flight) => {
    setForm(Object.fromEntries(columns.map(col => [col.key, flight[col.key] || ''])));
    setEditId(flight.id);
    setShowModal(true);
  };

  const openDelete = (flight) => {
    setShowDeleteId(flight.id);
  };

  const confirmDelete = async () => {
    if (showDeleteId) {
      try {
        await api.delete(`/flight-logs/${showDeleteId}`);
        setShowDeleteId(null);
        fetchFlightLogs();
      } catch (err) {
        setError('Failed to delete flight log.');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Flight Log</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="drone-model" className="text-sm font-medium text-gray-700 mr-2">Drone Model:</label>
          <select
            id="drone-model"
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="ALL">All Models</option>
            {allKnownModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
          <button className="btn-primary ml-4" onClick={() => {
            setForm(Object.fromEntries(columns.map(col => [col.key, ''])));
            setShowModal(true);
            setEditId(null);
          }}>
            + Add New Flight
          </button>
          <button className="btn-secondary ml-2" onClick={handleExport} title="Export all data to Excel">
            Export to Excel
          </button>
          {/* This will need to be updated to reset data from backend */}
          <button className="btn-secondary ml-2" onClick={() => {
            // setFlightLogs([]); // This will clear the current list
            // fetchFlightLogs(); // This will refetch
            alert('Data reset functionality not yet implemented with backend.');
          }} title="Reset all data (clear and reload mock)">
            Reset Data
          </button>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-4">
        <label htmlFor="drone-family" className="text-sm font-medium text-gray-700">Drone Family:</label>
        <select
          id="drone-family"
          value={selectedFamily}
          onChange={e => setSelectedFamily(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {droneFamilies.map(fam => (
            <option key={fam} value={fam}>{fam}</option>
          ))}
        </select>
      </div>
      <div className="mb-4 flex items-center">
        <input
          type="text"
          placeholder="Search flights..."
          value={search}
          onChange={handleSearch}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.filter(col => ALL_MODELS === '__ALL_MODELS__' ? true : !col.allOnly).map(col => (
                <th key={col.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.filter(col => ALL_MODELS === '__ALL_MODELS__' ? true : !col.allOnly).length + 1} className="px-4 py-2 text-center">Loading...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.filter(col => ALL_MODELS === '__ALL_MODELS__' ? true : !col.allOnly).length + 1} className="px-4 py-2 text-center text-red-600">{error}</td>
              </tr>
            ) : filteredFlights.length === 0 ? (
              <tr>
                <td colSpan={columns.filter(col => ALL_MODELS === '__ALL_MODELS__' ? true : !col.allOnly).length + 1} className="px-4 py-2 text-center">No flights found.</td>
              </tr>
            ) : (
              filteredFlights.map((flight, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.filter(col => ALL_MODELS === '__ALL_MODELS__' ? true : !col.allOnly).map(col => (
                    <td key={col.key} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {col.key === 'MISSION DATE'
                        ? formatDate(flight[col.key])
                        : col.key === 'TOTAL FLIGHT TIME'
                          ? (flight[col.key] && flight[col.key] !== ''
                              ? flight[col.key]
                              : calculateFlightTime(flight['TAKE-OFF TIME'], flight['LANDING TIME']))
                          : col.key === 'BATTERY 1 (S) VOLTAGE USED'
                            ? (flight[col.key] && flight[col.key] !== ''
                                ? flight[col.key]
                                : calculateBatteryUsed(flight['BATTERY 1 (S) TAKE-OFF VOLTAGE'], flight['BATTERY 1 (S) LANDING VOLTAGE']))
                            : col.key === 'BATTERY 2 (S) VOLTAGE USED'
                              ? (flight[col.key] && flight[col.key] !== ''
                                  ? flight[col.key]
                                  : calculateBatteryUsed(flight['BATTERY 2 (S) TAKE-OFF VOLTAGE'], flight['BATTERY 2 (S) LANDING VOLTAGE']))
                          : (col.key === 'TAKE-OFF TIME' || col.key === 'LANDING TIME') && flight[col.key]
                            ? (() => {
                                const t = flight[col.key];
                                if (typeof t === 'string' && t.length > 0) {
                                  const [h, m, s] = t.split(':');
                                  if (h && m) {
                                    return s !== undefined ? `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}` : `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
                                  }
                                  return t;
                                }
                                return t ?? '';
                              })()
                            : flight[col.key]
                      }
                    </td>
                  ))}
                  <td className="px-4 py-2 whitespace-nowrap text-sm flex gap-2">
                    <button className="text-primary-600 hover:text-primary-900" onClick={() => openEdit(flight)} title="Edit">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-danger-600 hover:text-danger-900" onClick={() => openDelete(flight)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
            <p className="text-center">Loading...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 text-red-600">
            <p className="text-center">{error}</p>
          </div>
        ) : filteredFlights.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
            <p className="text-center">No flights found.</p>
          </div>
        ) : (
          filteredFlights.map((flight, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
              {columns.filter(col => ALL_MODELS === '__ALL_MODELS__' ? true : !col.allOnly).map(col => (
                <div key={col.key} className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-700">{col.label}:</span>
                  <span className="text-gray-900 ml-2">
                    {col.key === 'MISSION DATE'
                      ? formatDate(flight[col.key])
                      : col.key === 'TOTAL FLIGHT TIME'
                        ? (flight[col.key] && flight[col.key] !== ''
                            ? flight[col.key]
                            : calculateFlightTime(flight['TAKE-OFF TIME'], flight['LANDING TIME']))
                        : col.key === 'BATTERY 1 (S) VOLTAGE USED'
                          ? (flight[col.key] && flight[col.key] !== ''
                              ? flight[col.key]
                              : calculateBatteryUsed(flight['BATTERY 1 (S) TAKE-OFF VOLTAGE'], flight['BATTERY 1 (S) LANDING VOLTAGE']))
                        : col.key === 'BATTERY 2 (S) VOLTAGE USED'
                          ? (flight[col.key] && flight[col.key] !== ''
                              ? flight[col.key]
                              : calculateBatteryUsed(flight['BATTERY 2 (S) TAKE-OFF VOLTAGE'], flight['BATTERY 2 (S) LANDING VOLTAGE']))
                        : (col.key === 'TAKE-OFF TIME' || col.key === 'LANDING TIME') && flight[col.key]
                          ? (() => {
                              const t = flight[col.key];
                              if (typeof t === 'string' && t.length > 0) {
                                const [h, m, s] = t.split(':');
                                if (h && m) {
                                  return s !== undefined ? `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}` : `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
                                }
                                return t;
                              }
                              return t ?? '';
                            })()
                          : flight[col.key]
                    }
                  </span>
                </div>
              ))}
              <div className="flex gap-4 mt-2">
                <button className="text-primary-600 hover:text-primary-900 flex items-center gap-1" onClick={() => openEdit(flight)} title="Edit">
                  <Edit className="h-4 w-4" /> Edit
                </button>
                <button className="text-danger-600 hover:text-danger-900 flex items-center gap-1" onClick={() => openDelete(flight)} title="Delete">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal for Add/Edit Flight */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => { setShowModal(false); setEditId(null); }}>&times;</button>
            <h2 className="text-xl font-bold mb-4">{editId ? 'Edit Flight Entry' : 'Add New Flight Entry'}</h2>
            {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {columns.map(col => (
                col.key === 'DRONE MODEL' ? (
                  <div key={col.key} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">{col.label}{col.required && '*'}</label>
                    <select
                      name={col.key}
                      value={form[col.key]}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required={col.required}
                    >
                      <option value="">Select Model</option>
                      {allKnownModels.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                ) : col.key === 'MISSION DATE' ? (
                  <div key={col.key} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">{col.label}{col.required && '*'}</label>
                    <input
                      type="date"
                      name={col.key}
                      value={form[col.key]}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required={col.required}
                    />
                  </div>
                ) : (col.key === 'TAKE-OFF TIME' || col.key === 'LANDING TIME') ? (
                  <div key={col.key} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">{col.label}{col.required && '*'}</label>
                    <input
                      type="time"
                      name={col.key}
                      value={form[col.key]}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      step="1"
                      required={col.required}
                    />
                  </div>
                ) : (
                  <div key={col.key} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">{col.label}{col.required && '*'}</label>
                    <input
                      type="text"
                      name={col.key}
                      value={form[col.key]}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required={col.required}
                    />
                  </div>
                )
              ))}
              <div className="md:col-span-2 flex justify-end mt-4">
                <button type="submit" className="btn-primary">{editId ? 'Update Flight' : 'Add Flight'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete confirmation modal */}
      {showDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <h2 className="text-lg font-bold mb-4">Delete Flight Entry</h2>
            <p className="mb-4">Are you sure you want to delete this flight entry?</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowDeleteId(null)}>Cancel</button>
              <button className="btn-primary bg-danger-600 hover:bg-danger-700" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightLog; 