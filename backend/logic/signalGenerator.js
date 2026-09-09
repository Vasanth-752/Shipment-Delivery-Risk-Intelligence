/**
 * Signal Generator — creates simulated RiskSignal[] for a shipment
 * Signals represent external factors: weather, traffic, port congestion, flight status, geopolitical, news
 */

const SIGNAL_TEMPLATES = {
  ocean: [
    {
      type: 'port_congestion',
      severity: 'high',
      confidence: 0.88,
      description: 'Berth wait time exceeded 72 hours due to container yard backlog at destination terminal.'
    },
    {
      type: 'weather',
      severity: 'severe',
      confidence: 0.92,
      description: 'Tropical cyclone warning issued along northern shipping lane, gale-force winds and 8m swells.'
    },
    {
      type: 'geopolitical',
      severity: 'moderate',
      confidence: 0.78,
      description: 'Heightened customs inspection protocol instituted following revised maritime security alert.'
    }
  ],
  air: [
    {
      type: 'flight_status',
      severity: 'high',
      confidence: 0.95,
      description: 'Connecting cargo freighter flight canceled due to mechanical maintenance; rebooking pending.'
    },
    {
      type: 'weather',
      severity: 'moderate',
      confidence: 0.85,
      description: 'Dense fog and freezing drizzle causing ground stop and air traffic delays at transfer hub.'
    },
    {
      type: 'traffic',
      severity: 'low',
      confidence: 0.7,
      description: 'Minor apron congestion reported at cargo transit terminal.'
    }
  ],
  truck: [
    {
      type: 'weather',
      severity: 'high',
      confidence: 0.9,
      description: 'Severe winter blizzard closed mountain pass along primary interstate corridor.'
    },
    {
      type: 'traffic',
      severity: 'severe',
      confidence: 0.94,
      description: 'Major multi-vehicle accident and fuel spill causing complete highway closure and 15-mile backup.'
    },
    {
      type: 'news',
      severity: 'moderate',
      confidence: 0.82,
      description: 'Regional toll road union staging 24-hour slowdown at state border weigh stations.'
    }
  ],
  rail: [
    {
      type: 'traffic',
      severity: 'high',
      confidence: 0.87,
      description: 'Track maintenance and switch failure along main freight trunk line slowing operations.'
    },
    {
      type: 'weather',
      severity: 'moderate',
      confidence: 0.8,
      description: 'Heavy rainfall and flash flood alert triggering mandatory speed restrictions on valley track.'
    },
    {
      type: 'geopolitical',
      severity: 'low',
      confidence: 0.65,
      description: 'Border cargo manifest audit resulting in extended yard hold.'
    }
  ]
};

const MILD_SIGNALS = [
  {
    type: 'weather',
    severity: 'low',
    confidence: 0.9,
    description: 'Clear weather conditions forecast along the entire transit route.'
  },
  {
    type: 'traffic',
    severity: 'low',
    confidence: 0.85,
    description: 'Normal traffic flow observed with no reported incidents or bottlenecks.'
  }
];

export function generateSignalsForShipment(shipment) {
  const mode = String(shipment.mode || 'truck').toLowerCase();
  const templates = SIGNAL_TEMPLATES[mode] || SIGNAL_TEMPLATES.truck;
  
  // Deterministic seed based on shipment ID, referenceNumber, and customerName
  const seedString = `${shipment.id || ''}-${shipment.referenceNumber || ''}-${shipment.customerName || ''}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = ((hash << 5) - hash) + seedString.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const positiveHash = Math.abs(hash);

  const signals = [];
  const now = new Date();
  const destinationObj = typeof shipment.destination === 'object' ? shipment.destination : { name: shipment.destination || 'Destination' };
  const originObj = typeof shipment.origin === 'object' ? shipment.origin : { name: shipment.origin || 'Origin' };

  // Check if shipment explicitly has custom disruption or signal notes
  if (shipment.disruption || shipment.signalNotes) {
    const customText = String(shipment.disruption || shipment.signalNotes);
    signals.push({
      id: `sig-${shipment.id || 'tmp'}-custom`,
      shipmentId: shipment.id,
      type: mode === 'ocean' ? 'port_congestion' : mode === 'air' ? 'flight_status' : 'traffic',
      source: 'dataset_annotation',
      severity: shipment.status === 'breached' || positiveHash % 2 === 0 ? 'severe' : 'high',
      confidence: 0.94,
      description: customText,
      affectedRegion: destinationObj,
      isSimulated: false,
      detectedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      expiresAt: new Date(now.getTime() + 48 * 3600000).toISOString()
    });
  }

  // Force critical/high if status is explicitly delayed or breached
  const isBreached = shipment.status === 'breached';
  const isDelayed = shipment.status === 'delayed';

  // Determine risk category from hash: 0 = critical, 1 = high, 2 = medium, 3 = low
  const riskTierBucket = isBreached ? 0 : isDelayed ? 1 : (positiveHash % 4);

  if (riskTierBucket === 0) {
    // Critical risk: 3 severe / high signals
    const count = 3;
    for (let i = 0; i < count; i++) {
      const tmpl = templates[i % templates.length];
      signals.push({
        id: `sig-${shipment.id || 'tmp'}-${i + 1}`,
        shipmentId: shipment.id,
        type: tmpl.type,
        source: 'multimodal_sensor',
        severity: i === 0 ? 'severe' : tmpl.severity,
        confidence: Math.max(0.88, tmpl.confidence),
        description: tmpl.description,
        affectedRegion: destinationObj,
        isSimulated: false,
        detectedAt: new Date(now.getTime() - (i + 1) * 3600000).toISOString(),
        expiresAt: new Date(now.getTime() + 48 * 3600000).toISOString()
      });
    }
  } else if (riskTierBucket === 1) {
    // High risk: 2 signals (high + moderate)
    for (let i = 0; i < 2; i++) {
      const tmpl = templates[i % templates.length];
      signals.push({
        id: `sig-${shipment.id || 'tmp'}-${i + 1}`,
        shipmentId: shipment.id,
        type: tmpl.type,
        source: 'multimodal_sensor',
        severity: i === 0 ? 'high' : 'moderate',
        confidence: tmpl.confidence,
        description: tmpl.description,
        affectedRegion: destinationObj,
        isSimulated: false,
        detectedAt: new Date(now.getTime() - (i + 1) * 3600000).toISOString(),
        expiresAt: new Date(now.getTime() + 36 * 3600000).toISOString()
      });
    }
  } else if (riskTierBucket === 2) {
    // Medium risk: 1 moderate signal
    const tmpl = templates[1 % templates.length];
    signals.push({
      id: `sig-${shipment.id || 'tmp'}-1`,
      shipmentId: shipment.id,
      type: tmpl.type,
      source: 'telemetry_feed',
      severity: 'moderate',
      confidence: 0.82,
      description: tmpl.description,
      affectedRegion: originObj,
      isSimulated: false,
      detectedAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
      expiresAt: new Date(now.getTime() + 24 * 3600000).toISOString()
    });
  } else {
    // Low risk: 1 mild signal
    const tmpl = MILD_SIGNALS[positiveHash % MILD_SIGNALS.length];
    signals.push({
      id: `sig-${shipment.id || 'tmp'}-1`,
      shipmentId: shipment.id,
      type: tmpl.type,
      source: 'telemetry_feed',
      severity: 'low',
      confidence: 0.92,
      description: tmpl.description,
      affectedRegion: originObj,
      isSimulated: false,
      detectedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      expiresAt: new Date(now.getTime() + 24 * 3600000).toISOString()
    });
  }

  return signals;
}
