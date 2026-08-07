/**
 * Helpers for safely building PostgREST filter strings (the argument to
 * `.or(...)`), where user- or LLM-derived values are interpolated.
 *
 * PostgREST treats `,` (separates OR terms), `(` `)` (group `and(...)`/`or(...)`),
 * and `.` (separates `column.operator.value`) as structural syntax. Interpolating
 * an unescaped value that contains any of these lets the value break out of its
 * intended predicate — PostgREST filter injection (e.g. a `team` search term of
 * `x,email.neq.null` would inject an extra OR condition).
 *
 * PostgREST allows a value to be wrapped in double quotes so its contents are
 * parsed as a single literal; embedded `"`/`\` are escaped. `%` wildcards for
 * `ilike` are placed OUTSIDE the escaped value so they are still honoured by the
 * underlying LIKE.
 */

/** Escapes the characters that are special inside a PostgREST double-quoted value. */
function escapeQuoted(value: unknown): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

/** Builds a safe `column.eq."value"` filter term. */
export function eqTerm(column: string, value: unknown): string {
  return `${column}.eq."${escapeQuoted(value)}"`;
}

/** Builds a safe `column.ilike."%value%"` (contains) filter term. */
export function ilikeContainsTerm(column: string, value: unknown): string {
  return `${column}.ilike."%${escapeQuoted(value)}%"`;
}
