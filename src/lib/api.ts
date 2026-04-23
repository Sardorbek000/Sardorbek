// Replaces firebase.ts

let token = localStorage.getItem('token') || '';

export const setToken = (newToken: string) => {
  token = newToken;
  if (newToken) {
    localStorage.setItem('token', newToken);
  } else {
    localStorage.removeItem('token');
  }
};

export const getToken = () => token;

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let msg = 'API Error';
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch(e) {}
    throw new Error(msg);
  }
  return res.json();
};
