import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the access token to every request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

// Only one refresh may be in flight; everything else queues behind it.
let refreshing = null;

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('no refresh token');

  // Bare axios (not `api`) so this call can't recurse through this interceptor.
  const res = await axios.post('/api/auth/refresh', { refreshToken });
  const { token, refreshToken: rotated } = res.data.data;
  localStorage.setItem('token', token);
  if (rotated) localStorage.setItem('refreshToken', rotated);
  return token;
};

/**
 * The access token lives ~15 minutes. When it dies the API answers 401/403, so
 * transparently swap in a fresh token using the 7-day refresh token and replay
 * the original request. Only if that fails do we send the user to /login.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    const status = response?.status;
    const isAuthCall = config?.url?.includes('/auth/login')
      || config?.url?.includes('/auth/register')
      || config?.url?.includes('/auth/refresh');

    if ((status === 401 || status === 403) && !isAuthCall && !config?._retried) {
      config._retried = true;
      try {
        refreshing = refreshing || refreshAccessToken().finally(() => { refreshing = null; });
        const token = await refreshing;
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
        return api(config); // replay the original request
      } catch {
        clearSession();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?session_expired=true';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
