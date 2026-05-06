import { VercelRequest, VercelResponse } from '@vercel/node';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const OVERPASS_REQUEST_HEADERS = {
  'Content-Type': 'text/plain;charset=UTF-8',
  Accept: 'application/json, text/xml;q=0.9, */*;q=0.8',
  'User-Agent': 'FilCare/1.0 (+https://filcare.vercel.app)',
};

const getRequestBody = (req: VercelRequest) => {
  const rawBody = (req as VercelRequest & { rawBody?: string | Buffer }).rawBody;

  if (typeof req.body === 'string') {
    return req.body;
  }

  if (typeof rawBody === 'string') {
    return rawBody;
  }

  if (rawBody instanceof Buffer) {
    return rawBody.toString('utf-8');
  }

  if (req.body instanceof Buffer) {
    return req.body.toString('utf-8');
  }

  if (typeof req.body === 'object' && req.body !== null) {
    const queryBody = (req.body as Record<string, unknown>).query;
    if (typeof queryBody === 'string') {
      return queryBody;
    }

    const bodyField = (req.body as Record<string, unknown>).body;
    if (typeof bodyField === 'string') {
      return bodyField;
    }
  }

  return '';
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse | void> {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Global debug header support: if client sends x-debug-overpass: 1, echo request details
  const debugHeader = req.headers['x-debug-overpass'];
  const isDebugHeader = debugHeader === '1' || debugHeader === 'true';
  if (isDebugHeader) {
    let bodyPreview = '';
    try {
      if (typeof req.body === 'string') bodyPreview = req.body.slice(0, 100);
      else if (req.body instanceof Buffer) bodyPreview = req.body.toString('utf-8').slice(0,100);
      else bodyPreview = JSON.stringify(req.body || {}).slice(0,100);
    } catch (e) {
      bodyPreview = '[unserializable]';
    }
    return res.status(200).json({
      debug: true,
      method: req.method,
      url: req.url,
      headers: req.headers,
      bodyPreview,
    });
  }

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
    const body = getRequestBody(req);

    if (!body || body.trim().length === 0) {
      return res.status(400).json({ error: 'Missing Overpass query body' });
    }

    let lastResponse: Response | null = null;
    let lastPayload = '';

    for (const endpoint of OVERPASS_ENDPOINTS) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: OVERPASS_REQUEST_HEADERS,
        body,
      });

      const payload = await response.text();
      lastResponse = response;
      lastPayload = payload;

      if (response.ok || response.status !== 406) {
        break;
      }
    }

    if (!lastResponse) {
      return res.status(502).json({
        error: 'Proxy error',
        details: 'Unable to contact Overpass API',
      });
    }

    const contentType = lastResponse.headers.get('content-type') || 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Overpass-Endpoint', lastResponse.url);
    return res.status(lastResponse.status).send(lastPayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Proxy error',
      details: message,
    });
  }
}