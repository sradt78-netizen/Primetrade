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
    const { email, otp, fullName } = body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const apiKey = (
      process.env.RESEND_API_KEY ||
      process.env.VITE_RESEND_API_KEY ||
      process.env.RESEND_KEY ||
      process.env.EMAIL_API_KEY ||
      body.apiKey ||
      ''
    ).trim().replace(/^["']|["']$/g, '');

    if (!apiKey || !apiKey.startsWith('re_')) {
      return res.status(200).json({
        success: true,
        delivered: false,
        method: 'not_configured',
        warning: 'RESEND_API_KEY is not configured yet. Code prepared for instant verification.',
        fallbackOtp: otp
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

    const isWithdrawal = body.type === 'withdrawal';
    const emailSubject = isWithdrawal
      ? `${otp} is your Blue Edge Market Withdrawal Verification Code`
      : `${otp} is your Blue Edge Market verification code`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${isWithdrawal ? 'Withdrawal Security Verification' : 'Verify Your Blue Edge Market Account'}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090e1a; color: #f1f5f9; padding: 40px 20px; margin: 0;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #0d1629; border: 1px solid #1e293b; border-radius: 16px; padding: 36px 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="text-align: center; margin-bottom: 28px;">
            <h1 style="color: #3b82f6; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; margin: 0;">BLUE EDGE MARKET</h1>
            <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 4px 0 0 0;">Licensed Brokerage Security Desk</p>
          </div>

          <div style="border-top: 1px solid #1e293b; padding-top: 24px; margin-bottom: 24px;">
            <h2 style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">
              ${isWithdrawal ? 'Withdrawal Authorization Code' : 'Account Verification Code'}
            </h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              Hello ${fullName || 'Investor'},<br><br>
              ${isWithdrawal
                ? 'You have initiated a withdrawal request from your Blue Edge Market account. To authorize and continue with your disbursement transaction, use the 6-digit withdrawal verification code below:'
                : 'You are registering for a secure institutional trading account with Blue Edge Market. Use the one-time passcode (OTP) below to complete your email verification:'}
            </p>

            <div style="background-color: #080d19; border: 1px solid #2563eb; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #60a5fa; display: inline-block;">
                ${otp}
              </span>
            </div>

            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
              This passcode expires in <strong>10 minutes</strong>. For your security, never share this code with anyone. If you did not initiate this withdrawal, please contact compliance immediately at support@primetrade.bbroot.com.
            </p>
          </div>

          <div style="border-top: 1px solid #1e293b; padding-top: 20px; text-align: center;">
            <p style="color: #475569; font-size: 11px; margin: 0;">
              Blue Edge Market LLC · Segregated Custodian Vaults · SIPC Protected<br>
              Securities and CFDs offered through regulated liquidity providers.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    let response: any;
    try {
      response = await client.emails.send({
        from: formatSender(fromEmail),
        to: [email],
        subject: emailSubject,
        html: emailHtml
      });
    } catch (err: any) {
      return res.status(200).json({
        success: true,
        delivered: false,
        method: 'exception',
        error: err?.message || 'Error calling Resend API',
        warning: `Resend Notice: ${err?.message}`,
        fallbackOtp: otp
      });
    }

    if (response.error) {
      // Attempt fallback with onboarding@resend.dev if custom domain failed
      if (fromEmail !== 'onboarding@resend.dev') {
        try {
          const fallbackResp = await client.emails.send({
            from: formatSender('onboarding@resend.dev'),
            to: [email],
            subject: `${otp} is your Blue Edge Market verification code`,
            html: emailHtml
          });

          if (!fallbackResp.error && fallbackResp.data?.id) {
            return res.status(200).json({
              success: true,
              delivered: true,
              method: 'email',
              provider: 'Resend',
              message: `Verification code dispatched to ${email}`,
              deliveryId: fallbackResp.data.id,
              usedSender: 'onboarding@resend.dev'
            });
          }
        } catch (_) {}
      }

      return res.status(200).json({
        success: true,
        delivered: false,
        method: 'email_error',
        error: response.error.message,
        warning: `Resend Notice: ${response.error.message}`,
        fallbackOtp: otp
      });
    }

    if (response.data?.id) {
      return res.status(200).json({
        success: true,
        delivered: true,
        method: 'email',
        provider: 'Resend',
        message: `Verification code dispatched to ${email}`,
        deliveryId: response.data.id,
        usedSender: fromEmail
      });
    }

    return res.status(200).json({
      success: true,
      delivered: false,
      method: 'no_id',
      warning: 'No message ID returned from email service',
      fallbackOtp: otp
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error processing OTP'
    });
  }
}
