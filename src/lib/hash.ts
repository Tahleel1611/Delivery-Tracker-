import { createHash } from 'node:crypto';

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortValue(nestedValue)])
    );
  }
  return value;
}

export function hashPayload(payload: unknown): string {
  const canonicalPayload = JSON.stringify(sortValue(payload));
  return createHash('sha256').update(canonicalPayload).digest('hex');
}
