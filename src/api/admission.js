const getToken = () => localStorage.getItem('heulwen_token');
const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const admissionApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`/api/admission${q ? `?${q}` : ''}`).then(r => r.json());
  },
  create: (data) => fetch('/api/admission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data),
  }).then(r => r.json()),
  update: (id, data) => fetch(`/api/admission/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data),
  }).then(r => r.json()),
  delete: (id) => fetch(`/api/admission/${id}`, {
    method: 'DELETE', headers: authHeader(),
  }).then(r => r.json()),
};
