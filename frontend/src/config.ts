// All API requests go through nginx, which proxies /api/* and /ws/* to the backend.
// This avoids needing to trust a second self-signed certificate on port 4000.

export const getBackendUrl = () => '/api';

export const getWebSocketUrl = (path: string) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}; 