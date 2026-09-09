/**
 * Standard Sample Dataset matching the exact user specification:
 * - id
 * - Reference ID (or referenceNumber)
 * - customerName
 * - origin
 * - destination
 * - mode
 * - committedETA
 */

export const SAMPLE_DATASET = [
  {
    id: 'SMP-001',
    'Reference ID': 'REF-OCN-8812',
    referenceNumber: 'REF-OCN-8812',
    customerName: 'Global Microelectronics Corp',
    origin: 'Port of Shanghai, China',
    destination: 'Port of Rotterdam, Netherlands',
    mode: 'ocean',
    committedETA: '2026-09-16T14:00:00.000Z',
    status: 'in_transit'
  },
  {
    id: 'SMP-002',
    'Reference ID': 'REF-AIR-3391',
    referenceNumber: 'REF-AIR-3391',
    customerName: 'BioHealth Laboratories',
    origin: 'Frankfurt Cargo City, Germany',
    destination: 'JFK Intl Airport, New York, USA',
    mode: 'air',
    committedETA: '2026-09-10T18:30:00.000Z',
    status: 'in_transit'
  },
  {
    id: 'SMP-003',
    'Reference ID': 'REF-TRK-7740',
    referenceNumber: 'REF-TRK-7740',
    customerName: 'Apex Automotive Parts',
    origin: 'Detroit Assembly Hub, MI, USA',
    destination: 'Monterrey Logistics Depot, Mexico',
    mode: 'truck',
    committedETA: '2026-09-11T08:00:00.000Z',
    status: 'delayed'
  },
  {
    id: 'SMP-004',
    'Reference ID': 'REF-RAIL-9015',
    referenceNumber: 'REF-RAIL-9015',
    customerName: 'Trans-Eurasia Chemical Ltd',
    origin: 'Chengdu Intermodal Hub, China',
    destination: 'Duisburg Freight Terminal, Germany',
    mode: 'rail',
    committedETA: '2026-09-22T12:00:00.000Z',
    status: 'in_transit'
  },
  {
    id: 'SMP-005',
    'Reference ID': 'REF-AIR-5520',
    referenceNumber: 'REF-AIR-5520',
    customerName: 'Zenith Solar Technologies',
    origin: 'Incheon International, South Korea',
    destination: 'O\'Hare Intl, Chicago, USA',
    mode: 'air',
    committedETA: '2026-09-12T16:00:00.000Z',
    status: 'delayed'
  },
  {
    id: 'SMP-006',
    'Reference ID': 'REF-TRK-4419',
    referenceNumber: 'REF-TRK-4419',
    customerName: 'Pacific Cold Chain Dist.',
    origin: 'Salinas Valley, CA, USA',
    destination: 'Vancouver Terminal, Canada',
    mode: 'truck',
    committedETA: '2026-09-10T22:00:00.000Z',
    status: 'in_transit'
  },
  {
    id: 'SMP-007',
    'Reference ID': 'REF-OCN-1104',
    referenceNumber: 'REF-OCN-1104',
    customerName: 'Nordic Timber & Paper',
    origin: 'Tanjung Pelepas, Malaysia',
    destination: 'Port of Long Beach, CA, USA',
    mode: 'ocean',
    committedETA: '2026-09-18T10:00:00.000Z',
    status: 'in_transit'
  },
  {
    id: 'SMP-008',
    'Reference ID': 'REF-TRK-6632',
    referenceNumber: 'REF-TRK-6632',
    customerName: 'Summit Medical Devices',
    origin: 'Minneapolis Depot, MN, USA',
    destination: 'Denver Regional Hub, CO, USA',
    mode: 'truck',
    committedETA: '2026-09-09T23:00:00.000Z',
    status: 'in_transit'
  }
];

export const SAMPLE_CSV = `id,Reference ID,customerName,origin,destination,mode,committedETA
SMP-001,REF-OCN-8812,Global Microelectronics Corp,"Port of Shanghai, China","Port of Rotterdam, Netherlands",ocean,2026-09-16T14:00:00.000Z
SMP-002,REF-AIR-3391,BioHealth Laboratories,"Frankfurt Cargo City, Germany","JFK Intl Airport, New York, USA",air,2026-09-10T18:30:00.000Z
SMP-003,REF-TRK-7740,Apex Automotive Parts,"Detroit Assembly Hub, MI, USA","Monterrey Logistics Depot, Mexico",truck,2026-09-11T08:00:00.000Z
SMP-004,REF-RAIL-9015,Trans-Eurasia Chemical Ltd,"Chengdu Intermodal Hub, China","Duisburg Freight Terminal, Germany",rail,2026-09-22T12:00:00.000Z
SMP-005,REF-AIR-5520,Zenith Solar Technologies,"Incheon International, South Korea","O'Hare Intl, Chicago, USA",air,2026-09-12T16:00:00.000Z
SMP-006,REF-TRK-4419,Pacific Cold Chain Dist.,"Salinas Valley, CA, USA","Vancouver Terminal, Canada",truck,2026-09-10T22:00:00.000Z
SMP-007,REF-OCN-1104,Nordic Timber & Paper,"Tanjung Pelepas, Malaysia","Port of Long Beach, CA, USA",ocean,2026-09-18T10:00:00.000Z
SMP-008,REF-TRK-6632,Summit Medical Devices,"Minneapolis Depot, MN, USA","Denver Regional Hub, CO, USA",truck,2026-09-09T23:00:00.000Z`;
