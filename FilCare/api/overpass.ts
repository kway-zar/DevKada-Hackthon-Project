const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

function setCorsHeaders(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? req.body : '';
  if (!body.trim()) {
    return res.status(400).json({ error: 'Missing Overpass query body' });
  }

  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        Accept: 'application/json',
      },
      body,
    });

    const payload = await response.text();

    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    return res.send(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown proxy failure';
    return res.status(500).json({ error: 'Failed to proxy Overpass request', details: message });
  }
}