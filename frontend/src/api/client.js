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

  // POST /api/shipments
  async createShipment(shipmentData) {
    return request('/api/shipments', {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });
  },

  // PUT /api/shipments/:id
  async updateShipment(id, shipmentData) {
    return request(`/api/shipments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(shipmentData),
    });
  },

  // DELETE /api/shipments/:id
  async deleteShipment(id) {
    return request(`/api/shipments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
