import { Resend } from 'resend';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const target = (body.toEmail || 'sradt78@gmail.com').trim();

    const apiKey = (
      process.env.RESEND_API_KEY ||
      process.env.VITE_RESEND_API_KEY ||
      process.env.RESEND_KEY ||
      process.env.EMAIL_API_KEY ||
      body.apiKey ||
      ''
    ).trim().replace(/^["']|["']$/g, '');

    if (!apiKey || !apiKey.startsWith('re_')) {
      return res.status(400).json({
        success: false,
        error: 'RESEND_API_KEY is not configured or invalid. Key must start with re_.'
      });
    }

    let fromEmail = (
      process.env.RESEND_FROM_EMAIL ||
      process.env.VITE_RESEND_FROM_EMAIL ||
      body.fromEmail ||
      'onboarding@resend.dev'
    ).trim().replace(/^["']|["']$/g, '');

    // Prevent failure with public webmail domains
    if (/@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com|aol\.com|live\.com)$/i.test(fromEmail)) {
      fromEmail = 'onboarding@resend.dev';
    }

    const client = new Resend(apiKey);
    const formatSender = (addr: string) => addr.includes('<') ? addr : `Blue Edge Security <${addr}>`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090e1a; color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #1e293b;">
        <h2 style="color: #3b82f6; margin-top: 0;">Live Email Dispatch Verified!</h2>
        <p>Your <strong>RESEND_API_KEY</strong> is actively connected and functioning properly on Blue Edge Market.</p>
        <div style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
          <p style="margin: 0; color: #10b981; font-weight: bold;">Status: Active & Verified</p>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Recipient: ${target}</p>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Dispatched at: ${new Date().toISOString()}</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">Blue Edge Market Institutional Trading Desk</p>
      </div>
    `;

    let response: any;
    try {
      response = await client.emails.send({
        from: formatSender(fromEmail),
        to: [target],
        subject: 'Blue Edge Market - Environment Variable Connection Test',
        html: htmlContent
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Network exception calling Resend API'
      });
    }

    // Check Resend error object
    if (response.error) {
      // If failed with custom domain, attempt retry with onboarding@resend.dev
      if (fromEmail !== 'onboarding@resend.dev') {
        try {
          const fallbackResp = await client.emails.send({
            from: formatSender('onboarding@resend.dev'),
            to: [target],
            subject: 'Blue Edge Market - Environment Variable Connection Test',
            html: htmlContent
          });

          if (!fallbackResp.error && fallbackResp.data?.id) {
            return res.status(200).json({
              success: true,
              message: `Live test email successfully delivered to ${target}! (Delivery ID: ${fallbackResp.data.id})`,
              deliveryId: fallbackResp.data.id,
              usedSender: 'onboarding@resend.dev'
            });
          }
        } catch (_) {}
      }

      return res.status(400).json({
        success: false,
        error: response.error.message || 'Resend was unable to deliver test email.',
        tip: response.error.message?.includes('own email address')
          ? 'Resend sandbox testing mode only allows sending to your account email (sradt78@gmail.com). To send to other users, verify your domain at resend.com/domains.'
          : 'Check your domain verification and DNS settings in Resend.'
      });
    }

    if (response.data?.id) {
      return res.status(200).json({
        success: true,
        message: `Live test email successfully delivered to ${target}! (Delivery ID: ${response.data.id})`,
        deliveryId: response.data.id,
        usedSender: fromEmail
      });
    }

    return res.status(500).json({
      success: false,
      error: 'No message ID returned from Resend'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error processing test email'
    });
  }
}
