/**
 * SLA Breach Prediction Engine
 * (riskScoreResult, shipment) → SLABreachPrediction
 * Estimates breach probability (0–1), estimated delay in hours, human-readable SLA breach status, and newly estimated ETA.
 */

export function predictSLABreach(riskScoreResult, shipment = null) {
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

  // Adjust if shipment is already flagged as breached or delayed
  if (shipment) {
    if (shipment.status === 'breached') {
      breachProbability = Math.max(breachProbability, 0.98);
      estimatedDelayHours = Math.max(estimatedDelayHours, 72);
    } else if (shipment.status === 'delayed') {
      breachProbability = Math.max(breachProbability, 0.75);
      estimatedDelayHours = Math.max(estimatedDelayHours, 24);
    }
  }

  const finalBreachProb = parseFloat(Math.min(1.0, Math.max(0.01, breachProbability)).toFixed(2));

  // Determine categorical SLA breach status
  let slaBreachStatus = 'On Schedule';
  if (shipment?.status === 'breached' || finalBreachProb >= 0.88) {
    slaBreachStatus = 'Critical Breach Imminent';
  } else if (finalBreachProb >= 0.65) {
    slaBreachStatus = 'High Risk of Breach';
  } else if (finalBreachProb >= 0.35) {
    slaBreachStatus = 'Moderate SLA Risk';
  } else {
    slaBreachStatus = 'On Schedule';
  }

  // Calculate newly estimated ETA
  let newlyEstimatedETA = null;
  const baseTimeStr = shipment?.committedETA || shipment?.currentETA;
  if (baseTimeStr) {
    try {
      const baseTime = new Date(baseTimeStr).getTime();
      if (!isNaN(baseTime)) {
        newlyEstimatedETA = new Date(baseTime + estimatedDelayHours * 3600 * 1000).toISOString();
      }
    } catch {
      newlyEstimatedETA = null;
    }
  }

  return {
    id: `sla-${riskScoreResult.shipmentId || 'item'}-${Date.now()}`,
    shipmentId: riskScoreResult.shipmentId,
    riskScoreId: riskScoreResult.id,
    breachProbability: finalBreachProb,
    estimatedDelayHours,
    slaBreachStatus,
    newlyEstimatedETA,
    predictedAt: new Date().toISOString()
  };
}

