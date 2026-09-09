import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { AlertTriangle, ArrowRight, ShieldAlert, Package, Clock, ExternalLink } from 'lucide-react';

interface DashboardScreenProps {
  onSelectShipment: (id: string) => void;
  onNavigateToList: (filterTier?: string) => void;
  onAddNewShipment: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onSelectShipment,
  onNavigateToList,
  onAddNewShipment,
}) => {
  const [summary, setSummary] = useState<{
    counts: { total: number; low: number; medium: number; high: number; critical: number };
    topRiskShipments: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading risk intelligence summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-rose-700 text-white rounded text-xs font-semibold hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const counts = summary?.counts || { total: 0, low: 0, medium: 0, high: 0, critical: 0 };
  const topRisk = summary?.topRiskShipments || [];

  return (
    <div id="dashboard-screen" className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 id="dashboard-title" className="text-xl font-bold text-slate-900">
            Supply Chain Risk Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time risk scoring, SLA breach prediction, and AI operational recommendations across active shipments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="quick-add-shipment-btn"
            onClick={onAddNewShipment}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors"
          >
            + Register Shipment
          </button>
          <button
            id="view-all-shipments-btn"
            onClick={() => onNavigateToList()}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <span>All Shipments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total */}
        <div
          id="metric-card-total"
          onClick={() => onNavigateToList()}
          className="p-4 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Active</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{counts.total}</div>
          <span className="text-xs text-slate-400">All managed shipments</span>
        </div>

        {/* Critical */}
        <div
          id="metric-card-critical"
          onClick={() => onNavigateToList('critical')}
          className="p-4 bg-rose-50/50 border border-rose-200 rounded-lg cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical (9–10)</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-900">{counts.critical}</div>
          <span className="text-xs text-rose-700">Immediate action required</span>
        </div>

        {/* High */}
        <div
          id="metric-card-high"
          onClick={() => onNavigateToList('high')}
          className="p-4 bg-orange-50/50 border border-orange-200 rounded-lg cursor-pointer hover:border-orange-400 transition-colors"
        >
          <div className="flex items-center justify-between text-orange-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">High (7–8.9)</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-900">{counts.high}</div>
          <span className="text-xs text-orange-700">Elevated breach probability</span>
        </div>

        {/* Medium */}
        <div
          id="metric-card-medium"
          onClick={() => onNavigateToList('medium')}
          className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Medium (4–6.9)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{counts.medium}</div>
          <span className="text-xs text-amber-700">Monitoring recommended</span>
        </div>

        {/* Low */}
        <div
          id="metric-card-low"
          onClick={() => onNavigateToList('low')}
          className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Low (1–3.9)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{counts.low}</div>
          <span className="text-xs text-emerald-700">On schedule</span>
        </div>
      </div>

      {/* Top-Risk Shipments Section */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 id="top-risk-heading" className="text-sm font-bold text-slate-900">
              Highest Risk Shipments (Top 5)
            </h2>
            <p className="text-xs text-slate-500">
              Ranked by deterministic multi-signal risk scoring engine.
            </p>
          </div>
          <button
            id="view-full-registry-link"
            onClick={() => onNavigateToList()}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            <span>View Full Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table id="top-risk-table" className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3">Shipment Ref</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Route</th>
                <th className="px-6 py-3">Mode</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Risk Score</th>
                <th className="px-6 py-3">SLA Breach Risk</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {topRisk.map((s) => (
                <tr
                  key={s.id}
                  id={`top-risk-row-${s.id}`}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                    {s.referenceNumber}
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-800">
                    {s.customerName}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">
                    <span className="font-medium text-slate-700">{s.origin?.city || s.origin?.name}</span>
                    <span className="mx-1 text-slate-400">→</span>
                    <span className="font-medium text-slate-700">{s.destination?.city || s.destination?.name}</span>
                  </td>
                  <td className="px-6 py-3.5 uppercase tracking-wide text-slate-600 font-medium">
                    {s.mode}
                  </td>
                  <td className="px-6 py-3.5">
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
                  <td className="px-6 py-3.5">
                    <RiskBadge score={s.riskScore} tier={s.riskTier} />
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">
                        {Math.round((s.breachProbability || 0) * 100)}% prob.
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        +{s.estimatedDelayHours}h est. delay
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      id={`drill-down-btn-${s.id}`}
                      onClick={() => onSelectShipment(s.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-800 rounded hover:bg-slate-200 font-medium transition-colors"
                    >
                      <span>Drill Down</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
