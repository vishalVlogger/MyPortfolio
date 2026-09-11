/** A separate server-to-server credential. Never send this key to browser code. */
export async function verifySyncToken(request: Request, expected: string | undefined): Promise<boolean> {
  if (!expected || !/^[a-f0-9]{64}$/.test(expected)) return false;
  const supplied = request.headers.get('x-portfolio-sync-key');
  if (!supplied || !/^[a-f0-9]{64}$/.test(supplied)) return false;
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
    crypto.subtle.digest('SHA-256', encoder.encode(supplied)),
  ]);
  const a = new Uint8Array(left), b = new Uint8Array(right);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
