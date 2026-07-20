// Plants that shouldn't be sited close together, with a short reason. Keyed by
// plant id; the relationship is treated as symmetric for warnings.
export const ANTAGONISTS: Record<string, { ids: string[]; reason: string }> = {
  walnut: {
    ids: ['apple', 'pear', 'blueberry', 'currant', 'aronia', 'gooseberry', 'rhubarb', 'asparagus'],
    reason: 'Walnut releases juglone, which stunts or kills many fruit and vegetable plants nearby.',
  },
  fennel: {
    ids: ['blueberry', 'gooseberry', 'currant'],
    reason: 'Fennel is allelopathic and inhibits the growth of many neighbours.',
  },
  'jerusalem-artichoke': {
    ids: ['strawberry', 'wild-strawberry', 'clover'],
    reason: 'Jerusalem artichoke is tall and vigorous — it shades and crowds out low neighbours.',
  },
};

/** Does plant a conflict with plant b (either direction)? Returns a reason. */
export function conflictBetween(aId: string, bId: string): string | null {
  const a = ANTAGONISTS[aId];
  if (a && a.ids.includes(bId)) return a.reason;
  const b = ANTAGONISTS[bId];
  if (b && b.ids.includes(aId)) return b.reason;
  return null;
}
