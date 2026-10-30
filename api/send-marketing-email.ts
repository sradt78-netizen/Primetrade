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
    const { email, fullName, campaignType = 'account_active', customSubject, customContent } = body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Recipient email is required' });
    }

    const apiKey = (
      process.env.RESEND_API_KEY ||
      process.env.VITE_RESEND_API_KEY ||
      process.env.RESEND_KEY ||
      process.env.EMAIL_API_KEY ||
      body.apiKey ||
      ''
    ).trim().replace(/^["']|["']$/g, '');

    const supportEmail = 'support@primetrade.bbroot.com';

    let fromEmail = (
      process.env.RESEND_FROM_EMAIL ||
      process.env.VITE_RESEND_FROM_EMAIL ||
      body.fromEmail ||
      'onboarding@resend.dev'
    ).trim().replace(/^["']|["']$/g, '');

    if (/@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com|aol\.com|live\.com)$/i.test(fromEmail)) {
      fromEmail = 'onboarding@resend.dev';
    }

    const formatSender = (addr: string) => addr.includes('<') ? addr : `PrimeTrade Markets <${addr}>`;

    const recipientName = fullName || email.split('@')[0] || 'Valued Investor';

    let subject = '';
    let badgeText = '';
    let badgeColor = '#2563eb';
    let headline = '';
    let contentHtml = '';
    let ctaText = 'Open Trading Dashboard';
    let ctaUrl = 'https://primetrade.bbroot.com';

    if (campaignType === 'no_deposit_nudge') {
      subject = customSubject || 'Notice: You haven’t made your first deposit yet - Claim 100% Match Bonus';
      badgeText = 'ACCOUNT NOTICE · BALANCE: $0.00';
      badgeColor = '#d97706';
      headline = 'Your Account is Ready - Make Your First Deposit';
      ctaText = 'Deposit Funds Now';
      contentHtml = `
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Hello <strong>${recipientName}</strong>,<br><br>
          We noticed that your institutional PrimeTrade account is fully verified and active, but you have <strong>not yet funded your account balance</strong>.
        </p>

        <div style="background-color: #171d2d; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h4 style="color: #fbbf24; font-size: 15px; margin: 0 0 8px 0; font-weight: 700;">Exclusive 100% Welcome Deposit Bonus</h4>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
            Fund your trading wallet today and claim an instant <strong>100% capital match</strong> up to $50,000. Double your trading margin on Forex, Commodities, Indices, and Crypto markets.
          </p>
        </div>

        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Supported funding options include:
        </p>

        <ul style="color: #94a3b8; font-size: 13px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
          <li><strong style="color: #f8fafc;">Instant Bank Wire</strong> (Zero brokerage processing fees)</li>
          <li><strong style="color: #f8fafc;">USDT & USDC</strong> (TRC20, ERC20, Solana)</li>
          <li><strong style="color: #f8fafc;">Bitcoin (BTC) & Ethereum (ETH)</strong></li>
        </ul>

        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0 0 24px 0;">
          Our customer desk is standing by to guide you through funding or assign you a dedicated portfolio specialist.
        </p>
      `;
    } else if (campaignType === 'market_opportunity') {
      subject = customSubject || 'Market Opportunity Alert: Top Copy Trading Strategies (+312% ROI)';
      badgeText = 'INSTITUTIONAL ALPHA REPORT';
      badgeColor = '#10b981';
      headline = 'Top Copy Trading Opportunities This Week';
      ctaText = 'Explore Copy Traders';
      contentHtml = `
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Hello <strong>${recipientName}</strong>,<br><br>
          Market volatility is generating unprecedented returns for institutional trading desks. Our verified copy-trading portfolio managers have delivered exceptional net returns this cycle.
        </p>

        <div style="background-color: #0d1e16; border: 1px solid #059669; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <div style="font-size: 12px; font-weight: 700; color: #34d399; text-transform: uppercase;">Featured Master Strategy</div>
          <div style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 4px 0;">Apex Alpha Arbitrage</div>
          <div style="font-size: 13px; color: #a7f3d0; margin-top: 4px;">
            90-Day Verified ROI: <strong style="color: #34d399;">+312.4%</strong> · Win Rate: <strong>89.2%</strong>
          </div>
        </div>

        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
          You can mirror master trades automatically with zero manual effort and real-time execution.
        </p>
      `;
    } else if (campaignType === 'custom') {
      subject = customSubject || 'Important Update from PrimeTrade Desk';
      badgeText = 'COMMUNICATION';
      badgeColor = '#3b82f6';
      headline = customSubject || 'PrimeTrade Announcement';
      ctaText = 'Access Your Account';
      contentHtml = `
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          Hello <strong>${recipientName}</strong>,<br><br>
          ${customContent || 'Thank you for choosing PrimeTrade as your institutional brokerage partner.'}
        </p>
      `;
    } else {
      // Default: account_active
      subject = customSubject || 'Your Account is Active & Verified - Welcome to PrimeTrade';
      badgeText = 'ACCOUNT STATUS · ACTIVE & READY';
      badgeColor = '#2563eb';
      headline = 'Welcome to PrimeTrade Institutional Markets';
      ctaText = 'Start Trading Now';
      contentHtml = `
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          Hello <strong>${recipientName}</strong>,<br><br>
          Congratulations! Your PrimeTrade investment account has been successfully authenticated, verified, and activated.
        </p>

        <div style="background-color: #080d19; border: 1px solid #1e3a8a; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <h4 style="color: #60a5fa; font-size: 14px; margin: 0 0 8px 0; font-weight: 700;">Account Capabilities Unlocked:</h4>
          <ul style="color: #94a3b8; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong style="color: #f1f5f9;">Global Execution:</strong> Forex, Crypto, Stocks, Commodities with zero latency</li>
            <li><strong style="color: #f1f5f9;">Copy Trading:</strong> Auto-follow high-performance master traders</li>
            <li><strong style="color: #f1f5f9;">Custodial Protection:</strong> Segregated balance accounts with Tier-1 liquidity</li>
            <li><strong style="color: #f1f5f9;">24/7 Coverage:</strong> Direct access to broker desk and priority ticketing</li>
          </ul>
        </div>

        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
          To begin generating returns, deposit funds into your trading account or test strategies in practice mode.
        </p>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header Brand -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; padding: 8px 18px; background: #0c1427; border: 1px solid #1e293b; border-radius: 30px;">
              <span style="font-size: 16px; font-weight: 900; letter-spacing: 2px; color: #3b82f6;">PRIMETRADE</span>
              <span style="font-size: 12px; color: #64748b; margin-left: 6px; font-weight: 600;">MARKETS</span>
            </div>
          </div>

          <!-- Main Card -->
          <div style="background-color: #0b1120; border: 1px solid #1e293b; border-radius: 20px; padding: 36px 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); margin-bottom: 24px;">
            <div style="display: inline-block; padding: 5px 12px; background-color: ${badgeColor}22; border: 1px solid ${badgeColor}66; border-radius: 20px; color: ${badgeColor}; font-size: 11px; font-weight: 800; letter-spacing: 1px; margin-bottom: 18px;">
              ${badgeText}
            </div>

            <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; line-height: 1.3; margin: 0 0 16px 0;">
              ${headline}
            </h1>

            ${contentHtml}

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0 10px 0;">
              <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);">
                ${ctaText} &rarr;
              </a>
            </div>
          </div>

          <!-- Footer & Support Notice -->
          <div style="text-align: center; padding: 10px 20px;">
            <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 12px 0;">
              Have questions or need assistance? Contact our 24/7 client desk anytime at<br>
              <a href="mailto:${supportEmail}" style="color: #60a5fa; text-decoration: underline;">${supportEmail}</a>
            </p>
            <p style="color: #475569; font-size: 11px; line-height: 1.5; margin: 0;">
              &copy; PrimeTrade Markets LLC. Segregated Custody Accounts. All rights reserved.<br>
              To adjust email preferences or unsubscribe, manage settings in your investor profile.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (!apiKey || !apiKey.startsWith('re_')) {
      return res.status(200).json({
        success: true,
        delivered: false,
        method: 'not_configured',
        warning: 'RESEND_API_KEY is not configured yet. Email formatted and ready for dispatch once key is active.',
        campaignType,
        recipient: email,
        subject
      });
    }

    const client = new Resend(apiKey);
    const response = await client.emails.send({
      from: formatSender(fromEmail),
      to: [email],
      replyTo: supportEmail,
      subject: subject,
      html: emailHtml
    });

    return res.status(200).json({
      success: true,
      delivered: true,
      method: 'resend',
      id: response?.data?.id || 'delivered',
      recipient: email,
      campaignType,
      subject
    });
  } catch (error: any) {
    console.error('Marketing email dispatch error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to dispatch marketing email'
    });
  }
}
