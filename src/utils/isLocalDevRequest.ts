/** True when the HTTP Host header indicates localhost dev (used by server dev-only routes). */
export function isLocalDevRequest(req: { get: (name: string) => string | undefined }): boolean {
  const host = (req.get('host') || '').toLowerCase();
  return host.startsWith('localhost:') || host.startsWith('127.0.0.1:');
}
