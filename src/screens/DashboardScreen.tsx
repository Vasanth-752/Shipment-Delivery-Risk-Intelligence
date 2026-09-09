import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { DatasetImportModal } from '../components/DatasetImportModal.js';
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Package,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface DashboardScreenProps {
  onSelectShipment: (id: string) => void;
  onNavigateToList: (filterTier?: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onSelectShipment,
  onNavigateToList,
}) => {
  const [summary, setSummary] = useState<{
    counts: { total: number; low: number; medium: number; high: number; critical: number };
    slaCounts?: { onSchedule: number; moderateRisk: number; highRisk: number; criticalBreach: number };
    topRiskShipments: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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

  const handleResetBaseline = async () => {
    try {
      setLoading(true);
      await api.resetShipments();
      await loadData();
      setActionNotice('Registry reset to default initial baseline shipments.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleImportSuccess = async () => {
    await loadData();
    setActionNotice('Dynamic dataset imported! Risk scores, SLA predictions, and AI recommendations recalculated.');
    setTimeout(() => setActionNotice(null), 4000);
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

  if (loading && !summary) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading risk intelligence summary...</p>
        </div>
      </div>
    );
  }

  if (error && !summary) {
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
  const slaCounts = summary?.slaCounts || { onSchedule: 0, moderateRisk: 0, highRisk: 0, criticalBreach: 0 };
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
            Real-time multi-factor risk scoring, SLA breach prediction, and AI operational recommendations across active shipments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="open-dataset-import-btn"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Provide Dataset</span>
          </button>

          <button
            id="reset-baseline-btn"
            onClick={handleResetBaseline}
            title="Reset to default initial shipments"
            className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Baseline</span>
          </button>

          <button
            id="view-all-shipments-btn"
            onClick={() => onNavigateToList()}
            className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <span>All Shipments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Metric Cards Grid: Risk Tiers */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Risk Index Distribution
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Total */}
          <div
            id="metric-card-total"
            onClick={() => onNavigateToList()}
            className="p-4 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-slate-400 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Monitored</span>
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
      </div>

      {/* SLA Breach Status Indicators */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              SLA Breach Prediction Status
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Calculated transit variance against committed ETA
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md">
            <span className="text-[10px] font-bold uppercase text-rose-700 block">Critical Breach Imminent</span>
            <div className="text-xl font-extrabold text-rose-900 mt-0.5">{slaCounts.criticalBreach}</div>
            <span className="text-[10px] text-rose-600">&gt;48h expected delay</span>
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
            <span className="text-[10px] font-bold uppercase text-orange-700 block">High Risk of Breach</span>
            <div className="text-xl font-extrabold text-orange-900 mt-0.5">{slaCounts.highRisk}</div>
            <span className="text-[10px] text-orange-600">18–44h expected delay</span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <span className="text-[10px] font-bold uppercase text-amber-700 block">Moderate SLA Risk</span>
            <div className="text-xl font-extrabold text-amber-900 mt-0.5">{slaCounts.moderateRisk}</div>
            <span className="text-[10px] text-amber-600">4–16h expected delay</span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">On Schedule</span>
            <div className="text-xl font-extrabold text-emerald-900 mt-0.5">{slaCounts.onSchedule}</div>
            <span className="text-[10px] text-emerald-600">0–3h delivery variance</span>
          </div>
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
              Calculated dynamically via multi-signal risk scoring and SLA prediction engine.
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
                <th className="px-5 py-3">Shipment Ref</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Route</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3">Risk Score</th>
                <th className="px-5 py-3">SLA Breach Status</th>
                <th className="px-5 py-3">Newly Est. Delay</th>
                <th className="px-5 py-3">AI Recommendation</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {topRisk.map((s) => (
                <tr
                  key={s.id}
                  id={`top-risk-row-${s.id}`}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                    {s.referenceNumber}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {s.customerName}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    <span className="font-medium text-slate-700">
                      {s.origin?.city || s.origin?.name}
                    </span>
                    <span className="mx-1 text-slate-400">→</span>
                    <span className="font-medium text-slate-700">
                      {s.destination?.city || s.destination?.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 uppercase tracking-wide text-slate-600 font-medium">
                    {s.mode}
                  </td>
                  <td className="px-5 py-3.5">
                    <RiskBadge score={s.riskScore} tier={s.riskTier} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        s.slaBreachStatus === 'Critical Breach Imminent'
                          ? 'bg-rose-100 text-rose-800'
                          : s.slaBreachStatus === 'High Risk of Breach'
                          ? 'bg-orange-100 text-orange-800'
                          : s.slaBreachStatus === 'Moderate SLA Risk'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {s.slaBreachStatus || 'On Schedule'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col">
                      <span className={`font-semibold ${s.estimatedDelayHours > 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                        {s.estimatedDelayHours > 0 ? `+${s.estimatedDelayHours}h` : 'On track'}
                      </span>
                      {s.newlyEstimatedETA && (
                        <span className="text-slate-400 text-[10px] font-mono">
                          ETA: {formatDate(s.newlyEstimatedETA)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {s.recommendationAction ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                        {s.recommendationAction.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Calculated</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
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

      {/* Dataset Import Modal */}
      <DatasetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

