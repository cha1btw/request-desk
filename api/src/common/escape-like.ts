// In SQL LIKE / ILIKE the characters % and _ are wildcards. When a user
// searches for "50%" they mean the literal text, so we escape them.
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
