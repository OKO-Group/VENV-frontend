export function getChangedFields(original: Record<string, any>, updated: Record<string, any>) {
  const diff: Record<string, any> = {};
  for (const key in updated) {
    if (updated[key] !== original[key]) {
      diff[key] = updated[key];
    }
  }
  return diff;
}
