import React, { useState, Fragment, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

const Inspections = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    id: '',
    model: '',
    category: '',
    status: 'pending',
    priority: 'medium',
    inspector: '',
    date: '',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [inspectionList, setInspectionList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [viewInspection, setViewInspection] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Persistent storage: Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('inspections');
    if (saved) {
      setInspectionList(JSON.parse(saved));
    }
  }, []);
  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('inspections', JSON.stringify(inspectionList));
  }, [inspectionList]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pass':
        return <span className="status-pass">Pass</span>;
      case 'fail':
        return <span className="status-fail">Fail</span>;
      case 'pending':
        return <span className="status-pending">Pending</span>;
      default:
        return <span className="status-pending">Unknown</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const filteredInspections = inspectionList.filter(inspection => {
    const matchesSearch = inspection.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.inspector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleFormChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleEdit = (index) => {
    setForm({ ...filteredInspections[index] });
    setEditIndex(index);
    setShowModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Validation
    if (!form.id.trim() || !form.model.trim() || !form.category.trim() || !form.inspector.trim() || !form.date.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (editIndex !== null) {
      // Edit mode
      const updatedList = [...inspectionList];
      // Find the actual index in inspectionList
      const actualIndex = inspectionList.findIndex(
        ins => ins.id === filteredInspections[editIndex].id
      );
      updatedList[actualIndex] = { ...form };
      setInspectionList(updatedList);
    } else {
      // Add mode
      setInspectionList(prev => [
        { ...form },
        ...prev
      ]);
    }
    setShowModal(false);
    setForm({
      id: '',
      model: '',
      category: '',
      status: 'pending',
      priority: 'medium',
      inspector: '',
      date: '',
      notes: ''
    });
    setFormError('');
    setEditIndex(null);
  };

  // Export to CSV
  const handleExport = () => {
    setIsExporting(true);
    const headers = ['Drone ID', 'Model', 'Category', 'Status', 'Priority', 'Inspector', 'Date', 'Notes'];
    const rows = inspectionList.map(i => [i.id, i.model, i.category, i.status, i.priority, i.inspector, i.date, i.notes]);
    const csv = [headers, ...rows].map(r => r.map(x => '"' + (x || '') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inspections.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setIsExporting(false), 1000);
  };

  // Delete inspection
  const handleDelete = (index) => {
    setDeleteIndex(index);
  };
  const confirmDelete = () => {
    if (deleteIndex !== null) {
      // Find the actual index in inspectionList
      const actualIndex = inspectionList.findIndex(
        ins => ins.id === filteredInspections[deleteIndex].id
      );
      if (actualIndex !== -1) {
        const updated = [...inspectionList];
        updated.splice(actualIndex, 1);
        setInspectionList(updated);
      }
      setDeleteIndex(null);
    }
  };
  const cancelDelete = () => setDeleteIndex(null);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>
            <p className="text-gray-600 mt-2"> inspections for Briech UAS drones</p>
          </div>
          <button className="btn-primary flex items-center" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Inspection
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, model, or inspector..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="pending">Pending</option>
            </select>
            <button className="btn-secondary flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-success-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Passed</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-danger-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-warning-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for New Inspection */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">{editIndex !== null ? 'Edit Inspection' : 'New Inspection'}</h2>
            {formError && <div className="mb-2 text-red-600 text-sm">{formError}</div>}
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drone ID<span className="text-red-500">*</span></label>
                <input type="text" name="id" value={form.id} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model<span className="text-red-500">*</span></label>
                <select
                  name="model"
                  value={form.model}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Model</option>
                  <option value="Xander">Xander</option>
                  <option value="Arsenio">Arsenio</option>
                  <option value="Argina">Argina</option>
                  <option value="Damisa">Damisa</option>
                  <option value="Bfly">Bfly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category<span className="text-red-500">*</span></label>
                <input type="text" name="category" value={form.category} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select name="priority" value={form.priority} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspector<span className="text-red-500">*</span></label>
                <input type="text" name="inspector" value={form.inspector} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date<span className="text-red-500">*</span></label>
                <input type="date" name="date" value={form.date} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" rows={3} />
              </div>
              <div className="flex justify-end mt-4">
                <button type="submit" className="btn-primary">Add Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspections Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Inspection Records</h3>
          <button className="btn-secondary flex items-center" onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drone ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inspector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(inspectionList.length > 0 ? filteredInspections : inspectionList).map((inspection, index) => (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {inspection.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inspection.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inspection.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(inspection.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPriorityBadge(inspection.priority)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inspection.inspector}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inspection.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-900" onClick={() => setViewInspection(inspection)}>
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900" onClick={() => handleEdit(index)}>
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-danger-600 hover:text-danger-900" onClick={() => handleDelete(index)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setViewInspection(null)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Inspection Details</h2>
            <div className="grid grid-cols-1 gap-2">
              <div><b>Drone ID:</b> {viewInspection.id}</div>
              <div><b>Model:</b> {viewInspection.model}</div>
              <div><b>Category:</b> {viewInspection.category}</div>
              <div><b>Status:</b> {viewInspection.status}</div>
              <div><b>Priority:</b> {viewInspection.priority}</div>
              <div><b>Inspector:</b> {viewInspection.inspector}</div>
              <div><b>Date:</b> {viewInspection.date}</div>
              <div><b>Notes:</b> {viewInspection.notes}</div>
            </div>
          </div>
        </div>
      )}
      {deleteIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm relative">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this inspection?</p>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-secondary" onClick={cancelDelete}>Cancel</button>
              <button className="btn-primary bg-danger-600 hover:bg-danger-700" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inspections; 