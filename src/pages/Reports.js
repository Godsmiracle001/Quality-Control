import React, { useState } from 'react';

const Reports = () => {
  const [excelData, setExcelData] = useState(null);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Reports & Data Import</h1>
      <p className="text-gray-600 mb-6">Import your manual  Excel sheet and view its structure here.</p>
      {excelData && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Sheet Previews</h2>
          {Object.entries(excelData).map(([sheetName, sheet]) => (
            <div key={sheetName} className="mb-6">
              <h3 className="font-bold text-primary-700 mb-2">{sheetName}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <tbody>
                    {sheet.rawRows && sheet.rawRows.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        {row && row.map((cell, idx) => (
                          <td key={idx} className="px-2 py-1 border-b">{cell || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sheet.rawRows && sheet.rawRows.length > 10 && (
                  <div className="text-xs text-gray-500 mt-1">...and {sheet.rawRows.length - 10} more rows</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports; 