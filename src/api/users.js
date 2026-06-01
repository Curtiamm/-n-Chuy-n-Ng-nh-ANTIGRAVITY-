const getToken = () => localStorage.getItem('heulwen_token');
const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const usersApi = {
  list: () => fetch('/api/users', { headers: authHeader() }).then(r => r.json()),
  updateRole: (id, role) => fetch(`/api/users/${id}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ role }),
  }).then(r => r.json()),
};
