/**
 * SLA Breach Prediction Engine
 * (riskScoreResult) → SLABreachPrediction
 * Estimates breach probability (0–1) and estimated delay in hours.
 */

export function predictSLABreach(riskScoreResult) {
  const score = riskScoreResult.score || 1.0;

  let breachProbability = 0.05;
  let estimatedDelayHours = 0;

  if (score >= 9.0) {
    // Critical risk: 85% – 98% probability, 48–96 hours delay
    breachProbability = 0.85 + ((score - 9.0) / 1.0) * 0.13;
    estimatedDelayHours = Math.round(48 + ((score - 9.0) / 1.0) * 48);
  } else if (score >= 7.0) {
    // High risk: 65% – 84% probability, 18–44 hours delay
    breachProbability = 0.65 + ((score - 7.0) / 2.0) * 0.19;
    estimatedDelayHours = Math.round(18 + ((score - 7.0) / 2.0) * 26);
  } else if (score >= 4.0) {
    // Medium risk: 30% – 60% probability, 4–16 hours delay
    breachProbability = 0.30 + ((score - 4.0) / 3.0) * 0.30;
    estimatedDelayHours = Math.round(4 + ((score - 4.0) / 3.0) * 12);
  } else {
    // Low risk: 5% – 25% probability, 0–3 hours delay
    breachProbability = 0.05 + ((score - 1.0) / 3.0) * 0.20;
    estimatedDelayHours = Math.round(((score - 1.0) / 3.0) * 3);
  }

  return {
    id: `sla-${riskScoreResult.shipmentId}-${Date.now()}`,
    shipmentId: riskScoreResult.shipmentId,
    riskScoreId: riskScoreResult.id,
    breachProbability: parseFloat(breachProbability.toFixed(2)),
    estimatedDelayHours,
    predictedAt: new Date().toISOString()
  };
}
