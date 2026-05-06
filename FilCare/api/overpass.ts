import { VercelRequest, VercelResponse } from '@vercel/node';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse | void> {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Handle GET for health checks or debugging
  if (req.method === 'GET') {
    // If debug query param or header provided, echo back request info
    const isDebug = req.query?.debug === '1' || req.headers['x-debug-overpass'] === '1';
    if (isDebug) {
      const bodyPreview = typeof req.body === 'string' ? req.body.slice(0, 100) : JSON.stringify(req.body || {}).slice(0,100);
      return res.status(200).json({
        status: 'debug',
        method: req.method,
        url: req.url,
        headers: req.headers,
        bodyPreview,
      });
    }

    return res.status(200).json({
      status: 'ok',
      message: 'Overpass proxy is running. Use POST with Overpass QL query in body.'
    });
  }

  // Only accept POST for actual queries
  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    console.log('URL:', req.url);
    return res.status(405).json({ 
      error: 'Method not allowed', 
      method: req.method,
      url: req.url,
      received: 'Expected POST'
    });
  }

  try {
    // Get body from request
    let body: string = '';
    if (typeof req.body === 'string') {
      body = req.body;
    } else if (req.body instanceof Buffer) {
      body = req.body.toString('utf-8');
    } else if (typeof req.body === 'object' && req.body !== null) {
      body = JSON.stringify(req.body);
    }

    if (!body || body.trim().length === 0) {
      return res.status(400).json({ error: 'Missing Overpass query body' });
    }

    // Proxy request to Overpass API
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body,
    });

    // Forward response
    const payload = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';

    res.setHeader('Content-Type', contentType);
    return res.status(response.status).send(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Proxy error',
      details: message,
    });
  }
}