const trimTrailingSlash = (value) => value.replace(/\/$/, '');

export const resolveApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL?.trim();

  if (configured) {
    return trimTrailingSlash(configured);
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;

    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000/api/v1';
    }

    if (host.includes('zivorah') || host.endsWith('.vercel.app')) {
      return 'https://zivorabackend.vercel.app/api/v1';
    }
  }

  return 'https://zivorabackend.vercel.app/api/v1';
};
