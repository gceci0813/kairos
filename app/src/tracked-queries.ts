// Standing list of election/political topics ingested daily by the
// ingest-tracked cron. Override with the TRACKED_QUERIES env var (a
// comma-separated list) without redeploying.

const DEFAULT_TRACKED_QUERIES = [
  // United States
  'US presidential election',
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
  // Middle East & Africa
  'Israeli election',
  'Turkish election',
  'Nigerian election',
  'South African election',
  // Asia-Pacific
  'Indian election',
  'Japanese election',
  'South Korean election',
  'Australian federal election',
  // Americas
  'Canadian federal election',
  'Brazilian election',
  'Mexican election',
  'Argentine election',
];

export function getTrackedQueries(): string[] {
  const override = (process.env.TRACKED_QUERIES ?? '').trim();
  if (override) {
    return override.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return DEFAULT_TRACKED_QUERIES;
}
