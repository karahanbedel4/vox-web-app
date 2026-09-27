import nodemailer, { Transporter } from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { DeduplicationResult, generateDailyDigestHtml } from './lib/newsletterDigest';

export interface SubscriberRecord {
  email: string;
  subscribedAt: string;
  isActive: boolean;
  frequency: 'daily';
  lastSentAt?: string;
  source?: string;
}

const SUBSCRIBERS_FILE = path.join(process.cwd(), 'data', 'newsletter_subscribers.json');

// Ensure data folder exists
try {
  const dir = path.dirname(SUBSCRIBERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (e) {}

// Load subscribers from file
export function loadSubscribers(): SubscriberRecord[] {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const content = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn('Error reading subscribers file:', e);
  }
  return [];
}

// Save subscribers to file
export function saveSubscribers(subscribers: SubscriberRecord[]): void {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving subscribers file:', e);
  }
}

// Subscribe email
export function addSubscriber(email: string, source: string = 'web'): { success: boolean; isNew: boolean } {
  const clean = email.trim().toLowerCase();
  const list = loadSubscribers();
  const existing = list.find(s => s.email === clean);

  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.subscribedAt = new Date().toISOString();
      saveSubscribers(list);
      return { success: true, isNew: false };
    }
    return { success: true, isNew: false };
  }

  list.push({
    email: clean,
    subscribedAt: new Date().toISOString(),
    isActive: true,
    frequency: 'daily',
    source
  });
  saveSubscribers(list);
  return { success: true, isNew: true };
}

// Unsubscribe email
export function removeSubscriber(email: string): boolean {
  const clean = email.trim().toLowerCase();
  const list = loadSubscribers();
  const item = list.find(s => s.email === clean);
  if (item) {
    item.isActive = false;
    saveSubscribers(list);
    return true;
  }
  return false;
}

let cachedTransporter: Transporter | null = null;

// Get or initialize Nodemailer transporter
export async function getEmailTransporter(): Promise<{ transporter: Transporter; isSimulated: boolean }> {
  if (cachedTransporter) {
    return { transporter: cachedTransporter, isSimulated: false };
  }

  // 1. Check custom SMTP environment variables
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    console.log(`[EmailService] Using configured SMTP host: ${host}:${port}`);
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
    return { transporter: cachedTransporter, isSimulated: false };
  }

  // 2. Check standard Gmail credentials
  if (user && pass) {
    console.log(`[EmailService] Using Gmail SMTP transport for user: ${user}`);
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
    return { transporter: cachedTransporter, isSimulated: false };
  }

  // 3. Fallback: Ethereal test account or local simulation
  console.log('[EmailService] No SMTP environment variables detected. Initializing Ethereal test mailer...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    return { transporter: cachedTransporter, isSimulated: true };
  } catch (err) {
    console.warn('[EmailService] Ethereal creation failed, using json logger transporter:', err);
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return { transporter: cachedTransporter, isSimulated: true };
  }
}

let lastSentDigestLog: {
  sentAt: string;
  recipientCount: number;
  recipients: string[];
  subject: string;
  previewUrl?: string | false;
  totalScanned: number;
  selectedCount: number;
} | null = null;

export function getLastSentDigestLog() {
  return lastSentDigestLog;
}

/**
 * Sends Daily Deduplicated Digest Email
 */
export async function sendNewsletterDailyDigest(
  recipients: string[],
  digestData: DeduplicationResult,
  baseUrl: string = 'https://voxozet.com'
): Promise<{
  success: boolean;
  sentCount: number;
  previewUrl?: string | false;
  messageId?: string;
  error?: string;
}> {
  if (recipients.length === 0) {
    return { success: false, sentCount: 0, error: 'Alıcı listesi boş.' };
  }

  try {
    const { transporter, isSimulated } = await getEmailTransporter();
    const fromAddress = process.env.SMTP_FROM || '"VOX Günlük Bülten" <bulten@voxozet.com>';

    const { subject, html } = generateDailyDigestHtml(digestData, {
      baseUrl,
      dateStr: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipients.join(', '),
      subject,
      html
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EmailService] Newsletter sent to ${recipients.length} recipients. MessageId: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[EmailService] Preview URL (Ethereal): ${previewUrl}`);
    }

    lastSentDigestLog = {
      sentAt: new Date().toISOString(),
      recipientCount: recipients.length,
      recipients,
      subject,
      previewUrl,
      totalScanned: digestData.totalScannedCount,
      selectedCount: digestData.top10Articles.length
    };

    // Update lastSentAt on subscribers
    const list = loadSubscribers();
    const recipientSet = new Set(recipients.map(r => r.toLowerCase()));
    list.forEach(s => {
      if (recipientSet.has(s.email.toLowerCase())) {
        s.lastSentAt = new Date().toISOString();
      }
    });
    saveSubscribers(list);

    return {
      success: true,
      sentCount: recipients.length,
      previewUrl,
      messageId: info.messageId
    };
  } catch (err: any) {
    console.error('[EmailService] Error sending newsletter digest:', err);
    return {
      success: false,
      sentCount: 0,
      error: err?.message || 'E-posta gönderilirken bir hata oluştu.'
    };
  }
}
