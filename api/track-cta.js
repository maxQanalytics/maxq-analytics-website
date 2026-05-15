const ADDON_RECORDS = {
  'upsell-calculator': 'recHqlKE23xal0Ftw',
  'deal-expander':     'receXZmoT6rkZsD4E',
  'quality-guardian':  'recK0xnWqXYQy0l5E',
  'firefighter':       'recMsyuFZ274RVMYo',
  'okr-tracker':       'recUugZ3YnXqUak0Y',
};

const AIRTABLE_URL = 'https://api.airtable.com/v0/appF0pxDtxF1fVm6O/tbljccwTddUb1F2Ia';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { addon, page, btnText } = req.body || {};
  const assetRecordId = ADDON_RECORDS[addon];
  if (!assetRecordId) return res.status(200).json({ ok: true, skipped: true });

  const now   = new Date();
  const today = now.toISOString().split('T')[0];
  const time  = now.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
  const comment = `CTA clicked: Schedule a call\nButton: ${btnText || 'unknown'}\nAdd-on: ${addon}\nPage: ${page || 'unknown'}\nClicked at: ${time}`;

  const airtableRes = await fetch(AIRTABLE_URL, {
    method: 'POST',
    headers: {
      Authorization:  'Bearer ' + process.env.AIRTABLE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        'GTM Assets':                [assetRecordId],
        'GTM Asset Event Date':       today,
        'GTM Asset Event Category':   'CTA - Schedule call',
        'GTM Asset Events comments':  comment,
      },
    }),
  });

  if (!airtableRes.ok) {
    console.error('Airtable error:', await airtableRes.text());
    return res.status(500).json({ error: 'Airtable write failed' });
  }

  return res.status(200).json({ ok: true, recorded: addon });
}
