import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { SearchBar } from '../components/SearchBar.js';
import { FilterBar, FilterState } from '../components/FilterBar.js';
import { ExternalLink, Loader2 } from 'lucide-react';

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 id="shipment-registry-heading" className="text-xl font-bold text-slate-900">
            Shipment Registry
          </h1>
          <p className="text-xs text-slate-500">
            Real-time risk scoring, SLA breach predictions, and multi-factor filtering.
          </p>
        </div>
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
                <th className="px-5 py-3 text-right">Details</th>
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
                      <div className="font-medium text-slate-800">
                        {s.origin?.city || s.origin?.name}
                        {s.origin?.state ? `, ${s.origin.state}` : ''}
                        {s.origin?.pincode ? ` (${s.origin.pincode})` : ''}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        to {s.destination?.city || s.destination?.name}
                        {s.destination?.state ? `, ${s.destination.state}` : ''}
                        {s.destination?.pincode ? ` (${s.destination.pincode})` : ''}
                      </div>
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
                      <button
                        id={`view-detail-btn-${s.id}`}
                        title="Inspect Shipment Risk & SLA"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectShipment(s.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
