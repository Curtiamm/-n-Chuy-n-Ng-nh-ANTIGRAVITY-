const getToken = () => localStorage.getItem('heulwen_token');
const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const faqsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`/api/faqs${q ? `?${q}` : ''}`).then(r => r.json());
  },
  create: (data) => fetch('/api/faqs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data),
  }).then(r => r.json()),
  update: (id, data) => fetch(`/api/faqs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data),
  }).then(r => r.json()),
  delete: (id) => fetch(`/api/faqs/${id}`, {
    method: 'DELETE', headers: authHeader(),
  }).then(r => r.json()),
};
