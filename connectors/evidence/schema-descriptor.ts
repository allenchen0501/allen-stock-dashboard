import { createRuntimeSchemaHash } from "./runtime-evidence-recorder";
import type {
  CanonicalQuoteField,
  OfficialSchemaAliasContract,
} from "./schema-alias-contract";

export type SchemaDescriptorFieldType =
  | "array"
  | "boolean"
  | "mixed"
  | "null"
  | "number"
  | "object"
  | "string"
  | "unknown";

/**
 * A value-free description of one payload field. It is safe to print because
 * it never contains the payload value itself.
 */
export interface SchemaDescriptorField {
  readonly field_name: string;
  readonly field_type: SchemaDescriptorFieldType;
  readonly is_present: boolean;
  readonly matched_alias: CanonicalQuoteField | null;
  readonly schema_hash: string | null;
}

type PayloadRow = Record<string, unknown>;

function isPayloadRow(value: unknown): value is PayloadRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function payloadRows(payload: unknown): PayloadRow[] {
  if (Array.isArray(payload)) return payload.filter(isPayloadRow);
  if (!isPayloadRow(payload)) return [];

  for (const wrapper of ["data", "result", "records"] as const) {
    const wrapped = payload[wrapper];
    if (Array.isArray(wrapped)) return wrapped.filter(isPayloadRow);
  }

  return [payload];
}

function fieldType(value: unknown): SchemaDescriptorFieldType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  return "unknown";
}

function combinedFieldType(
  rows: readonly PayloadRow[],
  fieldName: string,
): SchemaDescriptorFieldType {
  const types = new Set<SchemaDescriptorFieldType>();
  for (const row of rows) {
    if (Object.prototype.hasOwnProperty.call(row, fieldName)) {
      types.add(fieldType(row[fieldName]));
    }
  }
  if (types.size === 0) return "unknown";
  if (types.size > 1) return "mixed";
  return [...types][0];
}

function aliasTargets(
  contract: OfficialSchemaAliasContract,
): ReadonlyMap<string, ReadonlySet<CanonicalQuoteField>> {
  const targets = new Map<string, Set<CanonicalQuoteField>>();
  for (const field of contract.fields) {
    for (const candidate of field.aliases) {
      const fields = targets.get(candidate.alias) ?? new Set<CanonicalQuoteField>();
      fields.add(field.canonical_field);
      targets.set(candidate.alias, fields);
    }
  }
  return targets;
}

function matchedCanonicalField(
  targets: ReadonlyMap<string, ReadonlySet<CanonicalQuoteField>>,
  fieldName: string,
): CanonicalQuoteField | null {
  const matches = targets.get(fieldName);
  if (!matches || matches.size !== 1) return null;
  return [...matches][0];
}

/**
 * Produces field names and types only. Raw payload values are inspected in
 * memory for their types but are never returned or persisted.
 */
export function createSchemaDescriptor(
  payload: unknown,
  contract: OfficialSchemaAliasContract,
): SchemaDescriptorField[] {
  const rows = payloadRows(payload);
  const schemaHash = createRuntimeSchemaHash(payload);
  const targets = aliasTargets(contract);
  const presentNames = new Set(rows.flatMap((row) => Object.keys(row)));
  const expectedNames = new Set(targets.keys());
  const allNames = [...new Set([...presentNames, ...expectedNames])].sort(
    (left, right) => left.localeCompare(right),
  );

  return allNames.map((fieldName) => ({
    field_name: fieldName,
    field_type: presentNames.has(fieldName)
      ? combinedFieldType(rows, fieldName)
      : "unknown",
    is_present: presentNames.has(fieldName),
    matched_alias: matchedCanonicalField(targets, fieldName),
    schema_hash: schemaHash,
  }));
}

export function matchedRecordTimeAliases(
  descriptor: readonly SchemaDescriptorField[],
): string[] {
  return descriptor
    .filter(
      (field) => field.is_present && field.matched_alias === "record_time",
    )
    .map((field) => field.field_name);
}
