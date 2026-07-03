const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Camps
  getCamps: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/camps${query ? `?${query}` : ''}`);
  },
  getCamp: (id) => request(`/camps/${id}`),
  getCities: () => request('/camps/cities'),
  getSpecialties: () => request('/camps/specialties'),
  aiSearch: (q) => request(`/camps/ai/search?q=${encodeURIComponent(q)}`),
  getRecommendations: () => request('/camps/ai/recommendations'),

  // Bookings
  getSlots: (campId, date) => request(`/bookings/slots/${campId}${date ? `?date=${date}` : ''}`),
  createBooking: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getMyBookings: () => request('/bookings/my'),
  cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: 'PUT' }),

  // Schemes
  getSchemes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/schemes${query ? `?${query}` : ''}`);
  },
  getScheme: (id) => request(`/schemes/${id}`),
  getSchemeCategories: () => request('/schemes/categories'),

  // Notifications
  getNotifications: () => request('/notifications'),
  getUnreadCount: () => request('/notifications/unread-count'),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAdminCamps: () => request('/admin/camps'),
  createCamp: (data) => request('/admin/camps', { method: 'POST', body: JSON.stringify(data) }),
  updateCamp: (id, data) => request(`/admin/camps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCamp: (id) => request(`/admin/camps/${id}`, { method: 'DELETE' }),
  getAdminBookings: () => request('/admin/bookings'),
};
