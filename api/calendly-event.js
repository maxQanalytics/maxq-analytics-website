const crypto = require('crypto');

// GTM Asset record IDs (Airtable > Maxq Analytics base > GTM Assets table)
const ADDON_RECORDS = {
  'upsell-calculator': 'recHqlKE23xal0Ftw',
  'deal-expander':     'receXZmoT6rkZsD4E',
  'quality-guardian':  'recK0xnWqXYQy0l5E',
  'firefighter':       'recMsyuFZ274RVMYo',
  'okr-tracker':       'recUugZ3YnXqUak0Y',
};

const AIRTABLE_URL = 'https://api.airtable.com/v0/appF0pxDtxF1fVm6O/tbljccwTddUb1F2Ia';

function verifySignature(rawBody, signatureHeader, secret) {
  const parts = {};
  signatureHeader.split(',').forEach(function (part) {
    const eq = part.indexOf('=');
    if (eq > -1) parts[part.slice(0, eq)] = part.slice(eq + 1);
  });
  if (!parts.t || !parts.v1) return false;
  const signed = parts.t + '.' + rawBody;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(parts.v1, 'hex'), Buffer.from(expected, 'hex'));
  } catch (e) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Collect raw body (needed for signature verification)
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const rawBody = Buffer.concat(chunks).toString('utf8');

  // Verify Calendly webhook signature
  const sigHeader = req.headers['calendly-webhook-signature'];
  const secret = process.env.CALENDLY_WEBHOOK_SECRET;
  if (!sigHeader || !secret || !verifySignature(rawBody, sigHeader, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { event, payload } = body;

  // Only handle new bookings
  if (event !== 'invitee.created') {
    return res.status(200).json({ ok: true, skipped: true });
  }

  // Identify which add-on page triggered this booking
  const utmContent = (payload.tracking && payload.tracking.utm_content) || '';
  const assetRecordId = ADDON_RECORDS[utmContent];

  if (!assetRecordId) {
    // Booking came from a non-add-on page — skip silently
    return res.status(200).json({ ok: true, skipped: 'no record for: ' + utmContent });
  }

  const name      = payload.name  || 'Unknown';
  const email     = payload.email || '';
  const startTime = (payload.scheduled_event && payload.scheduled_event.start_time) || '';
  const eventDate = startTime ? startTime.split('T')[0] : new Date().toISOString().split('T')[0];
  const comment   = [
    'Name: '    + name,
    'Email: '   + email,
    startTime ? 'Scheduled: ' + startTime : '',
    'Add-on: '  + utmContent,
  ].filter(Boolean).join('\n');

  const response = await fetch(AIRTABLE_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.AIRTABLE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        'GTM Assets':               [{ id: assetRecordId }],
        'GTM Asset Event Date':      eventDate,
        'GTM Asset Event Category':  'CTA - Schedule call',
        'GTM Asset Events comments': comment,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Airtable write failed:', err);
    return res.status(500).json({ error: 'Airtable write failed' });
  }

  return res.status(200).json({ ok: true, recorded: utmContent });
};
