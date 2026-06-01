// Wrapper fetch đến Backend Python, tự động gắn Authorization header cho write requests.

const getToken = () => localStorage.getItem('heulwen_token');

class APITable {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async list() {
    const response = await fetch(this.endpoint);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  }

  async filter(predicateObj) {
    const params = new URLSearchParams(predicateObj).toString();
    const response = await fetch(`${this.endpoint}?${params}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  }

  async create(item) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  }

  async update(id, updates) {
    const response = await fetch(`${this.endpoint}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  }

  async delete(id) {
    const response = await fetch(`${this.endpoint}/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return true;
  }
}

function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const localDB = {
  Major: new APITable('/api/majors'),
  FAQ: new APITable('/api/faqs'),
  AdmissionInfo: new APITable('/api/admission'),
  ChatSession: new APITable('/api/chats'),
};
