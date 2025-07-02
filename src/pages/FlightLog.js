import React, { useState, useEffect } from 'react';
import { useFlightData } from '../context/FlightDataContext';
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

const FlightLog = () => {
  const { sheets, selectedSheet, setSelectedSheet, currentSheet, addEntry, updateEntry, deleteEntry, resetSheets } = useFlightData();
  const [search, setSearch] = useState('');
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(() => Object.fromEntries(columns.map(col => [col.key, ''])));
  const [error, setError] = useState('');
  const [editInfo, setEditInfo] = useState(null); // {sheetName, index}
  const [showDelete, setShowDelete] = useState(null); // {sheetName, index}

  // Compute all flights with drone model info
  const allFlights = React.useMemo(() => {
    return Object.entries(sheets).flatMap(([model, sheet]) =>
      (sheet.data || []).map((row, idx) => ({ ...row, 'DRONE MODEL': model, _sheet: model, _index: idx }))
    );
  }, [sheets]);

  useEffect(() => {
    let flightsToShow = [];
    if (selectedSheet === ALL_MODELS) {
      flightsToShow = allFlights;
    } else {
      flightsToShow = (currentSheet.data || []).map((row, idx) => ({ ...row, 'DRONE MODEL': selectedSheet, _sheet: selectedSheet, _index: idx }));
    }
    setFilteredFlights(
      flightsToShow.filter(flight =>
        columns.some(col =>
          String(flight[col.key] || '').toLowerCase().includes(search.toLowerCase())
        )
      )
    );
  }, [search, currentSheet, selectedSheet, allFlights]);

  const handleSearch = (e) => setSearch(e.target.value);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate required fields
    for (const col of columns) {
      if (col.required && !form[col.key].trim()) {
        setError(`${col.label} is required.`);
        return;
      }
    }
    if (editInfo) {
      updateEntry(editInfo.sheetName, editInfo.index, form);
    } else {
      addEntry(form);
    }
    setShowModal(false);
    setForm(Object.fromEntries(columns.map(col => [col.key, ''])));
    setError('');
    setEditInfo(null);
  };

  const handleExport = () => {
    const workbook = XLSX.utils.book_new();
    Object.entries(sheets).forEach(([sheetName, sheet]) => {
      if (sheet.data && sheet.data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data, { header: sheet.headers });
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });
    XLSX.writeFile(workbook, 'briech-uas-flight-summary.xlsx');
  };

  const openEdit = (flight) => {
    setForm(Object.fromEntries(columns.map(col => [col.key, flight[col.key] || ''])));
    setEditInfo({ sheetName: flight._sheet, index: flight._index });
    setShowModal(true);
  };

  const openDelete = (flight) => {
    setShowDelete({ sheetName: flight._sheet, index: flight._index });
  };

  const confirmDelete = () => {
    if (showDelete) {
      deleteEntry(showDelete.sheetName, showDelete.index);
      setShowDelete(null);
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
            value={selectedSheet}
            onChange={e => setSelectedSheet(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={ALL_MODELS}>All Models</option>
            {Object.keys(sheets).map(sheetName => (
              <option key={sheetName} value={sheetName}>{sheetName}</option>
            ))}
          </select>
          <button className="btn-primary ml-4" onClick={() => {
            setForm(Object.fromEntries(columns.map(col => [col.key, ''])));
            setShowModal(true);
            setEditInfo(null);
          }} disabled={selectedSheet === ALL_MODELS}>
            + Add New Flight
          </button>
          <button className="btn-secondary ml-2" onClick={handleExport} title="Export all data to Excel">
            Export to Excel
          </button>
          <button className="btn-secondary ml-2" onClick={resetSheets} title="Reset all data (clear and reload mock)">
            Reset Data
          </button>
        </div>
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
              {columns.filter(col => selectedSheet === ALL_MODELS ? true : !col.allOnly).map(col => (
                <th key={col.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFlights.map((flight, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.filter(col => selectedSheet === ALL_MODELS ? true : !col.allOnly).map(col => (
                  <td key={col.key} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {(col.key === 'TAKE-OFF TIME' || col.key === 'LANDING TIME') && flight[col.key] ? (
                      (() => {
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
                    ) : flight[col.key]}
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
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {filteredFlights.map((flight, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
            {columns.filter(col => selectedSheet === ALL_MODELS ? true : !col.allOnly).map(col => (
              <div key={col.key} className="flex justify-between text-sm">
                <span className="font-semibold text-gray-700">{col.label}:</span>
                <span className="text-gray-900 ml-2">
                  {(col.key === 'TAKE-OFF TIME' || col.key === 'LANDING TIME') && flight[col.key] ? (
                    (() => {
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
                  ) : flight[col.key]}
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
        ))}
      </div>
      {/* Modal for Add/Edit Flight */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => { setShowModal(false); setEditInfo(null); }}>&times;</button>
            <h2 className="text-xl font-bold mb-4">{editInfo ? 'Edit Flight Entry' : 'Add New Flight Entry'}</h2>
            {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {columns.filter(col => !col.allOnly).map(col => {
                if (col.key === 'MISSION DATE') {
                  return (
                    <div key={col.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{col.label}{col.required && <span className="text-red-500">*</span>}</label>
                      <input
                        type="date"
                        name={col.key}
                        value={form[col.key]}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  );
                }
                if (col.key === 'TAKE-OFF TIME' || col.key === 'LANDING TIME') {
                  return (
                    <div key={col.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{col.label}{col.required && <span className="text-red-500">*</span>}</label>
                      <input
                        type="time"
                        name={col.key}
                        value={form[col.key]}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        step="1"
                      />
                    </div>
                  );
                }
                return (
                  <div key={col.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{col.label}{col.required && <span className="text-red-500">*</span>}</label>
                    <input
                      type="text"
                      name={col.key}
                      value={form[col.key]}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                );
              })}
              <div className="md:col-span-2 flex justify-end mt-4">
                <button type="submit" className="btn-primary">{editInfo ? 'Update Flight' : 'Add Flight'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete confirmation modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <h2 className="text-lg font-bold mb-4">Delete Flight Entry</h2>
            <p className="mb-4">Are you sure you want to delete this flight entry?</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowDelete(null)}>Cancel</button>
              <button className="btn-primary bg-danger-600 hover:bg-danger-700" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightLog; 