/**
 * Day keys for everything that resets "each day": the streak, the daily bonus
 * and the mini-game ceiling.
 *
 * These must follow the pupil's clock, not UTC. toISOString() gives the UTC
 * date, and in Sweden that flips at 01:00 in winter and 02:00 in summer — so a
 * pupil playing at half past midnight and again at breakfast counted as two
 * days, while the "new day" for the bonus arrived an hour or two after the
 * real one.
 */

/** YYYY-MM-DD in the device's local time zone. */
export function localDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The local day key for the calendar day before `date`. */
export function previousLocalDayKey(date: Date = new Date()): string {
  const prev = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return localDayKey(prev);
}
