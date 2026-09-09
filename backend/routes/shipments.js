import express from 'express';
import { INITIAL_SHIPMENTS } from '../data/seedData.js';
import { SAMPLE_DATASET, SAMPLE_CSV } from '../data/sampleDataset.js';
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

// Helper to normalize flexible user-provided dataset entries
function normalizeShipmentInput(raw, index = 0) {
  const id = String(raw.id || raw.ID || `shp-dyn-${Date.now()}-${index + 1}`).trim();
  const referenceNumber = String(
    raw.referenceNumber || raw['Reference ID'] || raw.referenceId || raw['ReferenceID'] || raw.refId || `REF-${Math.floor(1000 + Math.random() * 9000)}`
  ).trim();
  const customerName = String(
    raw.customerName || raw['Customer Name'] || raw.customer || 'Enterprise Client'
  ).trim();

  // Parse origin
  let origin = raw.origin;
  if (typeof origin === 'string') {
    const parts = origin.split(',').map(p => p.trim());
    origin = {
      name: origin,
      city: parts[0] || origin,
      country: parts[parts.length - 1] || 'Global'
    };
  } else if (!origin || typeof origin !== 'object') {
    origin = { name: 'Origin Port', city: 'Origin Hub', country: 'Global' };
  }

  // Parse destination
  let destination = raw.destination;
  if (typeof destination === 'string') {
    const parts = destination.split(',').map(p => p.trim());
    destination = {
      name: destination,
      city: parts[0] || destination,
      country: parts[parts.length - 1] || 'Global'
    };
  } else if (!destination || typeof destination !== 'object') {
    destination = { name: 'Destination Hub', city: 'Destination Port', country: 'Global' };
  }

  // Parse mode: ocean, air, truck, rail
  let mode = String(raw.mode || 'truck').toLowerCase().trim();
  if (!['ocean', 'air', 'truck', 'rail'].includes(mode)) {
    mode = 'truck';
  }

  // Parse committedETA
  let committedETA = raw.committedETA || raw['Committed ETA'] || raw.committed_eta;
  if (!committedETA || isNaN(new Date(committedETA).getTime())) {
    committedETA = new Date(Date.now() + (48 + (index % 4) * 24) * 3600000).toISOString();
  } else {
    committedETA = new Date(committedETA).toISOString();
  }

  const status = raw.status && ['in_transit', 'delayed', 'breached', 'delivered', 'pending'].includes(raw.status.toLowerCase())
    ? raw.status.toLowerCase()
    : 'in_transit';

  const currentETA = raw.currentETA || committedETA;

  return {
    id,
    referenceNumber,
    'Reference ID': referenceNumber,
    customerName,
    origin,
    destination,
    mode,
    status,
    committedETA,
    currentETA,
    disruption: raw.disruption || raw.disruptions || raw.signalNotes || undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Initialize seed data at server startup
function initializeSeedData() {
  shipments.clear();
  signalsStore.clear();
  scoresStore.clear();
  slaStore.clear();
  recommendationsStore.clear();

  for (const item of INITIAL_SHIPMENTS) {
    shipments.set(item.id, item);
    const signals = generateSignalsForShipment(item);
    signalsStore.set(item.id, signals);
    const scoreResult = calculateRiskScore(item, signals);
    scoresStore.set(item.id, scoreResult);
    const slaResult = predictSLABreach(scoreResult, item);
    slaStore.set(item.id, slaResult);
  }
}

initializeSeedData();

/**
 * GET /api/shipments/sample-data
 * Returns the ready-to-use sample dataset in JSON and CSV format
 */
shipmentsRouter.get('/shipments/sample-data', (req, res) => {
  res.json({
    dataset: SAMPLE_DATASET,
    csv: SAMPLE_CSV,
    totalRecords: SAMPLE_DATASET.length
  });
});

/**
 * POST /api/shipments/reset
 * Resets back to initial sample seed shipments
 */
shipmentsRouter.post('/shipments/reset', (req, res) => {
  initializeSeedData();
  res.json({
    success: true,
    message: 'Shipment registry reset to initial baseline dataset',
    totalManagedCount: shipments.size
  });
});

/**
 * POST /api/shipments/batch
 * Dynamically import dataset, calculate risk score, SLA breach status, newly estimated delay, and AI recommendation
 */
shipmentsRouter.post('/shipments/batch', async (req, res) => {
  try {
    const rawItems = Array.isArray(req.body) ? req.body : req.body.shipments;
    const importMode = req.body.mode || 'append'; // 'append' | 'replace'

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({
        error: 'Payload must contain a non-empty array of shipment records under "shipments" or direct body array.'
      });
    }

    if (importMode === 'replace') {
      shipments.clear();
      signalsStore.clear();
      scoresStore.clear();
      slaStore.clear();
      recommendationsStore.clear();
    }

    const evaluatedResults = [];

    for (let i = 0; i < rawItems.length; i++) {
      const normalized = normalizeShipmentInput(rawItems[i], i);
      shipments.set(normalized.id, normalized);

      const signals = generateSignalsForShipment(normalized);
      signalsStore.set(normalized.id, signals);

      const scoreResult = calculateRiskScore(normalized, signals);
      scoresStore.set(normalized.id, scoreResult);

      const slaResult = predictSLABreach(scoreResult, normalized);
      slaStore.set(normalized.id, slaResult);

      // Generate AI recommendation
      const recommendation = await generateRecommendation(normalized, scoreResult, signals);
      recommendationsStore.set(normalized.id, recommendation);

      evaluatedResults.push({
        ...normalized,
        riskScore: scoreResult.score,
        riskTier: scoreResult.riskTier,
        breachProbability: slaResult.breachProbability,
        estimatedDelayHours: slaResult.estimatedDelayHours,
        slaBreachStatus: slaResult.slaBreachStatus,
        newlyEstimatedETA: slaResult.newlyEstimatedETA,
        recommendation: {
          action: recommendation.action,
          aiGeneratedText: recommendation.aiGeneratedText,
          estimatedImpact: recommendation.estimatedImpact
        },
        signalsCount: signals.length
      });
    }

    res.json({
      success: true,
      message: `Successfully evaluated and imported ${evaluatedResults.length} dynamic shipment(s).`,
      importedCount: evaluatedResults.length,
      totalManagedCount: shipments.size,
      items: evaluatedResults
    });
  } catch (error) {
    console.error('Error importing shipment dataset:', error);
    res.status(500).json({ error: error.message || 'Failed to process and calculate dataset' });
  }
});

/**
 * GET /api/shipments
 * List shipments with filtering (mode, status, riskTier, search) and sorting
 */
shipmentsRouter.get('/shipments', (req, res) => {
  const { mode, status, riskTier, search, sortBy, sortOrder } = req.query;

  let list = Array.from(shipments.values()).map(shipment => {
    const score = scoresStore.get(shipment.id);
    const sla = slaStore.get(shipment.id);
    const rec = recommendationsStore.get(shipment.id);
    return {
      ...shipment,
      riskScore: score ? score.score : 1.0,
      riskTier: score ? score.riskTier : 'low',
      estimatedDelayHours: sla ? sla.estimatedDelayHours : 0,
      breachProbability: sla ? sla.breachProbability : 0,
      slaBreachStatus: sla ? sla.slaBreachStatus : 'On Schedule',
      newlyEstimatedETA: sla ? sla.newlyEstimatedETA : shipment.currentETA || shipment.committedETA,
      recommendationAction: rec?.action || null
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
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.id && s.id.toLowerCase().includes(q))
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
    list.sort((a, b) => (new Date(a.currentETA).getTime() - new Date(b.currentETA).getTime()) * order);
  } else if (sortBy === 'estimatedDelayHours') {
    list.sort((a, b) => (a.estimatedDelayHours - b.estimatedDelayHours) * order);
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
      breachProbability: sla ? sla.breachProbability : 0,
      slaBreachStatus: sla ? sla.slaBreachStatus : 'On Schedule',
      newlyEstimatedETA: sla ? sla.newlyEstimatedETA : shipment.currentETA || shipment.committedETA
    };
  });

  const counts = {
    total: allShipments.length,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };

  const slaCounts = {
    onSchedule: 0,
    moderateRisk: 0,
    highRisk: 0,
    criticalBreach: 0
  };

  for (const s of allShipments) {
    if (counts[s.riskTier] !== undefined) {
      counts[s.riskTier]++;
    }
    if (s.slaBreachStatus === 'Critical Breach Imminent') {
      slaCounts.criticalBreach++;
    } else if (s.slaBreachStatus === 'High Risk of Breach') {
      slaCounts.highRisk++;
    } else if (s.slaBreachStatus === 'Moderate SLA Risk') {
      slaCounts.moderateRisk++;
    } else {
      slaCounts.onSchedule++;
    }
  }

  // Top risk shipments (sorted descending by risk score, top 5)
  const topRisk = [...allShipments]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  res.json({
    counts,
    slaCounts,
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
  const prediction = slaStore.get(id) || predictSLABreach(score, shipment);

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


