// Site-wide SEO settings and the per-page descriptions. Keyed by pathname with
// a trailing slash, which is how the static build and the sitemap write URLs.
// A page can still override its description through the Layout prop.

export const SITE_URL = 'https://www.maxqanalytics.io';
export const SITE_NAME = 'Maxq Analytics';
export const DEFAULT_DESCRIPTION =
  'Agentic analytics on all your data. The open source Semantic Nexus gives your business one source of truth, from raw data to company-wide agentic workflows.';
// One plain statement of who Maxq is, for people and for search engines and
// language models alike. Used as the Organisation description (not shown on
// any page); keep the wording identical on LinkedIn, GitHub and YouTube.
export const ABOUT_SENTENCES = [
  'Maxq Analytics is a data analytics consultancy in De Bilt, Netherlands.',
  'It designs, runs and maintains open-source analytics stacks built on Airbyte, dbt and Cube for scale-ups and mid-sized companies, so finance, sales and operations work from one set of metrics.',
  'Its reference architecture is the Semantic Nexus.',
];
export const ABOUT = ABOUT_SENTENCES.join(' ');
export const SHARE_IMAGE = '/og/maxq-analytics.png';   // 1200 x 630, rendered by scripts/render-share-image.sh
export const LOGO_IMAGE = '/og/maxq-analytics-logo-512.png';

export const DESCRIPTIONS = {
  '/': DEFAULT_DESCRIPTION,
  '/add-ons/':
    'Optional modules that plug directly into the Semantic Nexus. Each one solves a specific high-value problem, built on the same single source of truth.',
  '/add-ons/analytics-assistant/':
    'An AI analyst for your whole company. Ask a question in Slack, a chat window or Claude and get an accurate, chart-backed answer in seconds.',
  '/add-ons/quality-guardian/':
    'An AI agent that picks up every failed data-entry test, investigates the record, fixes it at the source when sure, and routes the rest to the test owner.',
  '/partners/':
    'A select group of platforms, investors and specialists who share our standards for data quality and metric driven governance.',
  '/pricing/':
    'The Semantic Nexus is an open architecture. We charge implementation sprints for the tooling you select, then an operations fee to maintain the stack.',
  '/team/':
    'Our guild combines data engineering, financial operations and software development, across the full data stack from extraction to semantic layer.',
  '/privacy-policy/':
    'How Maxq Analytics handles personal data on this website and in its services.',
  '/terms-of-service/':
    'The terms under which Maxq Analytics provides this website and its services.',
  '/add-ons/deal-expander/':
    'Delivers daily and weekly opportunity lists in your Slack channel, surfacing upsell and cross-sell signals before clients bring the conversation to you.',
  '/add-ons/enterprise-valuator/':
    'A periodic business valuation report built on the metrics inside your Semantic Nexus. Live operational data drives a defensible valuation at any point in time.',
  '/add-ons/firefighter/':
    'Tracks the metrics that signal a client is drifting toward churn or has stopped using a feature, and raises a flag before the situation becomes irreversible.',
  '/add-ons/metricsrouter/':
    'An open metrics exchange that lets you decide which metrics to share with investors, partners or regulators, through standardised, auditable exchange contracts.',
  '/add-ons/upsell-calculator/':
    'Pick a client and instantly see what they would pay under each of your pricing plans, based on their last twelve months of actual usage.',
  '/add-ons/weekly-okr-tracker/':
    'A bespoke report template that standardises how your team sets, tracks and reviews OKRs each week, with live metrics, progress charts and annotated context.',
};

// Pages that are live but reachable only by their URL (not in the nav or
// footer). They stay indexable but are left out of the sitemap.
export const UNLISTED_PATHS = [
  '/add-ons/deal-expander/',
  '/add-ons/enterprise-valuator/',
  '/add-ons/firefighter/',
  '/add-ons/metricsrouter/',
  '/add-ons/upsell-calculator/',
  '/add-ons/weekly-okr-tracker/',
];

// Preview editions: /add-ons/<slug>-YYYY-MM-DD-word-word-word and homepage
// editions /home-YYYY-MM-DD-word-word-word
export const PREVIEW_EDITION = /^\/(add-ons\/[a-z-]+|home)-\d{4}-\d{2}-\d{2}-[a-z]+-[a-z]+-[a-z]+\/?$/;

export const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': SITE_URL + '/#organization',
  name: SITE_NAME,
  alternateName: 'Maxq',
  legalName: 'MAXQ Analytics B.V.',
  url: SITE_URL + '/',
  logo: SITE_URL + LOGO_IMAGE,
  description: ABOUT,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'De Holle Bilt 25',
    postalCode: '3732 HM',
    addressLocality: 'De Bilt',
    addressCountry: 'NL',
  },
  areaServed: ['Netherlands', 'Belgium', 'Europe'],
  founder: {
    '@type': 'Person',
    name: 'Philip Boontje',
    jobTitle: 'Founder and Guild Lead',
    sameAs: 'https://www.linkedin.com/in/philipboontje',
  },
  vatID: 'NL867198461B01',
  identifier: {
    '@type': 'PropertyValue',
    propertyID: 'KvK',
    name: 'Dutch Chamber of Commerce number',
    value: '95597166',
  },
  knowsAbout: [
    'Data analytics consulting',
    'Semantic layer (Cube)',
    'dbt data transformation',
    'Airbyte data integration',
    'Snowflake, BigQuery and ClickHouse data warehouses',
    'Model Context Protocol (MCP) servers',
    'Agentic analytics and AI data agents',
    'Data quality testing',
    'Financial and operational KPI reporting',
  ],
  sameAs: [
    'https://www.linkedin.com/company/maxq-analytics/',
    'https://www.youtube.com/@maxq-analytics',
    'https://github.com/maxQanalytics',
  ],
};
