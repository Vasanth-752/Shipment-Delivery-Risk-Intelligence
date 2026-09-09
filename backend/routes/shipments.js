import express from 'express';
import { INITIAL_SHIPMENTS } from '../data/seedData.js';
import { generateSignalsForShipment } from '../logic/signalGenerator.js';
import { calculateRiskScore } from '../logic/riskScoring.js';
import { predictSLABreach } from '../logic/slaPrediction.js';
import { generateRecommendation } from '../logic/recommendation.js';

export const shipmentsRouter = express.Router();

// In-memory data store matching Data Model Schema
const shipments = new Map();
const signalsStore = new Map();
const scoresStore = new Map();
const slaStore = new Map();
const recommendationsStore = new Map();

// Initialize seed data at server startup
function initializeSeedData() {
  for (const item of INITIAL_SHIPMENTS) {
    shipments.set(item.id, item);
    const signals = generateSignalsForShipment(item);
    signalsStore.set(item.id, signals);
    const scoreResult = calculateRiskScore(item, signals);
    scoresStore.set(item.id, scoreResult);
    const slaResult = predictSLABreach(scoreResult);
    slaStore.set(item.id, slaResult);
    // Recommendations are generated lazily on GET /api/shipments/:id to avoid startup overhead
  }
}

initializeSeedData();

/**
 * GET /api/shipments
 * List shipments with filtering (mode, status, riskTier, search) and sorting
 */
shipmentsRouter.get('/shipments', (req, res) => {
  const { mode, status, riskTier, search, sortBy, sortOrder } = req.query;

  let list = Array.from(shipments.values()).map(shipment => {
    const score = scoresStore.get(shipment.id);
    const sla = slaStore.get(shipment.id);
    return {
      ...shipment,
      riskScore: score ? score.score : 1.0,
      riskTier: score ? score.riskTier : 'low',
      estimatedDelayHours: sla ? sla.estimatedDelayHours : 0,
      breachProbability: sla ? sla.breachProbability : 0
    };
  });

  // Filter by mode
  if (mode && mode !== 'all') {
    list = list.filter(s => s.mode.toLowerCase() === String(mode).toLowerCase());
  }

  // Filter by status
  if (status && status !== 'all') {
    list = list.filter(s => s.status.toLowerCase() === String(status).toLowerCase());
  }

  // Filter by riskTier
  if (riskTier && riskTier !== 'all') {
    list = list.filter(s => s.riskTier.toLowerCase() === String(riskTier).toLowerCase());
  }

  // Filter by search (case-insensitive substring on referenceNumber or customerName)
  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase();
    list = list.filter(s =>
      (s.referenceNumber && s.referenceNumber.toLowerCase().includes(q)) ||
      (s.customerName && s.customerName.toLowerCase().includes(q))
    );
  }

  // Sorting
  const order = sortOrder === 'asc' ? 1 : -1;
  if (sortBy === 'riskScore') {
    list.sort((a, b) => (a.riskScore - b.riskScore) * order);
  } else if (sortBy === 'referenceNumber') {
    list.sort((a, b) => a.referenceNumber.localeCompare(b.referenceNumber) * order);
  } else if (sortBy === 'customerName') {
    list.sort((a, b) => a.customerName.localeCompare(b.customerName) * order);
  } else if (sortBy === 'currentETA') {
    list.sort((a, b) => new Date(a.currentETA).getTime() - new Date(b.currentETA).getTime() * order);
  } else {
    // Default sort: highest risk score first
    list.sort((a, b) => b.riskScore - a.riskScore);
  }

  res.json({ shipments: list, total: list.length });
});

/**
 * GET /api/dashboard/summary
 * Returns counts by risk tier and top-risk shipments
 */
shipmentsRouter.get('/dashboard/summary', (req, res) => {
  const allShipments = Array.from(shipments.values()).map(shipment => {
    const score = scoresStore.get(shipment.id);
    const sla = slaStore.get(shipment.id);
    return {
      ...shipment,
      riskScore: score ? score.score : 1.0,
      riskTier: score ? score.riskTier : 'low',
      estimatedDelayHours: sla ? sla.estimatedDelayHours : 0,
      breachProbability: sla ? sla.breachProbability : 0
    };
  });

  const counts = {
    total: allShipments.length,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };

  for (const s of allShipments) {
    if (counts[s.riskTier] !== undefined) {
      counts[s.riskTier]++;
    }
  }

  // Top risk shipments (sorted descending by risk score, top 5)
  const topRisk = [...allShipments]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  res.json({
    counts,
    topRiskShipments: topRisk
  });
});

/**
 * GET /api/shipments/:id
 * Detail view: shipment + signals + score + prediction + recommendation
 * Lazy Gemini recommendation generation and caching
 */
shipmentsRouter.get('/shipments/:id', async (req, res) => {
  const { id } = req.params;
  const shipment = shipments.get(id);

  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }

  const signals = signalsStore.get(id) || [];
  const score = scoresStore.get(id) || calculateRiskScore(shipment, signals);
  const prediction = slaStore.get(id) || predictSLABreach(score);

  // Lazy recommendation generation: check cache first, generate if missing
  let recommendation = recommendationsStore.get(id);
  if (!recommendation || recommendation.riskScoreId !== score.id) {
    recommendation = await generateRecommendation(shipment, score, signals);
    recommendationsStore.set(id, recommendation);
  }

  res.json({
    shipment,
    signals,
    score,
    prediction,
    recommendation
  });
});

/**
 * POST /api/shipments
 * Creates a new shipment and immediately runs signalGenerator → riskScoring → slaPrediction
 */
shipmentsRouter.post('/shipments', (req, res) => {
  const {
    referenceNumber,
    customerName,
    origin,
    destination,
    mode,
    status,
    committedETA,
    currentETA
  } = req.body;

  if (!referenceNumber || !customerName || !mode || !status || !committedETA || !currentETA) {
    return res.status(400).json({ error: 'Missing required shipment fields' });
  }

  const id = `shp-${Date.now()}`;
  const now = new Date().toISOString();

  // Normalize location objects
  const formatLoc = (loc, fallbackName) => {
    if (!loc) return { name: fallbackName, country: 'US', lat: 0, lng: 0 };
    if (typeof loc === 'string') return { name: loc, country: 'US', lat: 0, lng: 0 };
    return {
      name: loc.name || fallbackName,
      city: loc.city || '',
      country: loc.country || '',
      lat: typeof loc.lat === 'number' ? loc.lat : 0,
      lng: typeof loc.lng === 'number' ? loc.lng : 0
    };
  };

  const newShipment = {
    id,
    referenceNumber: referenceNumber.trim(),
    customerName: customerName.trim(),
    origin: formatLoc(origin, 'Origin'),
    destination: formatLoc(destination, 'Destination'),
    mode,
    status,
    committedETA,
    currentETA,
    createdAt: now,
    updatedAt: now
  };

  shipments.set(id, newShipment);

  // Immediately generate signals, risk score, and SLA prediction
  const signals = generateSignalsForShipment(newShipment);
  signalsStore.set(id, signals);

  const scoreResult = calculateRiskScore(newShipment, signals);
  scoresStore.set(id, scoreResult);

  const slaResult = predictSLABreach(scoreResult);
  slaStore.set(id, slaResult);

  res.status(201).json({
    shipment: newShipment,
    signals,
    score: scoreResult,
    prediction: slaResult
  });
});

/**
 * PUT /api/shipments/:id
 * Updates core shipment fields.
 * Design decision: updating a shipment does NOT automatically regenerate its signals/score/prediction —
 * this keeps the logic simple and predictable for the MVP. The existing score stays until/unless
 * a new shipment is created. This is a deliberate simplification, not an oversight.
 */
shipmentsRouter.put('/shipments/:id', (req, res) => {
  const { id } = req.params;
  const existing = shipments.get(id);

  if (!existing) {
    return res.status(404).json({ error: 'Shipment not found' });
  }

  const {
    referenceNumber,
    customerName,
    origin,
    destination,
    mode,
    status,
    committedETA,
    currentETA
  } = req.body;

  const formatLoc = (loc, fallback) => {
    if (!loc) return fallback;
    if (typeof loc === 'string') return { ...fallback, name: loc };
    return {
      name: loc.name || fallback.name,
      city: loc.city !== undefined ? loc.city : fallback.city,
      country: loc.country || fallback.country,
      lat: typeof loc.lat === 'number' ? loc.lat : fallback.lat,
      lng: typeof loc.lng === 'number' ? loc.lng : fallback.lng
    };
  };

  const updatedShipment = {
    ...existing,
    referenceNumber: referenceNumber !== undefined ? referenceNumber.trim() : existing.referenceNumber,
    customerName: customerName !== undefined ? customerName.trim() : existing.customerName,
    origin: origin ? formatLoc(origin, existing.origin) : existing.origin,
    destination: destination ? formatLoc(destination, existing.destination) : existing.destination,
    mode: mode || existing.mode,
    status: status || existing.status,
    committedETA: committedETA || existing.committedETA,
    currentETA: currentETA || existing.currentETA,
    updatedAt: new Date().toISOString()
  };

  shipments.set(id, updatedShipment);

  res.json({ shipment: updatedShipment });
});

/**
 * DELETE /api/shipments/:id
 * Removes shipment and its associated signals/score/prediction/recommendation
 */
shipmentsRouter.delete('/shipments/:id', (req, res) => {
  const { id } = req.params;
  if (!shipments.has(id)) {
    return res.status(404).json({ error: 'Shipment not found' });
  }

  shipments.delete(id);
  signalsStore.delete(id);
  scoresStore.delete(id);
  slaStore.delete(id);
  recommendationsStore.delete(id);

  res.json({ success: true, message: 'Shipment deleted' });
});
