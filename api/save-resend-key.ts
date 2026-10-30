export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { apiKey, fromEmail } = body;

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim().startsWith('re_')) {
      return res.status(400).json({ success: false, error: 'A valid API key starting with re_ is required' });
    }

    const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
    let cleanFrom = (fromEmail || 'onboarding@resend.dev').trim().replace(/^["']|["']$/g, '');
    if (!cleanFrom) cleanFrom = 'onboarding@resend.dev';

    process.env.RESEND_API_KEY = cleanKey;
    process.env.RESEND_FROM_EMAIL = cleanFrom;

    return res.status(200).json({
      success: true,
      message: 'RESEND_API_KEY connected successfully!',
      keyPreview: `${cleanKey.slice(0, 5)}...${cleanKey.slice(-4)}`,
      fromEmail: cleanFrom
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to parse request' });
  }
}
