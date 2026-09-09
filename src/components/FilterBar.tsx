import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export interface FilterState {
  mode: string;
  status: string;
  riskTier: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onReset
}) => {
  const update = (key: keyof FilterState, val: any) => {
    onChange({ ...filters, [key]: val });
  };

  const hasActiveFilters =
    filters.mode !== 'all' ||
    filters.status !== 'all' ||
    filters.riskTier !== 'all';

  return (
    <div id="filter-bar" className="flex flex-wrap items-center gap-3">
      {/* Mode Filter */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="mode-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Mode
        </label>
        <select
          id="mode-select"
          value={filters.mode}
          onChange={(e) => update('mode', e.target.value)}
          className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="all">All Modes</option>
          <option value="ocean">Ocean</option>
          <option value="air">Air</option>
          <option value="truck">Truck</option>
          <option value="rail">Rail</option>
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="status-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Status
        </label>
        <select
          id="status-select"
          value={filters.status}
          onChange={(e) => update('status', e.target.value)}
          className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="all">All Statuses</option>
          <option value="in_transit">In Transit</option>
          <option value="delayed">Delayed</option>
          <option value="pending">Pending</option>
          <option value="delivered">Delivered</option>
          <option value="breached">Breached</option>
        </select>
      </div>

      {/* Risk Tier Filter */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="risk-tier-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Risk Tier
        </label>
        <select
          id="risk-tier-select"
          value={filters.riskTier}
          onChange={(e) => update('riskTier', e.target.value)}
          className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="all">All Tiers</option>
          <option value="critical">Critical (9–10)</option>
          <option value="high">High (7–8.9)</option>
          <option value="medium">Medium (4–6.9)</option>
          <option value="low">Low (1–3.9)</option>
        </select>
      </div>

      {/* Sort By */}
      <div className="flex items-center gap-1.5 ml-auto">
        <label htmlFor="sort-by-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Sort
        </label>
        <select
          id="sort-by-select"
          value={filters.sortBy}
          onChange={(e) => update('sortBy', e.target.value)}
          className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="riskScore">Risk Score</option>
          <option value="currentETA">Current ETA</option>
          <option value="referenceNumber">Reference Number</option>
          <option value="customerName">Customer</option>
        </select>

        <button
          id="toggle-sort-order-btn"
          type="button"
          onClick={() => update('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
          title={filters.sortOrder === 'asc' ? 'Ascending (click to make Descending)' : 'Descending (click to make Ascending)'}
          className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>

        {hasActiveFilters && onReset && (
          <button
            id="reset-filters-btn"
            type="button"
            onClick={onReset}
            className="text-xs text-slate-600 hover:text-slate-900 underline ml-1"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
