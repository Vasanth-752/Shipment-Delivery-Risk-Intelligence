/**
 * Recommendation Engine — calls Gemini API server-side
 * Generates context-aware, actionable recommendations based on shipment and risk signals.
 * Includes graceful fallback if Gemini is unavailable or errors out.
 */

import { GoogleGenAI } from '@google/genai';

function getFallbackRecommendation(shipment, riskScoreResult, signals = []) {
  const score = riskScoreResult ? riskScoreResult.score : 1.0;
  let action = 'no_action';
  let text = 'Transit conditions normal. No operational intervention required at this time.';
  let impact = 'Maintains current schedule with expected zero SLA deviation.';

  if (score >= 9.0) {
    action = 'reroute';
    text = `Critical risk detected (${signals[0]?.description || 'Severe disruption en route'}). Immediate rerouting to secondary transit corridor recommended to bypass bottleneck and prevent complete SLA breach.`;
    impact = 'Saves estimated ~36-48 hours transit delay; potential expedited freight cost +$250.';
  } else if (score >= 7.0) {
    action = 'expedite';
    text = `High risk of SLA breach (${signals[0]?.description || 'Significant transit bottleneck'}). Recommend prioritizing terminal offload and booking priority feeder transport.`;
    impact = 'Mitigates estimated 18-24 hours delay; nominal expedite charge +$120.';
  } else if (score >= 4.0) {
    action = 'notify_customer';
    text = `Moderate risk identified (${signals[0]?.description || 'Minor weather/traffic slowdown'}). Alert customer service and recipient of possible 4-12 hour delay window.`;
    impact = 'Zero direct cost; preserves customer trust and enables proactive schedule adjustments.';
  }

  return {
    id: `rec-${shipment.id}-${Date.now()}`,
    shipmentId: shipment.id,
    riskScoreId: riskScoreResult.id,
    action,
    aiGeneratedText: text,
    estimatedImpact: impact,
    status: 'suggested',
    generatedAt: new Date().toISOString()
  };
}

export async function generateRecommendation(shipment, riskScoreResult, signals = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getFallbackRecommendation(shipment, riskScoreResult, signals);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const prompt = `You are an expert supply chain risk mitigation advisor.
Given the shipment and risk signals below, provide an operational action recommendation.

Shipment Details:
- Reference: ${shipment.referenceNumber}
- Customer: ${shipment.customerName}
- Mode: ${shipment.mode}
- Origin: ${shipment.origin?.name || 'Origin'}, ${shipment.origin?.country || ''}
- Destination: ${shipment.destination?.name || 'Destination'}, ${shipment.destination?.country || ''}
- Status: ${shipment.status}
- Committed ETA: ${shipment.committedETA}
- Current ETA: ${shipment.currentETA}
- Risk Score: ${riskScoreResult.score}/10 (${riskScoreResult.riskTier})

Active Risk Signals:
${signals.map(s => `- [${s.severity.toUpperCase()}] ${s.type}: ${s.description}`).join('\n') || 'None'}

Return ONLY a JSON object with this exact schema:
{
  "action": "reroute" | "expedite" | "hold" | "notify_customer" | "no_action",
  "aiGeneratedText": "Concise operational recommendation (1-2 sentences)",
  "estimatedImpact": "Short summary of time/cost impact, e.g. Saves ~12h delay, +$150 cost"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text ? response.text.trim() : '';
    if (!responseText) {
      return getFallbackRecommendation(shipment, riskScoreResult, signals);
    }

    const parsed = JSON.parse(responseText);
    const validActions = ['reroute', 'expedite', 'hold', 'notify_customer', 'no_action'];
    const action = validActions.includes(parsed.action) ? parsed.action : 'notify_customer';

    return {
      id: `rec-${shipment.id}-${Date.now()}`,
      shipmentId: shipment.id,
      riskScoreId: riskScoreResult.id,
      action,
      aiGeneratedText: parsed.aiGeneratedText || 'Proactive mitigation advised based on real-time signal analysis.',
      estimatedImpact: parsed.estimatedImpact || 'Mitigates potential delivery variance.',
      status: 'suggested',
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating AI recommendation with Gemini:', error);
    return getFallbackRecommendation(shipment, riskScoreResult, signals);
  }
}
