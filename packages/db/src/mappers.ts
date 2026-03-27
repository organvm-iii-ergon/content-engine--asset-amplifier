/**
 * Converts a snake_case DB row to a camelCase domain object.
 */
export function toCamel<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * Converts a camelCase domain object to snake_case for DB operations.
 */
export function toSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

/**
 * Maps an array of DB rows to camelCase domain objects.
 */
export function mapRows<T extends Record<string, unknown>>(rows: T[]): Record<string, unknown>[] {
  return rows.map(toCamel);
}
