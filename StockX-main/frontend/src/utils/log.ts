const isDev = import.meta.env.DEV;
const debugEnv = import.meta.env.VITE_DEBUG === 'true' || import.meta.env.VITE_DEBUG === '1';
const showLogs = isDev || debugEnv;

export function log(msg: string, data?: unknown) {
  if (!showLogs) return;
  const prefix = '[StockX]';
  if (data !== undefined) {
    console.log(prefix, msg, data);
  } else {
    console.log(prefix, msg);
  }
}

export function logError(msg: string, err?: unknown) {
  console.error('[StockX]', msg, err ?? '');
}

export function getDebugInfo() {
  return {
    origin: window.location.origin,
    pathname: window.location.pathname,
    search: window.location.search,
    apiUrl: import.meta.env.VITE_API_URL ?? '(not set, using default localhost:3000)',
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
  };
}
