/**
 * Utility to generate SSO Token Handoff URL for Anticeil Platform.
 * Uses ?token=... to seamlessly authenticate the user on the target platform.
 */
export function getPlatformSsoUrl(path: string = '/'): string {
  const baseUrl = (import.meta.env.VITE_PLATFORM_URL as string) || 'https://anticeil.com';
  let token = '';
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token') || localStorage.getItem('ap_token') || '';
  }

  try {
    const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
    if (token) {
      url.searchParams.set('token', token);
    }
    return url.toString();
  } catch {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const full = `${cleanBase}${cleanPath}`;
    return token ? `${full}${full.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : full;
  }
}
