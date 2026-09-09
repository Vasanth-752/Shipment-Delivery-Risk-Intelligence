import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  RefreshCw,
  Loader2,
  ArrowRight
} from 'lucide-react';

interface DatasetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  function parseLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = vals[idx] !== undefined ? vals[idx] : '';
    });
    rows.push(row);
  }
  return rows;
}

export const DatasetImportModal: React.FC<DatasetImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'sample' | 'paste' | 'upload'>('sample');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  const [rawText, setRawText] = useState('');
  const [formatType, setFormatType] = useState<'csv' | 'json'>('csv');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sampleData, setSampleData] = useState<{ dataset: any[]; csv: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<any | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Fetch sample dataset on mount
  useEffect(() => {
    if (isOpen) {
      api.getSampleDataset()
        .then(res => {
          setSampleData(res);
          if (activeTab === 'sample') {
            setParsedRows(res.dataset || []);
          }
        })
        .catch(err => {
          console.error('Failed to load sample dataset', err);
        });
    }
  }, [isOpen]);

  // Handle parse when rawText or formatType changes
  useEffect(() => {
    if (activeTab === 'sample') {
      if (sampleData) {
        setParsedRows(sampleData.dataset || []);
        setParseError(null);
      }
      return;
    }

    if (!rawText.trim()) {
      setParsedRows([]);
      setParseError(null);
      return;
    }

    try {
      if (formatType === 'json') {
        const parsed = JSON.parse(rawText);
        const list = Array.isArray(parsed) ? parsed : parsed.shipments || [parsed];
        setParsedRows(list);
        setParseError(null);
      } else {
        const rows = parseCSV(rawText);
        if (rows.length === 0) {
          setParseError('No rows found. Please verify CSV header and row format.');
          setParsedRows([]);
        } else {
          setParsedRows(rows);
          setParseError(null);
        }
      }
    } catch (err: any) {
      setParseError(`Syntax error in ${formatType.toUpperCase()} input: ${err.message}`);
      setParsedRows([]);
    }
  }, [rawText, formatType, activeTab, sampleData]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const isJson = file.name.endsWith('.json') || content.trim().startsWith('[') || content.trim().startsWith('{');
      setFormatType(isJson ? 'json' : 'csv');
      setRawText(content);
      setActiveTab('paste');
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    if (!sampleData?.csv) return;
    const blob = new Blob([sampleData.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_shipments_dataset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySample = () => {
    if (!sampleData) return;
    const textToCopy = formatType === 'json'
      ? JSON.stringify(sampleData.dataset, null, 2)
      : sampleData.csv;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleLoadSampleIntoEditor = () => {
    if (!sampleData) return;
    setActiveTab('paste');
    setRawText(formatType === 'json' ? JSON.stringify(sampleData.dataset, null, 2) : sampleData.csv);
  };

  const handleExecuteCalculation = async () => {
    if (parsedRows.length === 0) return;

    try {
      setIsProcessing(true);
      setParseError(null);
      const res = await api.importShipments(parsedRows, importMode);
      setImportResults(res);
      onSuccess(res);
    } catch (err: any) {
      setParseError(err.message || 'Failed to process dataset');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="dataset-import-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        id="dataset-import-modal-container"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-slate-900" />
              <h2 id="import-modal-title" className="text-base font-bold text-slate-900">
                Dynamic Dataset Input & Risk Intelligence Calculator
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Provide shipment data (id, Reference ID, customerName, origin, destination, mode, committedETA) to calculate Risk Score, SLA Breach Status, newly estimated delay, and AI recommendations.
            </p>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {importResults ? (
            /* Results Presentation View */
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">
                    Calculations Complete & Dashboard Updated!
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {importResults.message} Total active monitored shipments: <strong>{importResults.totalManagedCount}</strong>.
                  </p>
                </div>
              </div>

              {/* Calculated Items Table Preview */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-800 flex justify-between items-center">
                  <span>Calculated Risk Scores & SLA Predictions ({importResults.items?.length || 0})</span>
                  <span className="text-[11px] font-normal text-slate-500">Includes multi-factor telemetry & AI advice</span>
                </div>
                <div className="max-h-72 overflow-y-auto overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2">Ref ID</th>
                        <th className="px-3 py-2">Customer</th>
                        <th className="px-3 py-2">Mode</th>
                        <th className="px-3 py-2">Risk Score</th>
                        <th className="px-3 py-2">SLA Breach Status</th>
                        <th className="px-3 py-2">Newly Est. Delay</th>
                        <th className="px-3 py-2">AI Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {importResults.items?.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono font-bold text-slate-900">
                            {item.referenceNumber}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {item.customerName}
                          </td>
                          <td className="px-3 py-2 uppercase text-slate-600 font-semibold text-[11px]">
                            {item.mode}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                item.riskTier === 'critical'
                                  ? 'bg-rose-100 text-rose-800'
                                  : item.riskTier === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : item.riskTier === 'medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.riskScore.toFixed(1)} / 10 ({item.riskTier})
                            </span>
                          </td>
                          <td className="px-3 py-2 font-medium">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                item.slaBreachStatus === 'Critical Breach Imminent'
                                  ? 'bg-rose-100 text-rose-800'
                                  : item.slaBreachStatus === 'High Risk of Breach'
                                  ? 'bg-orange-100 text-orange-800'
                                  : item.slaBreachStatus === 'Moderate SLA Risk'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.slaBreachStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono">
                            <span className={item.estimatedDelayHours > 0 ? 'text-rose-700 font-bold' : 'text-slate-600'}>
                              {item.estimatedDelayHours > 0 ? `+${item.estimatedDelayHours}h` : '0h (On track)'}
                            </span>
                          </td>
                          <td className="px-3 py-2 max-w-xs truncate text-slate-700" title={item.recommendation?.aiGeneratedText}>
                            <span className="font-semibold text-slate-900 capitalize">
                              [{item.recommendation?.action?.replace('_', ' ')}]
                            </span>{' '}
                            {item.recommendation?.aiGeneratedText}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="import-another-btn"
                  onClick={() => {
                    setImportResults(null);
                    setRawText('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Import Another Dataset
                </button>
                <button
                  id="view-results-dashboard-btn"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <span>View in Dashboard & Registry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Input & Configuration View */
            <div className="space-y-5">
              {/* Input Mode Navigation Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    id="tab-sample-dataset"
                    onClick={() => setActiveTab('sample')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === 'sample'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. Use Sample Dataset
                  </button>
                  <button
                    id="tab-paste-data"
                    onClick={() => setActiveTab('paste')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === 'paste'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Paste / Direct Edit
                  </button>
                  <button
                    id="tab-upload-file"
                    onClick={() => setActiveTab('upload')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === 'upload'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3. Upload File (.csv / .json)
                  </button>
                </div>

                {/* Import Mode: Replace vs Append */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Import Strategy:</span>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span className="font-semibold text-slate-800">Replace current</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer ml-2">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span className="font-semibold text-slate-800">Append to list</span>
                  </label>
                </div>
              </div>

              {/* Tab 1: Sample Dataset Overview */}
              {activeTab === 'sample' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Included Reference Dataset ({sampleData?.dataset?.length || 8} Shipments)
                      </span>
                      <span className="text-slate-500">
                        Contains required fields: <code>id</code>, <code>Reference ID</code>, <code>customerName</code>, <code>origin</code>, <code>destination</code>, <code>mode</code>, <code>committedETA</code>.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleDownloadSampleCsv}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1 text-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download CSV</span>
                      </button>
                      <button
                        onClick={handleCopySample}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1 text-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedNotification ? 'Copied!' : 'Copy Sample'}</span>
                      </button>
                      <button
                        onClick={handleLoadSampleIntoEditor}
                        className="px-2.5 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 font-semibold flex items-center gap-1 text-xs"
                      >
                        <span>Edit in Text Area</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Paste / Direct Edit */}
              {activeTab === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-700">Format:</span>
                      <button
                        onClick={() => {
                          setFormatType('csv');
                          if (!rawText && sampleData) setRawText(sampleData.csv);
                        }}
                        className={`px-2.5 py-1 rounded font-mono font-bold ${
                          formatType === 'csv'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => {
                          setFormatType('json');
                          if (!rawText && sampleData) setRawText(JSON.stringify(sampleData.dataset, null, 2));
                        }}
                        className={`px-2.5 py-1 rounded font-mono font-bold ${
                          formatType === 'json'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        JSON
                      </button>
                    </div>
                    <button
                      onClick={handleLoadSampleIntoEditor}
                      className="text-xs text-slate-700 hover:text-slate-900 font-semibold underline"
                    >
                      Fill with Sample Template
                    </button>
                  </div>

                  <textarea
                    id="raw-dataset-textarea"
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={
                      formatType === 'csv'
                        ? 'id,Reference ID,customerName,origin,destination,mode,committedETA\nSMP-001,REF-OCN-8812,Global Electronics,"Shanghai, China","Rotterdam, Netherlands",ocean,2026-09-16T14:00:00.000Z'
                        : '[\n  {\n    "id": "SMP-001",\n    "Reference ID": "REF-OCN-8812",\n    "customerName": "Global Electronics",\n    "origin": "Shanghai, China",\n    "destination": "Rotterdam, Netherlands",\n    "mode": "ocean",\n    "committedETA": "2026-09-16T14:00:00.000Z"\n  }\n]'
                    }
                    className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-slate-900 text-emerald-300"
                  />
                </div>
              )}

              {/* Tab 3: Upload File */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <label
                    htmlFor="dataset-file-input"
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-slate-900 block">
                        Drop your dataset file here, or click to browse
                      </span>
                      <span className="text-xs text-slate-500 block mt-1">
                        Accepts CSV (.csv) or JSON (.json) with headers: id, Reference ID, customerName, origin, destination, mode, committedETA
                      </span>
                    </div>
                    <input
                      id="dataset-file-input"
                      type="file"
                      accept=".csv,.json,text/csv,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Parse Error Notification */}
              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Parsed Rows Preview Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Parsed Dataset Preview ({parsedRows.length} shipments detected)
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Columns mapped: id, Reference ID, customerName, origin, destination, mode, committedETA
                  </span>
                </div>
                <div className="max-h-52 overflow-y-auto overflow-x-auto text-xs">
                  {parsedRows.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      No records loaded yet. Choose the sample dataset or paste rows above.
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[10px] uppercase">
                        <tr>
                          <th className="px-3 py-1.5">ID</th>
                          <th className="px-3 py-1.5">Reference ID</th>
                          <th className="px-3 py-1.5">Customer</th>
                          <th className="px-3 py-1.5">Origin</th>
                          <th className="px-3 py-1.5">Destination</th>
                          <th className="px-3 py-1.5">Mode</th>
                          <th className="px-3 py-1.5">Committed ETA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                        {parsedRows.map((r, idx) => {
                          const ref = r.referenceNumber || r['Reference ID'] || r.referenceId || r.id;
                          const cust = r.customerName || r['Customer Name'] || r.customer || '—';
                          const orig = typeof r.origin === 'object' ? r.origin?.name || r.origin?.city : r.origin;
                          const dest = typeof r.destination === 'object' ? r.destination?.name || r.destination?.city : r.destination;
                          return (
                            <tr key={r.id || idx} className="hover:bg-slate-50">
                              <td className="px-3 py-1.5 text-slate-500">{r.id || `row-${idx + 1}`}</td>
                              <td className="px-3 py-1.5 font-bold text-slate-900">{ref}</td>
                              <td className="px-3 py-1.5 font-sans font-medium text-slate-800">{cust}</td>
                              <td className="px-3 py-1.5 font-sans text-slate-600 truncate max-w-[140px]">{orig}</td>
                              <td className="px-3 py-1.5 font-sans text-slate-600 truncate max-w-[140px]">{dest}</td>
                              <td className="px-3 py-1.5 uppercase font-semibold text-slate-700">{r.mode || 'truck'}</td>
                              <td className="px-3 py-1.5 text-slate-600">{r.committedETA}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!importResults && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-xs text-slate-500">
              Ready to evaluate {parsedRows.length} shipment(s) with multimodal risk modeling.
            </span>

            <div className="flex items-center gap-3">
              <button
                id="cancel-import-btn"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                id="execute-calculate-btn"
                disabled={parsedRows.length === 0 || isProcessing}
                onClick={handleExecuteCalculation}
                className={`px-5 py-2 rounded-md text-xs font-semibold text-white flex items-center gap-2 transition-colors ${
                  parsedRows.length === 0 || isProcessing
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Calculating Risk, SLA & AI Recommendations...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Process & Calculate Intelligence</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
