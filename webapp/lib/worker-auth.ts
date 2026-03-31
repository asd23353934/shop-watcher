/**
 * Verifies the Worker Bearer token from the Authorization header.
 * Returns a Response with 401 if invalid, or null if valid.
 *
 * Worker API 以 WORKER_SECRET Bearer token 驗證
 */
export function verifyWorkerToken(request: Request): Response | null {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid Authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const token = authHeader.slice('Bearer '.length)
  const secret = process.env.WORKER_SECRET

  if (!secret) {
    console.error('WORKER_SECRET is not configured')
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (token !== secret) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return null // valid
}
