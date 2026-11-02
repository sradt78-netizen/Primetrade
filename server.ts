import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { checkDbConnection, initPgPool, addCopySubscription, getDatabaseUrl, getCopyTraders } from './server/db';
import {
  loadStore,
  saveStore,
  getStoredUser,
  syncOrUpdateUser,
  adjustUserBalanceInStore,
  getAllStoredUsers,
  deleteStoredUser,
  updateUserKyc,
  addTransaction,
  updateTransactionStatus,
  getAllTransactions,
  addKycSubmission,
  getAllKycSubmissions,
  reviewKycSubmission,
  StoredUser,
  StoredSupportMessage,
  StoredWithdrawalCode,
  StoredCryptoPaymentMethod,
  StoredTransaction,
  StoredKycSubmission
} from './server/store';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Dynamic Resend environment configuration reader
function getResendConfig() {
  // Re-read .env from root if present to support hot changes
  try {
    const envFile = path.resolve(__dirname, '.env');
    if (fs.existsSync(envFile)) {
      const parsed = dotenv.parse(fs.readFileSync(envFile));
      for (const [k, v] of Object.entries(parsed)) {
        process.env[k] = v;
      }
    }
  } catch (_) {}

  const rawKey = (
    process.env.RESEND_API_KEY ||
    process.env.VITE_RESEND_API_KEY ||
    process.env.RESEND_KEY ||
    process.env.EMAIL_API_KEY ||
    ''
  ).trim().replace(/^["']|["']$/g, '');

  let fromEmail = (
    process.env.RESEND_FROM_EMAIL ||
    process.env.VITE_RESEND_FROM_EMAIL ||
    'onboarding@resend.dev'
  ).trim().replace(/^["']|["']$/g, '');

  if (!fromEmail || fromEmail === '""' || fromEmail === "''") {
    fromEmail = 'onboarding@resend.dev';
  }

  const isConfigured = rawKey.length > 5 && rawKey.startsWith('re_');

  return {
    rawKey,
    isConfigured,
    client: isConfigured ? new Resend(rawKey) : null,
    fromEmail
  };
}

// Resend Email Dispatch Helper with automatic error detection & domain verification fallback
async function sendResendMail(
  client: Resend,
  configuredFrom: string,
  toEmail: string,
  subject: string,
  html: string
): Promise<{ success: boolean; data?: any; error?: string; usedSender?: string }> {
  let from = (configuredFrom || 'onboarding@resend.dev').trim();

  // If user configured a public webmail domain (e.g. @gmail.com, @yahoo.com, @outlook.com),
  // Resend will strictly reject it due to DMARC. Auto-switch to onboarding@resend.dev.
  const isWebmail = /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com|aol\.com|live\.com)$/i.test(from);
  if (isWebmail) {
    console.warn(`[Resend Notice] Sender '${from}' is a public webmail domain. Resend only permits verified custom domains or onboarding@resend.dev. Falling back to onboarding@resend.dev.`);
    from = 'onboarding@resend.dev';
  }

  const formatSender = (addr: string) => addr.includes('<') ? addr : `Blue Edge Security <${addr}>`;

  let response: any;
  try {
    response = await client.emails.send({
      from: formatSender(from),
      to: [toEmail],
      subject,
      html
    });
  } catch (err: any) {
    console.error('[Resend Exception]', err);
    return { success: false, error: err?.message || 'Network exception calling Resend API' };
  }

  // Check Resend error object (Resend returns { data, error } instead of throwing)
  if (response.error) {
    console.error('[Resend API Error]', response.error);

    // If custom sender domain failed (e.g. domain not verified), attempt retry with onboarding@resend.dev
    if (from !== 'onboarding@resend.dev') {
      console.log('[Resend Fallback] Retrying with onboarding@resend.dev...');
      try {
        const retryResp = await client.emails.send({
          from: formatSender('onboarding@resend.dev'),
          to: [toEmail],
          subject,
          html
        });
        if (!retryResp.error && retryResp.data?.id) {
          console.log('[Resend Fallback Success]', retryResp.data);
          return {
            success: true,
            data: retryResp.data,
            usedSender: 'onboarding@resend.dev'
          };
        } else if (retryResp.error) {
          console.error('[Resend Fallback Error]', retryResp.error);
          return {
            success: false,
            error: retryResp.error.message || response.error.message
          };
        }
      } catch (retryErr: any) {
        return { success: false, error: retryErr?.message || response.error.message };
      }
    }

    return {
      success: false,
      error: response.error.message
    };
  }

  if (response.data?.id) {
    return {
      success: true,
      data: response.data,
      usedSender: from
    };
  }

  return {
    success: false,
    error: 'No message ID returned from Resend'
  };
}

// Diagnostic API: Verify connected environment variables
app.get('/api/env-status', (req, res) => {
  const cfg = getResendConfig();
  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: {
      RESEND_API_KEY_CONNECTED: cfg.isConfigured,
      RESEND_KEY_PREVIEW: cfg.isConfigured ? `${cfg.rawKey.slice(0, 5)}...${cfg.rawKey.slice(-4)}` : 'NOT_CONFIGURED',
      RESEND_FROM_EMAIL: cfg.fromEmail,
      GEMINI_API_KEY_CONNECTED: !!process.env.GEMINI_API_KEY,
      APP_URL: process.env.APP_URL || `http://localhost:${PORT}`,
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: PORT
    }
  });
});

// Database diagnostics & status for Neon PostgreSQL
app.get('/api/db-status', async (req, res) => {
  try {
    const status = await checkDbConnection();
    return res.json({ success: true, ...status });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Activate or update Neon PostgreSQL connection string
app.post('/api/db-connect', async (req, res) => {
  try {
    const { databaseUrl } = req.body;
    if (!databaseUrl || typeof databaseUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'databaseUrl is required' });
    }
    const cleanUrl = databaseUrl.trim();
    if (!cleanUrl.startsWith('postgres://') && !cleanUrl.startsWith('postgresql://')) {
      return res.status(400).json({ success: false, error: 'Invalid database URL. Must start with postgresql:// or postgres://' });
    }

    // Test connection
    const testRes = await checkDbConnection(cleanUrl);
    if (!testRes.connected) {
      return res.status(400).json({ success: false, error: testRes.error || 'Failed to connect to Neon PostgreSQL' });
    }

    // Set process.env
    process.env.DATABASE_URL = cleanUrl;

    // Append or update .env file
    try {
      const envPath = path.resolve(__dirname, '.env');
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      if (envContent.includes('DATABASE_URL=')) {
        envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${cleanUrl}"`);
      } else {
        envContent += `\nDATABASE_URL="${cleanUrl}"\n`;
      }
      fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    } catch (_) {}

    return res.json({
      success: true,
      message: 'Successfully connected and activated Neon PostgreSQL database!',
      status: testRes
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Copy trading experts directory endpoint (returns 250+ traders)
app.get('/api/copy-traders', async (req, res) => {
  try {
    const traders = await getCopyTraders();
    return res.json({ success: true, count: traders.length, traders });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Copy trading subscriptions endpoint
app.post('/api/copy-traders/copy', async (req, res) => {
  try {
    const { traderId, traderName, traderSpecialty, amount, userId } = req.body;
    if (!traderId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid traderId and amount are required' });
    }
    const subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const result = await addCopySubscription({
      id: subId,
      userId,
      traderId,
      traderName: traderName || 'Expert Trader',
      traderSpecialty: traderSpecialty || 'Pro',
      amount: Number(amount)
    });
    return res.json({ subscriptionId: subId, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});


// Endpoint: Send OTP to User's Email with full status feedback
app.post(['/api/send-otp', '/send-otp'], async (req, res) => {
  try {
    const { email, otp, fullName } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    console.log(`[OTP Request] Dispatching 6-digit verification code to: ${email}`);
    const config = getResendConfig();

    // If Resend API key is available, dispatch live email
    if (config.isConfigured && config.client) {
      const isWithdrawal = req.body.type === 'withdrawal';
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

      const sendRes = await sendResendMail(
        config.client,
        config.fromEmail,
        email,
        emailSubject,
        emailHtml
      );

      if (sendRes.success) {
        console.log('[Resend Success]', sendRes.data);
        return res.json({
          success: true,
          delivered: true,
          method: 'email',
          provider: 'Resend',
          message: `Verification code dispatched to ${email}`,
          deliveryId: sendRes.data?.id,
          usedSender: sendRes.usedSender
        });
      } else {
        console.warn('[Resend Delivery Failed]', sendRes.error);
        return res.json({
          success: true,
          delivered: false,
          method: 'email_error',
          error: sendRes.error,
          warning: `Resend Notice: ${sendRes.error}`,
          fallbackOtp: otp
        });
      }
    } else {
      console.warn('[Resend API Key Notice] RESEND_API_KEY is not configured yet in environment.');
      return res.json({
        success: true,
        delivered: false,
        method: 'not_configured',
        warning: 'RESEND_API_KEY is not configured. Verification passcode prepared below.',
        fallbackOtp: otp
      });
    }
  } catch (err: any) {
    console.error('[API Error in send-otp]', err);
    return res.status(500).json({ success: false, error: 'Internal server error dispatching OTP' });
  }
});

// Endpoint: Test Email Dispatch
app.post(['/api/test-email', '/test-email'], async (req, res) => {
  try {
    const { toEmail } = req.body;
    const target = (toEmail || 'sradt78@gmail.com').trim();
    const config = getResendConfig();

    if (!config.isConfigured || !config.client) {
      return res.status(400).json({
        success: false,
        error: 'RESEND_API_KEY is not configured. Add your key starting with re_ in Admin Desk or environment.'
      });
    }

    const testHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090e1a; color: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #1e293b;">
        <h2 style="color: #3b82f6; margin-top: 0;">Environment Variable Successfully Connected!</h2>
        <p>Your <strong>RESEND_API_KEY</strong> environment variable is actively connected and functioning properly on Blue Edge Market.</p>
        <div style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
          <p style="margin: 0; color: #10b981; font-weight: bold;">Status: Active & Verified</p>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Recipient: ${target}</p>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Dispatched at: ${new Date().toISOString()}</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">Blue Edge Market Institutional Trading Desk</p>
      </div>
    `;

    const sendRes = await sendResendMail(
      config.client,
      config.fromEmail,
      target,
      `Blue Edge Market - Environment Variable Connection Test`,
      testHtml
    );

    if (sendRes.success) {
      return res.json({
        success: true,
        message: `Live test email successfully delivered to ${target}! (Delivery ID: ${sendRes.data?.id})`,
        deliveryId: sendRes.data?.id,
        usedSender: sendRes.usedSender
      });
    } else {
      return res.status(400).json({
        success: false,
        error: sendRes.error || 'Resend was unable to deliver test email.',
        tip: sendRes.error?.includes('own email address')
          ? 'Resend testing mode only allows sending to your account owner email (sradt78@gmail.com). To send to other users, verify your domain at resend.com/domains.'
          : 'Check your domain verification and DNS settings in Resend.'
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to dispatch test email'
    });
  }
});

// Endpoint: Send Marketing Lifecycle Email (Account Active, Deposit Nudge, Market Opportunity)
app.post(['/api/send-marketing-email', '/send-marketing-email'], async (req, res) => {
  try {
    const { email, fullName, campaignType = 'account_active', customSubject, customContent } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Recipient email is required' });
    }

    const config = getResendConfig();
    const supportEmail = 'support@primetrade.bbroot.com';
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
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; padding: 8px 18px; background: #0c1427; border: 1px solid #1e293b; border-radius: 30px;">
              <span style="font-size: 16px; font-weight: 900; letter-spacing: 2px; color: #3b82f6;">PRIMETRADE</span>
              <span style="font-size: 12px; color: #64748b; margin-left: 6px; font-weight: 600;">MARKETS</span>
            </div>
          </div>

          <div style="background-color: #0b1120; border: 1px solid #1e293b; border-radius: 20px; padding: 36px 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); margin-bottom: 24px;">
            <div style="display: inline-block; padding: 5px 12px; background-color: ${badgeColor}22; border: 1px solid ${badgeColor}66; border-radius: 20px; color: ${badgeColor}; font-size: 11px; font-weight: 800; letter-spacing: 1px; margin-bottom: 18px;">
              ${badgeText}
            </div>

            <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; line-height: 1.3; margin: 0 0 16px 0;">
              ${headline}
            </h1>

            ${contentHtml}

            <div style="text-align: center; margin: 30px 0 10px 0;">
              <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);">
                ${ctaText} &rarr;
              </a>
            </div>
          </div>

          <div style="text-align: center; padding: 10px 20px;">
            <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 12px 0;">
              Have questions or need assistance? Contact our 24/7 client desk anytime at<br>
              <a href="mailto:${supportEmail}" style="color: #60a5fa; text-decoration: underline;">${supportEmail}</a>
            </p>
            <p style="color: #475569; font-size: 11px; line-height: 1.5; margin: 0;">
              &copy; PrimeTrade Markets LLC. Segregated Custody Accounts. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (!config.isConfigured || !config.client) {
      return res.status(200).json({
        success: true,
        delivered: false,
        method: 'not_configured',
        warning: 'RESEND_API_KEY is not configured yet. Email formatted and ready for dispatch.',
        campaignType,
        recipient: email,
        subject
      });
    }

    const sendRes = await sendResendMail(
      config.client,
      config.fromEmail,
      email,
      subject,
      emailHtml
    );

    if (sendRes.success) {
      return res.json({
        success: true,
        delivered: true,
        method: 'resend',
        deliveryId: sendRes.data?.id,
        recipient: email,
        campaignType,
        subject,
        usedSender: sendRes.usedSender
      });
    } else {
      return res.status(200).json({
        success: true,
        delivered: false,
        method: 'resend_error',
        warning: sendRes.error,
        campaignType,
        recipient: email
      });
    }
  } catch (err: any) {
    console.error('[Marketing Email Error]', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to dispatch marketing email' });
  }
});

// Endpoint: Save or update RESEND_API_KEY directly into .env and runtime
app.post(['/api/save-resend-key', '/save-resend-key'], (req, res) => {
  try {
    const { apiKey, fromEmail } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim().startsWith('re_')) {
      return res.status(400).json({ success: false, error: 'A valid API key starting with re_ is required (e.g. re_abc123...)' });
    }

    const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
    let cleanFrom = (fromEmail || 'onboarding@resend.dev').trim().replace(/^["']|["']$/g, '');
    if (!cleanFrom) cleanFrom = 'onboarding@resend.dev';

    process.env.RESEND_API_KEY = cleanKey;
    process.env.RESEND_FROM_EMAIL = cleanFrom;

    const envPath = path.resolve(__dirname, '.env');
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
      if (content.includes('RESEND_API_KEY=')) {
        content = content.replace(/RESEND_API_KEY=.*/g, `RESEND_API_KEY="${cleanKey}"`);
      } else {
        content += `\nRESEND_API_KEY="${cleanKey}"\n`;
      }
      if (content.includes('RESEND_FROM_EMAIL=')) {
        content = content.replace(/RESEND_FROM_EMAIL=.*/g, `RESEND_FROM_EMAIL="${cleanFrom}"`);
      } else {
        content += `\nRESEND_FROM_EMAIL="${cleanFrom}"\n`;
      }
    } else {
      content = `PORT=3000\nRESEND_API_KEY="${cleanKey}"\nRESEND_FROM_EMAIL="${cleanFrom}"\n`;
    }

    fs.writeFileSync(envPath, content, 'utf8');

    return res.json({
      success: true,
      message: 'RESEND_API_KEY saved and connected successfully!',
      keyPreview: `${cleanKey.slice(0, 5)}...${cleanKey.slice(-4)}`,
      fromEmail: cleanFrom
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to save environment variable' });
  }
});

// ==========================================
// CENTRAL REAL-TIME INVESTOR & ADMIN API
// ==========================================

// 1. Users & Balances
app.get('/api/users', (req, res) => {
  const users = getAllStoredUsers();
  res.json({ success: true, count: users.length, users });
});

app.get('/api/user-profile', (req, res) => {
  const username = (req.query.username as string || req.query.email as string || '').trim();
  if (!username) {
    return res.status(400).json({ success: false, error: 'username or email is required' });
  }
  const user = getStoredUser(username);
  if (!user) {
    const created = syncOrUpdateUser({ username });
    return res.json({ success: true, user: created });
  }
  res.json({ success: true, user });
});

app.post('/api/user-sync', (req, res) => {
  const profile = req.body;
  if (!profile || (!profile.username && !profile.email)) {
    return res.status(400).json({ success: false, error: 'Valid profile with username or email required' });
  }
  const updated = syncOrUpdateUser(profile);
  console.log(`[User Sync] User @${updated.username} synchronized successfully in server store.`);
  res.json({ success: true, user: updated });
});

app.post('/api/users/delete', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: 'username is required' });
  }
  const deleted = deleteStoredUser(username);
  res.json({ success: deleted, message: deleted ? `User @${username} removed` : 'User not found' });
});

app.post('/api/user-kyc-toggle', (req, res) => {
  const { username, isVerified, tier } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: 'username is required' });
  }
  const updated = updateUserKyc(username, isVerified, tier);
  if (!updated) {
    return res.status(404).json({ success: false, error: `User @${username} not found` });
  }
  res.json({ success: true, user: updated });
});

app.post('/api/user-balance', (req, res) => {
  const { username, delta, note } = req.body;
  if (!username || typeof delta !== 'number') {
    return res.status(400).json({ success: false, error: 'username and numeric delta required' });
  }
  const updated = adjustUserBalanceInStore(username, delta, note);
  if (!updated) {
    return res.status(404).json({ success: false, error: `User ${username} not found` });
  }
  res.json({ success: true, user: updated, newBalance: updated.accountBalance });
});

// 2. Live Support Chat Messages (Bidirectional Investor <-> Admin)
app.get('/api/chat-messages', (req, res) => {
  const store = loadStore();
  const filterUser = (req.query.userId as string || req.query.username as string || '').toLowerCase().trim();

  if (filterUser) {
    // Return messages for this investor or general broker broadcast
    const userMsgs = store.supportMessages.filter(m =>
      !m.userId ||
      m.userId.toLowerCase() === filterUser ||
      (m.sender === 'broker' && !m.userId) ||
      (m.userName && m.userName.toLowerCase() === filterUser)
    );
    return res.json({ success: true, messages: userMsgs });
  }

  res.json({ success: true, messages: store.supportMessages });
});

app.post('/api/chat-messages', (req, res) => {
  const { sender, text, userId, userName, userEmail } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: 'Message text is required' });
  }

  const store = loadStore();
  const cleanText = text.trim();
  const msgSender: 'user' | 'admin' | 'broker' = sender === 'admin' ? 'admin' : 'user';
  const targetUserId = (userId || (msgSender === 'user' ? 'Eau231' : 'Eau231')).trim();

  const newMsg: StoredSupportMessage = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sender: msgSender,
    text: cleanText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    userId: targetUserId,
    userName: userName || (msgSender === 'admin' ? 'Senior Broker Admin' : targetUserId),
    userEmail: userEmail || `${targetUserId.toLowerCase()}@primetrade.us.ci`,
    isReadByAdmin: msgSender === 'admin'
  };

  store.supportMessages.push(newMsg);

  // If user asked about withdrawal code or withdrawal, auto-respond with helpful message
  const lower = cleanText.toLowerCase();
  if (msgSender === 'user') {
    let reply = 'An admin representative will be with you in a minute.';
    if (lower.includes('withdraw') || lower.includes('code') || lower.includes('token')) {
      reply = `An admin representative will be with you in a minute. Your withdrawal verification code inquiry has been flagged for desk processing. Our compliance team will generate and send your authorization code shortly for @${targetUserId}.`;
    }

    const autoReply: StoredSupportMessage = {
      id: `brk-${Date.now() + 1}`,
      sender: 'broker',
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now() + 1,
      userId: targetUserId,
      userName: 'Broker Compliance Bot',
      isReadByAdmin: true
    };
    store.supportMessages.push(autoReply);
  }

  saveStore(store);
  res.json({ success: true, messages: store.supportMessages });
});

app.post('/api/chat-messages/read', (req, res) => {
  const { userId } = req.body || {};
  const store = loadStore();
  const target = userId ? userId.toLowerCase().trim() : '';

  store.supportMessages.forEach(m => {
    if (!target || (m.userId && m.userId.toLowerCase() === target)) {
      m.isReadByAdmin = true;
    }
  });
  saveStore(store);
  res.json({ success: true, message: 'Chat messages marked as read' });
});

// 3. Withdrawal Verification Codes Management
app.get('/api/withdrawal-codes', (req, res) => {
  const store = loadStore();
  res.json({ success: true, codes: store.withdrawalCodes });
});

app.post('/api/withdrawal-codes/generate', async (req, res) => {
  try {
    const { username, customCode, sendToChat, emailToUser } = req.body;
    const targetUsername = (username || 'Eau231').trim();
    const store = loadStore();

    const user = getStoredUser(targetUsername);
    const userEmail = user?.email || `${targetUsername.toLowerCase()}@primetrade.us.ci`;

    const code = (customCode && typeof customCode === 'string' && customCode.trim().length === 6)
      ? customCode.trim()
      : Math.floor(100000 + Math.random() * 900000).toString();

    const record: StoredWithdrawalCode = {
      id: `wcode-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code,
      username: targetUsername,
      userEmail,
      status: 'ACTIVE',
      createdAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      createdBy: 'admin'
    };

    store.withdrawalCodes.unshift(record);

    // Send message directly into the live support chat for this investor
    if (sendToChat !== false) {
      const chatMsg: StoredSupportMessage = {
        id: `adm-wcode-${Date.now()}`,
        sender: 'admin',
        text: `Official Broker Clearance Desk: Your 6-digit withdrawal verification code for ${targetUsername} is: [ ${code} ]. Please enter this code in your withdrawal authorization window to proceed.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        userId: targetUsername,
        userName: 'Senior Compliance Desk',
        isReadByAdmin: true
      };
      store.supportMessages.push(chatMsg);
    }

    saveStore(store);

    // Email via Resend if requested
    if (emailToUser && userEmail) {
      const config = getResendConfig();
      if (config.isConfigured && config.client) {
        sendResendMail(
          config.client,
          config.fromEmail,
          userEmail,
          `Your Official Withdrawal Verification Code - ${code}`,
          `
            <div style="font-family: sans-serif; background: #0b1120; color: #fff; padding: 25px; border-radius: 12px;">
              <h3 style="color: #3b82f6;">Withdrawal Authorization Code</h3>
              <p>Hello ${targetUsername},</p>
              <p>Your one-time withdrawal verification code has been issued by our broker compliance desk:</p>
              <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #10b981; padding: 15px; background: #030712; border-radius: 8px; text-align: center; margin: 15px 0;">
                ${code}
              </div>
              <p style="font-size: 12px; color: #94a3b8;">Enter this code on your withdrawal request screen to authorize your payout.</p>
            </div>
          `
        ).catch((err) => {
          console.warn('[Withdrawal Code Email Exception]', err);
        });
      }
    }

    return res.json({ success: true, code, record, message: `Withdrawal code ${code} generated for ${targetUsername}` });
  } catch (err: any) {
    console.error('[Error in /api/withdrawal-codes/generate]', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to generate withdrawal code' });
  }
});

app.post('/api/withdrawal-codes/verify', (req, res) => {
  const { code, username } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'Verification code is required' });
  }

  const cleanCode = code.trim();
  const store = loadStore();

  // Withdrawal codes must be bound to the requesting account. There are no
  // universal/master codes and no cross-account fallback.
  const targetUserLower = typeof username === 'string' ? username.toLowerCase().trim() : '';
  if (!targetUserLower) {
    return res.status(400).json({ success: false, error: 'username is required' });
  }

  const match = store.withdrawalCodes.find(c =>
    c.code === cleanCode &&
    c.status === 'ACTIVE' &&
    c.username.toLowerCase() === targetUserLower
  );

  if (match) {
    match.status = 'USED';
    match.usedAt = new Date().toISOString();
    saveStore(store);
    return res.json({ success: true, message: 'Withdrawal Code verified successfully for this account.' });
  }

  return res.status(400).json({
    success: false,
    error: 'Invalid or expired withdrawal verification code. Please request an authorization code from live support or customer desk.'
  });
});

// 4. Client Deposits & Transactions Management Ledger
app.get('/api/transactions', (req, res) => {
  const username = req.query.username as string | undefined;
  const txs = getAllTransactions(username);
  res.json({ success: true, count: txs.length, transactions: txs });
});

app.post('/api/transactions', (req, res) => {
  try {
    const { username, userFullName, userEmail, type, amount, asset, note, hashOrReference, proofUrl } = req.body;
    if (!username || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid username and numeric amount are required' });
    }

    const tx = addTransaction({
      username: username.trim(),
      userFullName,
      userEmail,
      type: type || 'DEPOSIT',
      amount: Number(amount),
      asset: asset || 'USDT',
      status: 'PENDING',
      note: note || `Client Deposit via ${asset || 'Crypto'}`,
      hashOrReference,
      proofUrl
    });

    // Notify support chat
    const store = loadStore();
    store.supportMessages.push({
      id: `dep-${Date.now()}`,
      sender: 'broker',
      text: `Broker Deposit Desk: A deposit of $${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} via ${asset || 'Crypto'} (Ref: ${tx.hashOrReference}) was submitted by @${username}. Status: Awaiting Admin Approval.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      userId: username,
      userName: 'Broker Payments Desk',
      isReadByAdmin: false
    });
    saveStore(store);

    res.json({ success: true, transaction: tx, message: 'Deposit submitted and queued for admin review' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to record transaction' });
  }
});

app.post('/api/transactions/approve', (req, res) => {
  try {
    const { id, note } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Transaction id or reference is required' });
    }

    const updated = updateTransactionStatus(id, 'COMPLETED', note || 'Deposit verified & approved by Broker Admin');
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // Add chat confirmation directly to the investor
    const store = loadStore();
    store.supportMessages.push({
      id: `appr-${Date.now()}`,
      sender: 'admin',
      text: `Official Broker Desk: Your deposit of $${Number(updated.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} has been approved by compliance and credited to your available balance!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      userId: updated.username,
      userName: 'Senior Broker Principal',
      isReadByAdmin: true
    });
    saveStore(store);

    const user = getStoredUser(updated.username);
    res.json({
      success: true,
      message: `Deposit of $${updated.amount} approved and credited to @${updated.username}!`,
      transaction: updated,
      newBalance: user?.accountBalance
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to approve transaction' });
  }
});

app.post('/api/transactions/reject', (req, res) => {
  try {
    const { id, note } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Transaction id or reference is required' });
    }

    const updated = updateTransactionStatus(id, 'REJECTED', note || 'Deposit declined by broker compliance');
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction rejected', transaction: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to reject transaction' });
  }
});

// 5. KYC Document Verification Desk
app.get('/api/kyc-submissions', (req, res) => {
  const subs = getAllKycSubmissions();
  res.json({ success: true, count: subs.length, submissions: subs });
});

app.post('/api/kyc-submit', (req, res) => {
  try {
    const { username, fullName, email, idType, docNumber, issueCountry, frontDocName, proofDocName } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }

    const sub = addKycSubmission({
      username: username.trim(),
      fullName: fullName || username,
      email: email || `${username.toLowerCase()}@primetrade.us.ci`,
      idType: idType || 'Passport',
      docNumber: docNumber || `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
      issueCountry: issueCountry || 'United States',
      frontDocName: frontDocName || 'identity_document.pdf',
      proofDocName: proofDocName || 'proof_of_address.pdf'
    });

    // Notify support chat
    const store = loadStore();
    store.supportMessages.push({
      id: `kyc-msg-${Date.now()}`,
      sender: 'broker',
      text: `Compliance Verification Desk: KYC documents for @${username} (${sub.idType} #${sub.docNumber}) have been uploaded and submitted for regulatory review.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      userId: username,
      userName: 'Compliance Desk',
      isReadByAdmin: false
    });
    saveStore(store);

    res.json({ success: true, submission: sub, message: 'KYC documents submitted for approval' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to submit KYC' });
  }
});

app.post('/api/kyc-review', (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || (status !== 'APPROVED' && status !== 'REJECTED')) {
      return res.status(400).json({ success: false, error: 'Valid id and status ("APPROVED" | "REJECTED") required' });
    }

    const reviewed = reviewKycSubmission(id, status);
    if (!reviewed) {
      return res.status(404).json({ success: false, error: 'KYC submission not found' });
    }

    // Add message to chat
    const store = loadStore();
    store.supportMessages.push({
      id: `kyc-rev-${Date.now()}`,
      sender: 'admin',
      text: `Broker Compliance Clearance: Your KYC identity verification has been ${status === 'APPROVED' ? 'APPROVED' : 'DECLINED'}. Status updated to: ${status === 'APPROVED' ? 'Tier 2 Institutional Verified' : 'Verification Rejected'}.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      userId: reviewed.username,
      userName: 'Chief Compliance Officer',
      isReadByAdmin: true
    });
    saveStore(store);

    const user = getStoredUser(reviewed.username);
    res.json({ success: true, submission: reviewed, user, message: `KYC status updated to ${status} for @${reviewed.username}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to review KYC' });
  }
});

// 4. Crypto Payment Methods
app.get('/api/crypto-methods', (req, res) => {
  const store = loadStore();
  res.json({ success: true, methods: store.cryptoPaymentMethods });
});

app.post('/api/crypto-methods', (req, res) => {
  const { action, method, id, updates } = req.body;
  const store = loadStore();

  if (action === 'add' && method) {
    const newMethod: StoredCryptoPaymentMethod = {
      ...method,
      id: method.id || `cpm-${Date.now()}`
    };
    store.cryptoPaymentMethods.push(newMethod);
  } else if (action === 'update' && id && updates) {
    store.cryptoPaymentMethods = store.cryptoPaymentMethods.map(m =>
      m.id === id ? { ...m, ...updates } : m
    );
  } else if (action === 'delete' && id) {
    store.cryptoPaymentMethods = store.cryptoPaymentMethods.filter(m => m.id !== id);
  } else if (action === 'toggle' && id) {
    store.cryptoPaymentMethods = store.cryptoPaymentMethods.map(m =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
  }

  saveStore(store);
  res.json({ success: true, methods: store.cryptoPaymentMethods });
});

// Market Cap cache & endpoint
interface MarketCapItem {
  symbol: string;
  name: string;
  category: 'stock' | 'crypto' | 'index' | 'commodity';
  price: number;
  change24h: number;
  marketCap: string;
  marketCapRaw: number;
  source: string;
}

let cachedMarketCaps: MarketCapItem[] = [];
let lastMarketCapFetchTime = 0;

function formatMarketCap(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  return `$${Math.round(val).toLocaleString()}`;
}

const STOCK_SHARES: Record<string, { name: string; shares: number; fallbackPrice: number; fallbackChange: number }> = {
  AAPL: { name: 'Apple Inc.', shares: 15.116e9, fallbackPrice: 232.50, fallbackChange: 0.85 },
  NVDA: { name: 'NVIDIA Corp.', shares: 24.56e9, fallbackPrice: 142.85, fallbackChange: 4.22 },
  MSFT: { name: 'Microsoft Corp.', shares: 7.43e9, fallbackPrice: 428.10, fallbackChange: 0.41 },
  GOOGL: { name: 'Alphabet Inc.', shares: 12.35e9, fallbackPrice: 168.30, fallbackChange: 1.12 },
  AMZN: { name: 'Amazon.com Inc.', shares: 10.45e9, fallbackPrice: 191.20, fallbackChange: 1.40 },
  META: { name: 'Meta Platforms', shares: 2.54e9, fallbackPrice: 584.20, fallbackChange: 0.82 },
  TSLA: { name: 'Tesla, Inc.', shares: 3.19e9, fallbackPrice: 218.40, fallbackChange: -1.95 },
};

async function updateMarketCaps(): Promise<MarketCapItem[]> {
  const items: MarketCapItem[] = [];

  // 1. Fetch real stock prices from Yahoo Finance chart API
  for (const [symbol, info] of Object.entries(STOCK_SHARES)) {
    let price = info.fallbackPrice;
    let change24h = info.fallbackChange;
    try {
      const res = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (res.ok) {
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          price = Number(meta.regularMarketPrice.toFixed(2));
          change24h = Number((meta.regularMarketChangePercent || 0).toFixed(2));
        }
      }
    } catch {
      // Use fallback
    }
    const capRaw = price * info.shares;
    items.push({
      symbol,
      name: info.name,
      category: 'stock',
      price,
      change24h,
      marketCap: formatMarketCap(capRaw),
      marketCapRaw: capRaw,
      source: 'Yahoo Finance'
    });
  }

  // 2. Fetch real Crypto from Binance
  const cryptoDefs = [
    { symbol: 'BTC', name: 'Bitcoin', binance: 'BTCUSDT', supply: 19.78e6, fallbackPrice: 81400, fallbackChange: 3.4 },
    { symbol: 'ETH', name: 'Ethereum', binance: 'ETHUSDT', supply: 120.4e6, fallbackPrice: 2389, fallbackChange: -1.1 },
    { symbol: 'SOL', name: 'Solana', binance: 'SOLUSDT', supply: 468.5e6, fallbackPrice: 184.6, fallbackChange: 5.8 },
  ];

  let btcCap = 1.61e12;
  for (const c of cryptoDefs) {
    let price = c.fallbackPrice;
    let change24h = c.fallbackChange;
    try {
      const bRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${c.binance}`);
      if (bRes.ok) {
        const bData = await bRes.json();
        price = parseFloat(bData.lastPrice);
        change24h = parseFloat(Number(bData.priceChangePercent).toFixed(2));
      }
    } catch {
      // fallback
    }
    const capRaw = price * c.supply;
    if (c.symbol === 'BTC') btcCap = capRaw;

    items.push({
      symbol: c.symbol,
      name: c.name,
      category: 'crypto',
      price,
      change24h,
      marketCap: formatMarketCap(capRaw),
      marketCapRaw: capRaw,
      source: 'Binance Live'
    });
  }

  // 3. Macro & Index benchmarks (Yahoo Finance style)
  const totalCryptoCap = btcCap / 0.58;
  items.unshift({
    symbol: 'TOTAL CRYPTO',
    name: 'Global Crypto MCap',
    category: 'index',
    price: totalCryptoCap,
    change24h: 2.15,
    marketCap: formatMarketCap(totalCryptoCap),
    marketCapRaw: totalCryptoCap,
    source: 'CoinGecko / Yahoo Finance'
  });

  items.splice(2, 0, {
    symbol: 'S&P 500',
    name: 'S&P 500 Market Cap',
    category: 'index',
    price: 5860.50,
    change24h: 0.55,
    marketCap: '$48.20T',
    marketCapRaw: 48.2e12,
    source: 'Yahoo Finance'
  });

  items.push({
    symbol: 'XAU/GOLD',
    name: 'Gold Spot Bullion',
    category: 'commodity',
    price: 2736.50,
    change24h: 1.35,
    marketCap: '$17.80T',
    marketCapRaw: 17.8e12,
    source: 'LBMA / Yahoo Finance'
  });

  return items;
}

app.get('/api/market-caps', async (req, res) => {
  const now = Date.now();
  // Cache for 30 seconds
  if (cachedMarketCaps.length > 0 && now - lastMarketCapFetchTime < 30000) {
    return res.json({ success: true, data: cachedMarketCaps, cached: true });
  }

  try {
    const freshData = await updateMarketCaps();
    cachedMarketCaps = freshData;
    lastMarketCapFetchTime = now;
    return res.json({ success: true, data: freshData, cached: false });
  } catch (err: any) {
    if (cachedMarketCaps.length > 0) {
      return res.json({ success: true, data: cachedMarketCaps, cached: true, error: err.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to generate market caps' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dev vs Prod Vite mounting
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Blue Edge Market server running on port ${PORT}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
