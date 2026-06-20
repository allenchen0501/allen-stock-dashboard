import type {
  DataFreshness,
  DataQualityRecordInput,
  DataSourceType,
} from "./types";

export const DATA_QUALITY_TIME_ZONE = "Asia/Taipei";

export const DATA_SOURCE_TYPES = [
  "official_exchange",
  "market_api",
  "financial_platform",
  "broker",
  "manual",
  "calculated",
  "model",
] as const satisfies readonly DataSourceType[];

export const DATA_QUALITY_THRESHOLDS = {
  priceDifferenceRatio: 0.01,
  volumeDifferenceRatio: 0.05,
  quoteMaxAgeMinutes: 30,
  futureToleranceMinutes: 5,
} as const;

export const DATA_SOURCE_PRIORITY = {
  taiwanEquity: [
    "TWSE / TPEx official",
    "Yahoo Finance",
    "CMoney / Goodinfo / broker",
  ],
  usAndGlobal: [
    "Yahoo Finance",
    "Nasdaq / official exchange",
    "other financial source",
  ],
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const RECORD_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const RECORD_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?$/;

function dateParts(value: string): [number, number, number] | null {
  if (!RECORD_DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return [year, month, day];
}

function dateOrdinal(value: string): number | null {
  const parts = dateParts(value);
  return parts ? Date.UTC(parts[0], parts[1] - 1, parts[2]) : null;
}

export function getTaipeiDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DATA_QUALITY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isValidRecordDate(recordDate?: string): recordDate is string {
  return typeof recordDate === "string" && dateParts(recordDate) !== null;
}

export function isValidRecordTime(recordTime?: string): recordTime is string {
  return typeof recordTime === "string" && RECORD_TIME_PATTERN.test(recordTime);
}

export function isDataSourceType(value: unknown): value is DataSourceType {
  return (
    typeof value === "string" &&
    (DATA_SOURCE_TYPES as readonly string[]).includes(value)
  );
}

export function toTaipeiTimestamp(
  recordDate?: string,
  recordTime?: string,
): Date | null {
  if (!isValidRecordDate(recordDate) || !isValidRecordTime(recordTime)) return null;
  const normalizedTime = recordTime.length === 5 ? `${recordTime}:00` : recordTime;
  const timestamp = new Date(`${recordDate}T${normalizedTime}+08:00`);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

export function isTodayData(recordDate?: string, now = new Date()): boolean {
  return isValidRecordDate(recordDate) && recordDate === getTaipeiDate(now);
}

export function isThisWeekData(recordDate?: string, now = new Date()): boolean {
  if (!isValidRecordDate(recordDate)) return false;
  const todayOrdinal = dateOrdinal(getTaipeiDate(now));
  const recordOrdinal = dateOrdinal(recordDate);
  if (todayOrdinal === null || recordOrdinal === null) return false;

  const dayOfWeek = new Date(todayOrdinal).getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const weekStart = todayOrdinal - daysSinceMonday * DAY_MS;
  return recordOrdinal >= weekStart && recordOrdinal < weekStart + 7 * DAY_MS;
}

export function isHistoricalData(recordDate?: string, now = new Date()): boolean {
  if (!isValidRecordDate(recordDate)) return false;
  const todayOrdinal = dateOrdinal(getTaipeiDate(now));
  const recordOrdinal = dateOrdinal(recordDate);
  return todayOrdinal !== null && recordOrdinal !== null && recordOrdinal < todayOrdinal;
}

export function classifyDataFreshness(
  recordDate?: string,
  now = new Date(),
): DataFreshness {
  if (!isValidRecordDate(recordDate)) return "unknown";
  const todayOrdinal = dateOrdinal(getTaipeiDate(now));
  const recordOrdinal = dateOrdinal(recordDate);
  if (todayOrdinal === null || recordOrdinal === null) return "unknown";
  if (recordOrdinal > todayOrdinal) return "future";
  if (recordOrdinal === todayOrdinal) return "today";
  if (isThisWeekData(recordDate, now)) return "this_week";
  return "historical";
}

export function hasValidModelInferenceFlag(
  record: DataQualityRecordInput,
): boolean {
  return record.source_type !== "model" || record.is_model_inference === true;
}
