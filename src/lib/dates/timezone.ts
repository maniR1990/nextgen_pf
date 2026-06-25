import { DateTime } from 'luxon';

/**
 * Timezone helpers — use when server/client need consistent zoned instants.
 * Prefer date-fns/dayjs for display; luxon for IANA zone conversion.
 */
export function toZonedIso(iso: string, zone: string): string {
  return DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone).toISO() ?? iso;
}

export function formatInTimeZone(
  iso: string,
  zone: string,
  format = 'MMM d, yyyy h:mm a z',
): string {
  return DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone).toFormat(format);
}
