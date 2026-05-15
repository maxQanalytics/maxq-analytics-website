// Called client-side when Calendly fires 'calendly.event_scheduled' postMessage.
// Receives the add-on slug and writes a GTM Asset Event to Airtable.

const ADDON_RECORDS = {
  'upsell-calculator': 'recHqlKE23xal0Ftw',
  'deal-expander':     'receXZmoT6rkZsD4E',
  'quality-guardian':  'recK0xnWqXYQy0l5E',
  'firefighter':       'recMsyuFZ274RVMYo',
  'okr-tracker':       'recUugZ3YnXqUak0Y',
};

const AIRTABLE_URL = 'https://api.airtable.com/v0/appF0pxDtxF1fVm6O/tbljccwTddUb1F2Ia';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const assetRecordId = ADDON_RECORDS[body.addon];
  if (!assetRecordId) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const today = new Date().toISOString().split('T')[0];

  const response = await fetch(AIRTABLE_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.AIRTABLE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        'GTM Assets':               [{ id: assetRecordId }],
        'GTM Asset Event Date':      today,
        'GTM Asset Event Category':  'CTA - Schedule call',
        'GTM Asset Events comments': 'Booking via add-on page: ' + body.addon,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Airtable error:', err);
    return res.status(500).json({ error: 'Airtable write failed' });
  }

  return res.status(200).json({ ok: true, recorded: body.addon });
};
