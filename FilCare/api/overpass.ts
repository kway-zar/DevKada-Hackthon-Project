import { VercelRequest, VercelResponse } from '@vercel/node';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  if (!body || !body.trim()) {
    res.status(400).json({ error: 'Missing Overpass query body' });
    return;
  }

  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body,
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: 'Overpass API error',
        status: response.status,
      });
      return;
    }

    const contentType = response.headers.get('content-type') || 'application/json';
    const payload = await response.text();

    res.setHeader('Content-Type', contentType);
    res.status(200).send(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Proxy error',
      details: message,
    });
  }
}