// Rebrand edition of 2026-10-10: the whole site rebuilt in the Axiom-inspired
// style (docs/design-inspiration.md), served under one unlisted prefix so it
// can be reviewed next to the live site. Every page of the edition lives in
// src/pages/<BASE>/ and links only inside BASE.
export const BASE = '/rebrand-2026-10-10-amber-wren-reef';
export const EDITION_DATE = '2026-10-10';

export const CALENDLY = 'https://calendly.com/philip-boontje';

// Prefix an internal path with the edition base: link('/team') -> BASE + '/team'
export const link = (path = '/') => (path === '/' ? BASE + '/' : BASE + path);

export const NAV = [
  { label: 'Team', href: '/team' },
  { label: 'Partners', href: '/partners' },
  { label: 'Pricing', href: '/pricing' },
];

export const ADD_ONS = [
  { group: 'Ask', label: 'Analytics Assistant', href: '/add-ons/analytics-assistant' },
  { group: 'Protect', label: 'Quality Guardian', href: '/add-ons/quality-guardian' },
];

// Client logos for the swapping logo grid (same set and order as the live homepage)
export const CLIENTS = [
  { src: '/logos/delta.png', alt: 'Delta Safety Training', href: 'https://www.deltasafetytraining.nl', h: 28 },
  { src: '/logos/clubcollect.png', alt: 'ClubCollect', href: 'https://www.clubcollect.com', h: 22 },
  { src: '/logos/ciphix.png', alt: 'Ciphix', href: 'https://www.ciphix.com', h: 22 },
  { src: '/logos/freeday.svg', alt: 'Freeday', href: 'https://www.freeday.ai', h: 28 },
  { src: '/logos/cjob.png', alt: 'C-Job Naval Architects', href: 'https://c-job.com', h: 28 },
  { src: '/logos/rebelsai.png', alt: 'RebelsAI', href: 'https://www.rebelsai.nl', h: 28 },
  { src: '/twelve-logo.svg', alt: 'Twelve', href: 'https://www.twelve.eu', h: 22 },
  { src: '/logos/wijngaard-kaas-shield.svg', alt: 'Wijngaard Kaas', href: 'https://www.wijngaardkaas.nl/nl_NL/', h: 40 },
  { src: '/logos/twizzit.png', alt: 'Twizzit', href: 'https://www.twizzit.com/nl-be/', h: 26 },
];
