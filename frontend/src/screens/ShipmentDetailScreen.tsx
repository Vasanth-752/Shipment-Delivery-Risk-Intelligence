import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { RiskBadge } from '../components/RiskBadge.js';
import {
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  MapPin,
  Calendar,
  CloudSun,
  Truck,
  Anchor,
  Plane,
  Globe,
  Radio,
  Loader2
} from 'lucide-react';

interface ShipmentDetailScreenProps {
  shipmentId: string;
  onBack: () => void;
}

export const ShipmentDetailScreen: React.FC<ShipmentDetailScreenProps> = ({
  shipmentId,
  onBack
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getShipmentDetail(shipmentId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load shipment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [shipmentId]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-800 mb-3" />
        <p className="text-sm font-medium text-slate-600">
          Analyzing shipment signals, scoring risk, and generating AI recommendation...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="p-4 bg-rose-50 border border-rose-200 rounded text-rose-800 text-sm">
          {error || 'Shipment not found'}
        </div>
      </div>
    );
  }

  const { shipment, signals, score, prediction, recommendation } = data;

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return <CloudSun className="w-4 h-4 text-sky-600" />;
      case 'traffic':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'port_congestion':
        return <Anchor className="w-4 h-4 text-indigo-600" />;
      case 'flight_status':
        return <Plane className="w-4 h-4 text-purple-600" />;
      case 'geopolitical':
        return <Globe className="w-4 h-4 text-rose-600" />;
      case 'news':
        return <Radio className="w-4 h-4 text-slate-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'reroute':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'expedite':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'hold':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'notify_customer':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'no_action':
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div id="shipment-detail-screen" className="space-y-6 max-w-6xl mx-auto">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            id="back-to-list-btn"
            onClick={onBack}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 id="detail-reference-number" className="text-xl font-bold font-mono text-slate-900">
                {shipment.referenceNumber}
              </h1>
              <span className="px-2 py-0.5 uppercase tracking-wide text-[11px] font-semibold bg-slate-100 text-slate-700 rounded">
                {shipment.mode}
              </span>
              <span
                className={`px-2 py-0.5 text-[11px] font-semibold rounded capitalize ${
                  shipment.status === 'delayed'
                    ? 'bg-orange-100 text-orange-800'
                    : shipment.status === 'breached'
                    ? 'bg-rose-100 text-rose-800'
                    : shipment.status === 'in_transit'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {shipment.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <span className="font-semibold text-slate-800">{shipment.customerName}</span>
            </p>
          </div>
        </div>

        <div>
          <RiskBadge score={score?.score} tier={score?.riskTier} size="lg" />
        </div>
      </div>

      {/* Origin, Destination & ETA Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Origin</span>
          </div>
          <p className="text-sm font-bold text-slate-900">{shipment.origin?.name}</p>
          <p className="text-slate-500">
            {[shipment.origin?.city, shipment.origin?.country].filter(Boolean).join(', ')}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Destination</span>
          </div>
          <p className="text-sm font-bold text-slate-900">{shipment.destination?.name}</p>
          <p className="text-slate-500">
            {[shipment.destination?.city, shipment.destination?.country].filter(Boolean).join(', ')}
          </p>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l md:pl-4 border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>SLA & Delivery Schedule</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-slate-500">Committed SLA:</span>
            <span className="font-mono font-semibold text-slate-800">{formatDate(shipment.committedETA)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-slate-500">Current Est. ETA:</span>
            <span className="font-mono font-semibold text-slate-800">{formatDate(shipment.currentETA)}</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Risk Scoring & SLA Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Scoring Engine & Explainability */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Risk Scoring Engine
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600">
              Score: {score?.score.toFixed(1)} / 10
            </span>
          </div>

          <div className="p-5 space-y-4 flex-1">
            {/* Score Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Calculated Risk Index</span>
                <span className="font-bold uppercase tracking-wider text-slate-900">{score?.riskTier} Tier</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 ${
                    score?.riskTier === 'critical'
                      ? 'bg-rose-600'
                      : score?.riskTier === 'high'
                      ? 'bg-orange-500'
                      : score?.riskTier === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (score?.score / 10) * 100)}%` }}
                />
              </div>
            </div>

            {/* Explainability Breakdown */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Score Explainability (Contribution Breakdown)
                </h3>
              </div>

              {score?.contributingSignals && score.contributingSignals.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {score.contributingSignals.map((contrib: any, idx: number) => {
                    const matchedSignal = signals.find((s: any) => s.id === contrib.signalId);
                    return (
                      <div
                        key={contrib.signalId || idx}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getSignalIcon(contrib.signalType)}
                          <div className="truncate">
                            <span className="font-semibold capitalize text-slate-800">
                              {contrib.signalType.replace('_', ' ')}
                            </span>
                            {matchedSignal && (
                              <p className="text-[11px] text-slate-500 truncate max-w-xs">
                                {matchedSignal.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-slate-900">
                            +{contrib.contributionScore.toFixed(2)} pts
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {Math.round(contrib.weight * 100)}% weight
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No signals contributed to score variance.</p>
              )}
            </div>
          </div>
        </div>

        {/* SLA Breach Prediction */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">
                SLA Breach Prediction
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Deterministic predictive model
            </span>
          </div>

          <div className="p-5 space-y-5 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Breach Probability
                </span>
                <span className="text-3xl font-extrabold text-slate-900">
                  {Math.round((prediction?.breachProbability || 0) * 100)}%
                </span>
                <span className="block text-[11px] text-slate-500 mt-1">
                  Likelihood of missing committed SLA
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Estimated Delay
                </span>
                <span className="text-3xl font-extrabold text-slate-900">
                  +{prediction?.estimatedDelayHours || 0}h
                </span>
                <span className="block text-[11px] text-slate-500 mt-1">
                  Expected delivery variance
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Breach Likelihood Bar</span>
                <span className="font-mono text-slate-600">{(prediction?.breachProbability || 0).toFixed(2)} / 1.00</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    (prediction?.breachProbability || 0) >= 0.75
                      ? 'bg-rose-600'
                      : (prediction?.breachProbability || 0) >= 0.4
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (prediction?.breachProbability || 0) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Generated Operational Recommendation (Feature #6) */}
      <div id="ai-recommendation-card" className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900">
              AI-Generated Operational Recommendation (Gemini API)
            </h2>
          </div>
          {recommendation?.action && (
            <span
              className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${getActionColor(
                recommendation.action
              )}`}
            >
              Action: {recommendation.action.replace('_', ' ')}
            </span>
          )}
        </div>

        <p className="text-sm text-slate-800 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-md border border-slate-200">
          {recommendation?.aiGeneratedText || 'Generating operational advice...'}
        </p>

        {recommendation?.estimatedImpact && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Estimated Operational Impact:</span>
            <span>{recommendation.estimatedImpact}</span>
          </div>
        )}
      </div>

      {/* Active Risk Signals List (Feature #2) */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Active Risk Signals ({signals.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Simulated multimodal telemetry
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {signals.map((sig: any) => (
            <div key={sig.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-md mt-0.5">
                  {getSignalIcon(sig.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 capitalize">
                      {sig.type.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                        sig.severity === 'severe'
                          ? 'bg-rose-100 text-rose-800'
                          : sig.severity === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : sig.severity === 'moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sig.severity}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {Math.round(sig.confidence * 100)}% conf.
                    </span>
                  </div>
                  <p className="text-slate-700 mt-1">{sig.description}</p>
                </div>
              </div>

              <div className="text-right sm:shrink-0 text-slate-400 text-[11px]">
                <span>Detected: {formatDate(sig.detectedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
