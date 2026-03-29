// sessionToken.js
// Helper to store access_token per-window using optional `session` URL param

export const getSessionSuffix = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('session');
    if (!s) return '';
    // only allow safe chars
    const safe = s.replace(/[^a-zA-Z0-9_-]/g, '');
    return safe ? `__${safe}` : '';
  } catch (e) {
    return '';
  }
};

export const getAccessTokenKey = () => `access_token${getSessionSuffix()}`;
export const getRefreshTokenKey = () => `refresh_token${getSessionSuffix()}`;

export const getAccessToken = () => {
  const key = getAccessTokenKey();
  const raw = sessionStorage.getItem(key) || sessionStorage.getItem('access_token');
  if (!raw) return null;
  try {
    if (typeof raw === 'string' && raw.startsWith('"')) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return raw;
};

export const setAccessToken = (token) => {
  const key = getAccessTokenKey();
  // store as JSON string to be consistent with previous behavior
  try {
    sessionStorage.setItem(key, JSON.stringify(token));
  } catch (e) {
    console.warn('setAccessToken failed', e);
  }
};

export const removeAccessToken = () => {
  const key = getAccessTokenKey();
  sessionStorage.removeItem(key);
  // also remove default key for compatibility
  sessionStorage.removeItem('access_token');
  try {
    localStorage.removeItem('walkzy_chat_conversations');
    localStorage.removeItem('walkzy_chat_conversation');
  } catch (e) {
    // ignore storage errors
  }
};

// Refresh token helpers - stored per-session similar to access token
export const getRefreshToken = () => {
  const key = getRefreshTokenKey();
  const raw = sessionStorage.getItem(key) || sessionStorage.getItem('refresh_token');
  if (!raw) return null;
  return raw;
};

export const setRefreshToken = (token) => {
  const key = getRefreshTokenKey();
  try {
    sessionStorage.setItem(key, token);
  } catch (e) {
    console.warn('setRefreshToken failed', e);
  }
};

export const removeRefreshToken = () => {
  const key = getRefreshTokenKey();
  sessionStorage.removeItem(key);
  sessionStorage.removeItem('refresh_token');
};

export default { getAccessToken, setAccessToken, removeAccessToken };
