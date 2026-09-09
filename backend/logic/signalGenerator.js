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
  const mode = shipment.mode || 'truck';
  const templates = SIGNAL_TEMPLATES[mode] || SIGNAL_TEMPLATES.truck;
  
  // Deterministic or pseudo-random selection based on shipment reference or status
  const isHighRiskCandidate = shipment.status === 'delayed' || shipment.status === 'breached' || 
    (shipment.referenceNumber && (shipment.referenceNumber.charCodeAt(shipment.referenceNumber.length - 1) % 2 === 0));

  const signals = [];
  const now = new Date();
  
  if (isHighRiskCandidate) {
    // Pick 2-3 severe/high/moderate signals
    const count = 2 + (shipment.referenceNumber ? shipment.referenceNumber.length % 2 : 0);
    for (let i = 0; i < count; i++) {
      const tmpl = templates[i % templates.length];
      signals.push({
        id: `sig-${shipment.id || 'tmp'}-${i + 1}`,
        shipmentId: shipment.id,
        type: tmpl.type,
        source: 'mock',
        severity: tmpl.severity,
        confidence: tmpl.confidence,
        description: tmpl.description,
        affectedRegion: shipment.destination,
        isSimulated: false,
        detectedAt: new Date(now.getTime() - (i + 1) * 3600000).toISOString(),
        expiresAt: new Date(now.getTime() + 48 * 3600000).toISOString()
      });
    }
  } else {
    // Pick 1 mild/low signal or 1 moderate signal
    const tmpl = MILD_SIGNALS[Math.floor(Math.random() * MILD_SIGNALS.length)];
    signals.push({
      id: `sig-${shipment.id || 'tmp'}-1`,
      shipmentId: shipment.id,
      type: tmpl.type,
      source: 'mock',
      severity: tmpl.severity,
      confidence: tmpl.confidence,
      description: tmpl.description,
      affectedRegion: shipment.origin,
      isSimulated: false,
      detectedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      expiresAt: new Date(now.getTime() + 24 * 3600000).toISOString()
    });
  }

  return signals;
}
