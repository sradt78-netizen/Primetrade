export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawKey = (
    process.env.RESEND_API_KEY ||
    process.env.VITE_RESEND_API_KEY ||
    process.env.RESEND_KEY ||
    process.env.EMAIL_API_KEY ||
    ''
  ).trim().replace(/^["']|["']$/g, '');

  const fromEmail = (
    process.env.RESEND_FROM_EMAIL ||
    process.env.VITE_RESEND_FROM_EMAIL ||
    'onboarding@resend.dev'
  ).trim().replace(/^["']|["']$/g, '');

  const isConfigured = rawKey.length > 5 && rawKey.startsWith('re_');

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: {
      RESEND_API_KEY_CONNECTED: isConfigured,
      RESEND_KEY_PREVIEW: isConfigured ? `${rawKey.slice(0, 5)}...${rawKey.slice(-4)}` : 'NOT_CONFIGURED',
      RESEND_FROM_EMAIL: fromEmail,
      GEMINI_API_KEY_CONNECTED: !!process.env.GEMINI_API_KEY,
      APP_URL: process.env.APP_URL || 'https://primetrade.vercel.app',
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: 3000
    }
  });
}
