import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { useFlightData } from '../context/FlightDataContext';

// Dashboard columns for mapping
const DASHBOARD_COLUMNS = [
  'S/N', 'MISSION DATE', 'MISSION OBJECTIVE', 'FLIGHT ID', 'TAKE-OFF TIME', 'LANDING TIME', 'TOTAL FLIGHT TIME',
  'BATTERY 1 (3S) QTY', 'BATTERY 1 (3S) TAKE-OFF VOLTAGE', 'BATTERY 1 (3S) LANDING VOLTAGE', 'BATTERY 1 (3S) VOLTAGE USED',
  'BATTERY 2 (2S) QTY', 'BATTERY 2 (2S) TAKE-OFF VOLTAGE', 'BATTERY 2 (2S) LANDING VOLTAGE', 'BATTERY 2 (2S) VOLTAGE USED',
  'COMMENT'
];

const ExcelImporter = ({ onDataImported }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importedData, setImportedData] = useState(null);
  const [fileName, setFileName] = useState('');
  const { importAllSheets } = useFlightData();
  const [headerPicker, setHeaderPicker] = useState(null); // {sheetName, rows}
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [mappingSheet, setMappingSheet] = useState(null); // {sheetName, headers, mapping}
  const [showMapping, setShowMapping] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const data = await readExcelFileRaw(file);
      setImportedData(data);
      onDataImported && onDataImported(data);
      // For the first sheet, show header picker
      const firstSheetName = Object.keys(data)[0];
      if (firstSheetName) {
        const rows = data[firstSheetName].rawRows;
        // Find first 5 non-empty rows
        const previewRows = rows.filter(row => row && row.some(cell => cell && cell.toString().trim() !== '')).slice(0, 5);
        console.log('First 5 non-empty rows:', previewRows);
        setHeaderPicker({ sheetName: firstSheetName, rows: previewRows, allRows: rows });
        setHeaderRowIndex(0);
      }
    } catch (err) {
      setError('Error reading Excel file. Please check the file format.');
      console.error('Excel read error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Normalize header for mapping
  const normalizeHeader = h => h && h.toString().trim().replace(/\s+/g, ' ').toUpperCase();

  // After picking header row, proceed to mapping
  const handleHeaderPick = () => {
    if (!headerPicker) return;
    const { sheetName, allRows } = headerPicker;
    const headers = (allRows[headerRowIndex] || []).map(normalizeHeader);
    const dataRows = allRows.slice(headerRowIndex + 1);
    setMappingSheet({
      sheetName,
      headers,
      mapping: headers.map(h => autoMapHeader(h)),
      dataRows,
      allRows
    });
    setShowMapping(true);
    setHeaderPicker(null);
  };

  // Try to auto-map imported header to dashboard column
  function autoMapHeader(header) {
    const norm = header.replace(/\s+/g, ' ').toUpperCase().trim();
    return DASHBOARD_COLUMNS.find(col => col.toUpperCase() === norm) || '';
  }

  // Read Excel file and keep all raw rows for header picking
  const readExcelFileRaw = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetNames = workbook.SheetNames;
          const processedData = {};
          sheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            processedData[sheetName] = { rawRows };
          });
          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Apply mapping to the selected sheet and import
  const handleMappingConfirm = () => {
    if (!importedData || !mappingSheet) return;
    const mappedSheets = { ...importedData };
    const { sheetName, headers, mapping, dataRows } = mappingSheet;
    const mappedData = dataRows
      .filter(row => row && row.some(cell => cell !== null && cell !== undefined && cell !== ''))
      .map(row => {
        const mappedRow = {};
        mapping.forEach((dashboardCol, i) => {
          if (dashboardCol) mappedRow[dashboardCol] = row[i];
        });
        return mappedRow;
      });
    mappedSheets[sheetName] = {
      sheetName,
      headers: mapping,
      data: mappedData
    };
    importAllSheets(mappedSheets);
    setShowMapping(false);
  };

  // Handle mapping change
  const handleMappingChange = (i, value) => {
    setMappingSheet(ms => ({
      ...ms,
      mapping: ms.mapping.map((m, idx) => (idx === i ? value : m))
    }));
  };

  const exportProcessedData = () => {
    if (!importedData) return;

    const workbook = XLSX.utils.book_new();
    
    Object.values(importedData).forEach(sheetData => {
      if (sheetData.data && sheetData.data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(sheetData.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetData.sheetName);
      }
    });

    XLSX.writeFile(workbook, `processed_${fileName}`);
  };

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Quality Control Data</h3>
        <p className="text-gray-600">Upload your Excel file to import quality control data into the dashboard</p>
      </div>

      <div className="space-y-4">
        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
            disabled={isLoading}
          />
          <label
            htmlFor="excel-upload"
            className={`cursor-pointer flex flex-col items-center space-y-2 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400'
            }`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            ) : (
              <Upload className="h-8 w-8 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isLoading ? 'Processing...' : 'Click to upload Excel file'}
              </p>
              <p className="text-xs text-gray-500">Supports .xlsx and .xls files</p>
            </div>
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Header Picker Modal */}
        {headerPicker && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
              <h2 className="text-xl font-bold mb-4">Select the Header Row</h2>
              <table className="min-w-full text-xs border mb-4">
                <tbody>
                  {headerPicker.rows.map((row, i) => (
                    <tr key={i} className={headerRowIndex === i ? 'bg-primary-100' : ''}>
                      <td className="px-2 py-1 border-b">
                        <input
                          type="radio"
                          name="headerRow"
                          checked={headerRowIndex === i}
                          onChange={() => setHeaderRowIndex(i)}
                        />
                      </td>
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1 border-b">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end gap-2">
                <button className="btn-secondary" onClick={() => setHeaderPicker(null)}>Cancel</button>
                <button className="btn-primary" onClick={handleHeaderPick}>Next: Map Headers</button>
              </div>
            </div>
          </div>
        )}

        {/* Mapping Modal */}
        {showMapping && mappingSheet && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
              <h2 className="text-xl font-bold mb-4">Map Imported Headers to Dashboard Columns</h2>
              <table className="min-w-full text-xs border mb-4">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border-b bg-gray-100">Imported Header</th>
                    <th className="px-2 py-1 border-b bg-gray-100">Map to Dashboard Column</th>
                  </tr>
                </thead>
                <tbody>
                  {mappingSheet.headers.map((header, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1 border-b">{header}</td>
                      <td className="px-2 py-1 border-b">
                        <select
                          value={mappingSheet.mapping[i]}
                          onChange={e => handleMappingChange(i, e.target.value)}
                          className="px-2 py-1 border rounded"
                        >
                          <option value="">(Ignore)</option>
                          {DASHBOARD_COLUMNS.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end gap-2">
                <button className="btn-secondary" onClick={() => setShowMapping(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleMappingConfirm}>Confirm Mapping</button>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {importedData && !error && !showMapping && !headerPicker && (
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">File imported successfully!</span>
            </div>

            {/* Data Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Imported Data Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(importedData).map(([sheetName, sheetData]) => (
                  <div key={sheetName} className="bg-white p-3 rounded border">
                    <div className="flex items-center mb-2">
                      <FileSpreadsheet className="h-4 w-4 text-primary-600 mr-2" />
                      <span className="font-medium text-sm">{sheetName}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {sheetData.rawRows ? sheetData.rawRows.length : 0} rows
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={exportProcessedData}
              className="btn-secondary flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Processed Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelImporter; 