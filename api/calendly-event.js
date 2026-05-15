// Receives a Calendly booking event from the browser postMessage listener,
// fetches full invitee + event details from the Calendly API,
// then writes a GTM Asset Event record to Airtable.

const ADDON_RECORDS = {
  'upsell-calculator': 'recHqlKE23xal0Ftw',
  'deal-expander':     'receXZmoT6rkZsD4E',
  'quality-guardian':  'recK0xnWqXYQy0l5E',
  'firefighter':       'recMsyuFZ274RVMYo',
  'okr-tracker':       'recUugZ3YnXqUak0Y',
};

const AIRTABLE_URL = 'https://api.airtable.com/v0/appF0pxDtxF1fVm6O/tbljccwTddUb1F2Ia';

async function calendlyGet(uri) {
  const res = await fetch(uri, {
    headers: { 'Authorization': 'Bearer ' + process.env.CALENDLY_API_TOKEN },
  });
  if (!res.ok) throw new Error('Calendly API ' + res.status + ' for ' + uri);
  return res.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Vercel auto-parses JSON bodies into req.body
  const { addon, eventUri, inviteeUri } = req.body || {};

  const assetRecordId = ADDON_RECORDS[addon];
  if (!assetRecordId) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  // Fetch invitee and event details from Calendly in parallel
  let invitee = {}, event = {};
  try {
    const [inviteeData, eventData] = await Promise.all([
      calendlyGet(inviteeUri),
      calendlyGet(eventUri),
    ]);
    invitee = inviteeData.resource || {};
    event   = eventData.resource   || {};
  } catch (err) {
    console.error('Calendly fetch error:', err.message);
  }

  const name      = invitee.name  || '';
  const email     = invitee.email || '';
  const startTime = event.start_time || '';
  const eventDate = startTime ? startTime.split('T')[0] : new Date().toISOString().split('T')[0];
  const notes     = (invitee.questions_and_answers || [])
    .map(function (qa) { return qa.question + ':\n' + qa.answer; })
    .join('\n\n');

  const comment = [
    name      ? 'Name: '      + name      : '',
    email     ? 'Email: '     + email     : '',
    startTime ? 'Scheduled: ' + startTime : '',
    notes     ? 'Notes:\n'    + notes     : '',
    'Add-on: ' + addon,
  ].filter(Boolean).join('\n');

  const airtableRes = await fetch(AIRTABLE_URL, {
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

  if (!airtableRes.ok) {
    const err = await airtableRes.text();
    console.error('Airtable error:', err);
    return res.status(500).json({ error: 'Airtable write failed' });
  }

  return res.status(200).json({ ok: true, recorded: addon, name, email });
};
