export interface ReconcileResult {
  readonly created: string[];
  readonly kept: string[];
  readonly removed: string[];
}

export interface ReconcilableSnapshot {
  readonly enemies: ReadonlyArray<{ readonly id: string }>;
}

/**
 * Pure diffing helper reconciling previous enemy ids against the current snapshot.
 * Returns { created, kept, removed } lists of enemy ids.
 */
export function reconcile(
  prevIds: Iterable<string>,
  snapshot: ReconcilableSnapshot
): ReconcileResult {
  const prevSet = new Set(prevIds);
  const currentSet = new Set(snapshot.enemies.map((e) => e.id));

  const created: string[] = [];
  const kept: string[] = [];
  const removed: string[] = [];

  for (const enemy of snapshot.enemies) {
    if (prevSet.has(enemy.id)) {
      kept.push(enemy.id);
    } else {
      created.push(enemy.id);
    }
  }

  for (const prevId of prevSet) {
    if (!currentSet.has(prevId)) {
      removed.push(prevId);
    }
  }

  return { created, kept, removed };
}
