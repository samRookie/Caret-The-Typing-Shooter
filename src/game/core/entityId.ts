/**
 * Monotonically increasing entity ID generator scoped per simulation run.
 */
export class EntityIdGenerator {
  private counter: number = 0;

  next(): string {
    this.counter++;
    return `e${this.counter}`;
  }

  reset(): void {
    this.counter = 0;
  }
}

/**
 * Extracts the numeric index from an entity identifier (e.g. "e12" -> 12).
 */
export function parseEntityNumericId(id: string): number {
  if (id.startsWith('e')) {
    const parsed = parseInt(id.slice(1), 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const parsed = parseInt(id, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Compares two entity identifiers strictly numerically (e.g., e2 comes before e10).
 * Never compares entity IDs as strings.
 */
export function compareEntityIds(a: string, b: string): number {
  return parseEntityNumericId(a) - parseEntityNumericId(b);
}


