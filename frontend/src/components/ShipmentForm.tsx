import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Location {
  name: string;
  city?: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface ShipmentFormData {
  referenceNumber: string;
  customerName: string;
  origin: Location;
  destination: Location;
  mode: 'air' | 'ocean' | 'truck' | 'rail';
  status: 'pending' | 'in_transit' | 'delayed' | 'delivered' | 'breached';
  committedETA: string;
  currentETA: string;
}

interface ShipmentFormProps {
  initialData?: any | null;
  onSubmit: (data: ShipmentFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ShipmentForm: React.FC<ShipmentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const isEdit = Boolean(initialData && initialData.id);

  // Format ISO date string to datetime-local input string YYYY-MM-DDTHH:mm
  const toInputDate = (isoStr?: string) => {
    if (!isoStr) {
      const d = new Date();
      d.setHours(d.getHours() + 48);
      return d.toISOString().slice(0, 16);
    }
    try {
      return new Date(isoStr).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const [referenceNumber, setReferenceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [originName, setOriginName] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [mode, setMode] = useState<'air' | 'ocean' | 'truck' | 'rail'>('truck');
  const [status, setStatus] = useState<'pending' | 'in_transit' | 'delayed' | 'delivered' | 'breached'>('in_transit');
  const [committedETA, setCommittedETA] = useState('');
  const [currentETA, setCurrentETA] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setReferenceNumber(initialData.referenceNumber || '');
      setCustomerName(initialData.customerName || '');
      setOriginName(initialData.origin?.name || '');
      setOriginCountry(initialData.origin?.country || '');
      setDestinationName(initialData.destination?.name || '');
      setDestinationCountry(initialData.destination?.country || '');
      setMode(initialData.mode || 'truck');
      setStatus(initialData.status || 'in_transit');
      setCommittedETA(toInputDate(initialData.committedETA));
      setCurrentETA(toInputDate(initialData.currentETA));
    } else {
      setReferenceNumber(`SHP-${Math.floor(1000 + Math.random() * 9000)}`);
      setCustomerName('');
      setOriginName('');
      setOriginCountry('United States');
      setDestinationName('');
      setDestinationCountry('United States');
      setMode('truck');
      setStatus('in_transit');
      setCommittedETA(toInputDate());
      setCurrentETA(toInputDate());
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!referenceNumber.trim()) {
      setError('Reference number is required.');
      return;
    }
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!originName.trim()) {
      setError('Origin location name is required.');
      return;
    }
    if (!destinationName.trim()) {
      setError('Destination location name is required.');
      return;
    }

    const payload: ShipmentFormData = {
      referenceNumber: referenceNumber.trim(),
      customerName: customerName.trim(),
      origin: {
        name: originName.trim(),
        country: originCountry.trim() || 'United States',
        lat: initialData?.origin?.lat || 0,
        lng: initialData?.origin?.lng || 0
      },
      destination: {
        name: destinationName.trim(),
        country: destinationCountry.trim() || 'United States',
        lat: initialData?.destination?.lat || 0,
        lng: initialData?.destination?.lng || 0
      },
      mode,
      status,
      committedETA: new Date(committedETA).toISOString(),
      currentETA: new Date(currentETA).toISOString()
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setError(err.message || 'Failed to save shipment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div
        id="shipment-form-modal"
        className="w-full max-w-xl bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 id="form-modal-title" className="text-base font-bold text-slate-900">
            {isEdit ? `Edit Shipment: ${initialData.referenceNumber}` : 'Register New Shipment'}
          </h2>
          <button
            id="close-modal-btn"
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div id="form-error-alert" className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ref-number-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Reference Number *
              </label>
              <input
                id="ref-number-input"
                type="text"
                required
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="SHP-1234"
              />
            </div>

            <div>
              <label htmlFor="customer-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name *
              </label>
              <input
                id="customer-name-input"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="e.g. Apex Electronics"
              />
            </div>
          </div>

          {/* Mode & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="form-mode-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Transport Mode *
              </label>
              <select
                id="form-mode-select"
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ocean">Ocean</option>
                <option value="air">Air</option>
                <option value="truck">Truck</option>
                <option value="rail">Rail</option>
              </select>
            </div>

            <div>
              <label htmlFor="form-status-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Shipment Status *
              </label>
              <select
                id="form-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="pending">Pending</option>
                <option value="in_transit">In Transit</option>
                <option value="delayed">Delayed</option>
                <option value="delivered">Delivered</option>
                <option value="breached">Breached</option>
              </select>
            </div>
          </div>

          {/* Origin */}
          <div className="border-t border-slate-200 pt-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Origin</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="origin-name-input" className="block text-xs text-slate-600 mb-1">
                  Location / Facility Name *
                </label>
                <input
                  id="origin-name-input"
                  type="text"
                  required
                  value={originName}
                  onChange={(e) => setOriginName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g. Port of Shanghai"
                />
              </div>
              <div>
                <label htmlFor="origin-country-input" className="block text-xs text-slate-600 mb-1">
                  Country
                </label>
                <input
                  id="origin-country-input"
                  type="text"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g. China"
                />
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="border-t border-slate-200 pt-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Destination</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="destination-name-input" className="block text-xs text-slate-600 mb-1">
                  Location / Facility Name *
                </label>
                <input
                  id="destination-name-input"
                  type="text"
                  required
                  value={destinationName}
                  onChange={(e) => setDestinationName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g. Port of Long Beach"
                />
              </div>
              <div>
                <label htmlFor="destination-country-input" className="block text-xs text-slate-600 mb-1">
                  Country
                </label>
                <input
                  id="destination-country-input"
                  type="text"
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g. United States"
                />
              </div>
            </div>
          </div>

          {/* Committed & Current ETA */}
          <div className="border-t border-slate-200 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="committed-eta-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Committed ETA (SLA Deadline) *
              </label>
              <input
                id="committed-eta-input"
                type="datetime-local"
                required
                value={committedETA}
                onChange={(e) => setCommittedETA(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label htmlFor="current-eta-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Current Estimated ETA *
              </label>
              <input
                id="current-eta-input"
                type="datetime-local"
                required
                value={currentETA}
                onChange={(e) => setCurrentETA(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
            <button
              id="cancel-shipment-btn"
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-shipment-btn"
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEdit ? 'Save Changes' : 'Create Shipment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
