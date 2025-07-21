import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../components/api';

const Reports = () => {
  const [file, setFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});

  const dbColumns = [
    'drone_model', 'mission_date', 'mission_objective', 'flight_id', 
    'takeoff_time', 'landing_time', 'total_flight_time', 'engine_time_hours',
    'fuel_level_before_flight', 'fuel_level_after_flight', 'fuel_used',
    'battery1_takeoff_voltage', 'battery1_landing_voltage', 'battery1_voltage_used',
    'battery2_takeoff_voltage', 'battery2_landing_voltage', 'battery2_voltage_used', 
    'comment'
  ];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleViewFile = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (json.length > 0) {
        const fileHeaders = json[0];
        const fileData = json.slice(1).map(row => 
          fileHeaders.reduce((obj, header, index) => {
            obj[header] = row[index];
            return obj;
          }, {})
        );

        setHeaders(fileHeaders);
        setExcelData(fileData);
        
        // Auto-map headers
        const initialMapping = {};
        fileHeaders.forEach(header => {
          const simpleHeader = header.toLowerCase().replace(/[\s\(\)-]/g, '_');
          const matchedDbColumn = dbColumns.find(dbCol => dbCol.includes(simpleHeader));
          initialMapping[header] = matchedDbColumn || '';
        });
        setMapping(initialMapping);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleMappingChange = (excelHeader, dbColumn) => {
    setMapping(prev => ({ ...prev, [excelHeader]: dbColumn }));
  };

  const handleImport = async () => {
    const mappedData = excelData.map(row => {
      const mappedRow = {};
      for (const excelHeader in mapping) {
        const dbColumn = mapping[excelHeader];
        if (dbColumn && row[excelHeader] !== undefined) {
          mappedRow[dbColumn] = row[excelHeader];
        }
      }
      return mappedRow;
    });
    try {
      const res = await api.post('/flight-logs/bulk-import', { logs: mappedData });
      alert(`Successfully imported ${res.data.inserted} records!`);
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Import Excel Data</h1>
      <p className="text-gray-600 mb-6">Upload your Excel sheet, map the columns, and import the data.</p>
      
      <div className="flex items-center gap-4 mb-8">
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileChange}
          className="file-input"
        />
        <button onClick={handleViewFile} className="btn-primary" disabled={!file}>
          View File
        </button>
      </div>

      {headers.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Map Columns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {headers.map(header => (
              <div key={header} className="flex items-center gap-2">
                <label className="font-semibold w-1/2">{header}</label>
                <select 
                  value={mapping[header] || ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg w-1/2"
                >
                  <option value="">-- Select Field --</option>
                  {dbColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button onClick={handleImport} className="btn-primary">
            Import Data
          </button>
        </div>
      )}

      {excelData && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Preview Data</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map(header => (
                    <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {excelData.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {headers.map(header => (
                      <td key={header} className="px-4 py-2 whitespace-nowrap text-sm">
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 