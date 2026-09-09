/**
 * Risk Scoring Engine — deterministic weighted formula (1–10)
 * (shipment, signals) → RiskScoreResult
 * Explains contribution signal by signal.
 */

const SEVERITY_BASE_SCORES = {
  low: 2.0,
  moderate: 5.0,
  high: 7.8,
  severe: 10.0
};

const SIGNAL_WEIGHTS = {
  weather: 0.25,
  traffic: 0.20,
  port_congestion: 0.25,
  flight_status: 0.20,
  geopolitical: 0.15,
  news: 0.10
};

export function calculateRiskScore(shipment, signals = []) {
  if (!signals || signals.length === 0) {
    return {
      id: `score-${shipment.id}-${Date.now()}`,
      shipmentId: shipment.id,
      score: 1.0,
      riskTier: 'low',
      contributingSignals: [],
      calculatedAt: new Date().toISOString()
    };
  }

  // Calculate normalized weights based on present signals
  let totalRawWeight = 0;
  const signalDetails = signals.map(sig => {
    const baseWeight = SIGNAL_WEIGHTS[sig.type] || 0.15;
    const severityScore = SEVERITY_BASE_SCORES[sig.severity] || 3.0;
    const confidence = typeof sig.confidence === 'number' ? sig.confidence : 0.8;
    const rawWeighted = severityScore * baseWeight * confidence;
    totalRawWeight += baseWeight;
    return {
      signalId: sig.id,
      signalType: sig.type,
      baseWeight,
      severityScore,
      confidence,
      rawWeighted
    };
  });

  // Calculate weighted average score
  let rawScore = 1.0;
  if (totalRawWeight > 0) {
    const weightedSum = signalDetails.reduce((sum, item) => sum + (item.severityScore * item.baseWeight * item.confidence), 0);
    rawScore = weightedSum / totalRawWeight;
  }

  // Adjust for shipment current status if already delayed or breached
  if (shipment.status === 'delayed') {
    rawScore = Math.max(rawScore, 7.2);
  } else if (shipment.status === 'breached') {
    rawScore = Math.max(rawScore, 9.4);
  }

  // Clamp score to 1.0 - 10.0
  const finalScore = Math.min(10.0, Math.max(1.0, parseFloat(rawScore.toFixed(1))));

  // Derive risk tier
  let riskTier = 'low';
  if (finalScore >= 9.0) {
    riskTier = 'critical';
  } else if (finalScore >= 7.0) {
    riskTier = 'high';
  } else if (finalScore >= 4.0) {
    riskTier = 'medium';
  }

  // Calculate breakdown: each signal's contributionScore such that they sum to finalScore
  const totalItemScores = signalDetails.reduce((sum, s) => sum + s.rawWeighted, 0) || 1;
  const contributingSignals = signalDetails.map(s => {
    const fraction = s.rawWeighted / totalItemScores;
    const contributionScore = parseFloat((finalScore * fraction).toFixed(2));
    return {
      signalId: s.signalId,
      signalType: s.signalType,
      weight: parseFloat((s.baseWeight / (totalRawWeight || 1)).toFixed(2)),
      contributionScore
    };
  });

  return {
    id: `score-${shipment.id}-${Date.now()}`,
    shipmentId: shipment.id,
    score: finalScore,
    riskTier,
    contributingSignals,
    calculatedAt: new Date().toISOString()
  };
}
