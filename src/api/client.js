/**
 * API client for communicating with the backend REST API
 */

const BASE_URL = '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // GET /api/dashboard/summary
  async getDashboardSummary() {
    return request('/api/dashboard/summary');
  },

  // GET /api/shipments?mode=&status=&riskTier=&search=&sortBy=&sortOrder=
  async getShipments(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.mode && params.mode !== 'all') searchParams.set('mode', params.mode);
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.riskTier && params.riskTier !== 'all') searchParams.set('riskTier', params.riskTier);
    if (params.search && params.search.trim()) searchParams.set('search', params.search.trim());
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const qs = searchParams.toString();
    return request(`/api/shipments${qs ? `?${qs}` : ''}`);
  },

  // GET /api/shipments/:id
  async getShipmentDetail(id) {
    return request(`/api/shipments/${encodeURIComponent(id)}`);
  },

  // POST /api/shipments/batch
  async importShipments(shipments, mode = 'append') {
    return request('/api/shipments/batch', {
      method: 'POST',
      body: JSON.stringify({ shipments, mode }),
    });
  },

  // POST /api/shipments/reset
  async resetShipments() {
    return request('/api/shipments/reset', {
      method: 'POST',
    });
  },

  // GET /api/shipments/sample-data
  async getSampleDataset() {
    return request('/api/shipments/sample-data');
  },
};
