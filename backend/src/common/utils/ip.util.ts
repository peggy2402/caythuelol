// backend/src/common/utils/ip.util.ts
export function getClientIp(req: any): string {
  if (!req) return '127.0.0.1';

  // 1. Cloudflare header
  const cfIp = req.headers?.['cf-connecting-ip'];
  if (cfIp) {
    const raw = Array.isArray(cfIp) ? cfIp[0] : cfIp;
    if (raw && typeof raw === 'string') return raw.trim();
  }

  // 2. Standard X-Forwarded-For header
  const xForwardedFor = req.headers?.['x-forwarded-for'];
  if (xForwardedFor) {
    const raw = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    if (raw && typeof raw === 'string') {
      const firstIp = raw.split(',')[0].trim();
      if (firstIp) return firstIp;
    }
  }

  // 3. Nginx / reverse proxy header
  const xRealIp = req.headers?.['x-real-ip'];
  if (xRealIp) {
    const raw = Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
    if (raw && typeof raw === 'string') return raw.trim();
  }

  // 4. Express / Node.js socket remote address
  const remoteAddress =
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress;

  if (remoteAddress && typeof remoteAddress === 'string') {
    // Chuyển IPv6 localhost hoặc ::ffff:1.2.3.4 về IPv4 sạch
    return remoteAddress.replace(/^.*:/, '').trim() || remoteAddress;
  }

  return '127.0.0.1';
}
