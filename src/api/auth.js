export const authApi = {
  loginWithGoogle: (idToken) => fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  }).then(r => r.json()),

  me: () => {
    const token = localStorage.getItem('heulwen_token');
    return fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json());
  },
};
