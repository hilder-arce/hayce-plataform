export function extractEntityId(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (typeof record.id === 'string') {
      return record.id;
    }

    const mongoId = record._id as
      | { toString?: () => string }
      | string
      | undefined;
    if (typeof mongoId === 'string') {
      return mongoId;
    }

    if (mongoId && typeof mongoId.toString === 'function') {
      return mongoId.toString();
    }
  }

  return null;
}

export function isPopulatedReference<T extends object>(
  value: unknown,
  marker: keyof T,
): value is T {
  return (
    typeof value === 'object' &&
    value !== null &&
    marker in (value as Record<string, unknown>)
  );
}
