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

