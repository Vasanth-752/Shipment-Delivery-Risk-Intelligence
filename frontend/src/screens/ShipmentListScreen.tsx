import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { SearchBar } from '../components/SearchBar.js';
import { FilterBar, FilterState } from '../components/FilterBar.js';
import { ShipmentForm, ShipmentFormData } from '../components/ShipmentForm.js';
import { Plus, Edit2, Trash2, ExternalLink, Loader2 } from 'lucide-react';

interface ShipmentListScreenProps {
  onSelectShipment: (id: string) => void;
  initialRiskTier?: string;
}

export const ShipmentListScreen: React.FC<ShipmentListScreenProps> = ({
  onSelectShipment,
  initialRiskTier = 'all'
}) => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    mode: 'all',
    status: 'all',
    riskTier: initialRiskTier || 'all',
    sortBy: 'riskScore',
    sortOrder: 'desc'
  });

  // Modal form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getShipments({
        search,
        mode: filters.mode,
        status: filters.status,
        riskTier: filters.riskTier,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      setShipments(res.shipments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search / filter update
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchList();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, filters]);

  const handleOpenCreate = () => {
    setEditingShipment(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (shipment: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShipment(shipment);
    setFormOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to delete this shipment? This will remove all associated risk signals and predictions.');
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await api.deleteShipment(id);
      setShipments(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete shipment');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async (formData: ShipmentFormData) => {
    setIsSubmitting(true);
    try {
      if (editingShipment && editingShipment.id) {
        await api.updateShipment(editingShipment.id, formData);
      } else {
        await api.createShipment(formData);
      }
      setFormOpen(false);
      setEditingShipment(null);
      await fetchList();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilters({
      mode: 'all',
      status: 'all',
      riskTier: 'all',
      sortBy: 'riskScore',
      sortOrder: 'desc'
    });
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div id="shipment-list-screen" className="space-y-4">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 id="shipment-registry-heading" className="text-xl font-bold text-slate-900">
            Shipment Registry
          </h1>
          <p className="text-xs text-slate-500">
            CRUD operations, multi-factor filtering, search, and live risk scores.
          </p>
        </div>
        <button
          id="add-shipment-main-btn"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Shipment</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div id="shipment-list-error" className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Shipment Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table id="shipments-table" className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Reference #</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3">Origin / Destination</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Risk Tier</th>
                <th className="px-5 py-3">Committed SLA</th>
                <th className="px-5 py-3">Est. Delay</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
                    <span>Loading registry...</span>
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                    <p className="font-medium">No shipments match the current filters.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-2 text-xs text-slate-800 underline font-semibold"
                    >
                      Clear search and filters
                    </button>
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr
                    key={s.id}
                    id={`shipment-row-${s.id}`}
                    onClick={() => onSelectShipment(s.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 group-hover:text-blue-700">
                      {s.referenceNumber}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {s.customerName}
                    </td>
                    <td className="px-5 py-3.5 uppercase font-medium text-slate-600">
                      {s.mode}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <div className="font-medium text-slate-800">{s.origin?.city || s.origin?.name}</div>
                      <div className="text-[11px] text-slate-400">to {s.destination?.city || s.destination?.name}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                          s.status === 'delayed'
                            ? 'bg-orange-100 text-orange-800'
                            : s.status === 'breached'
                            ? 'bg-rose-100 text-rose-800'
                            : s.status === 'in_transit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <RiskBadge score={s.riskScore} tier={s.riskTier} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      {formatDate(s.committedETA)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${s.estimatedDelayHours > 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                        {s.estimatedDelayHours > 0 ? `+${s.estimatedDelayHours}h` : 'On track'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          id={`view-detail-btn-${s.id}`}
                          title="View Drill-Down Details"
                          onClick={() => onSelectShipment(s.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`edit-shipment-btn-${s.id}`}
                          title="Edit Shipment"
                          onClick={(e) => handleOpenEdit(s, e)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-shipment-btn-${s.id}`}
                          title="Delete Shipment"
                          disabled={deletingId === s.id}
                          onClick={(e) => handleDelete(s.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        >
                          {deletingId === s.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {formOpen && (
        <ShipmentForm
          initialData={editingShipment}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditingShipment(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};
