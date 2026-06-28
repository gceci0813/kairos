// Standing list of election/political topics ingested daily by the
// ingest-tracked cron. Override with the TRACKED_QUERIES env var (a
// comma-separated list) without redeploying.

const DEFAULT_TRACKED_QUERIES = [
  // United States
  'US presidential election',
  'US midterm election',
  'US Senate election',
  'US House election',
  'US governor election',
  'Republican primary election',
  'Democratic primary election',
  // Europe
  'UK general election',
  'European Parliament election',
  'German federal election',
  'French election',
  'Italian election',
  'Polish election',
  'Spanish election',
  'Dutch election',
  'Swedish election',
  'Greek election',
  'Portuguese election',
  'Hungarian election',
  'Romanian election',
  'Ukrainian election',
  'Russian election',
  'Georgian election',
  // Middle East & North Africa
  'Israeli election',
  'Turkish election',
  'Iranian election',
  'Egyptian election',
  'Iraqi election',
  'Tunisian election',
  // Sub-Saharan Africa
  'Nigerian election',
  'South African election',
  'Kenyan election',
  'Ghanaian election',
  'Ethiopian election',
  // Asia-Pacific
  'Indian election',
  'Pakistani election',
  'Bangladeshi election',
  'Indonesian election',
  'Japanese election',
  'South Korean election',
  'Taiwanese election',
  'Philippine election',
  'Thai election',
  'Malaysian election',
  'Australian federal election',
  // Americas
  'Canadian federal election',
  'Brazilian election',
  'Mexican election',
  'Argentine election',
  'Colombian election',
  'Chilean election',
  'Venezuelan election',
  'Peruvian election',
];

export function getTrackedQueries(): string[] {
  const override = (process.env.TRACKED_QUERIES ?? '').trim();
  if (override) {
    return override.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return DEFAULT_TRACKED_QUERIES;
}
