import { eqTerm, ilikeContainsTerm } from './postgrest-filter.util';

describe('postgrest-filter util', () => {
  it('builds a quoted eq term', () => {
    expect(eqTerm('email', 'a@b.com')).toBe('email.eq."a@b.com"');
  });

  it('wraps ilike wildcards outside the quoted value', () => {
    expect(ilikeContainsTerm('team', 'Falcons')).toBe('team.ilike."%Falcons%"');
  });

  it('escapes embedded quotes and backslashes', () => {
    expect(eqTerm('name', 'a"b\\c')).toBe('name.eq."a\\"b\\\\c"');
  });

  it('contains PostgREST structural characters inside the quoted literal (no injection)', () => {
    // A value that tries to inject an extra OR predicate stays fully quoted.
    const term = ilikeContainsTerm('team', 'x,email.neq.null');
    expect(term).toBe('team.ilike."%x,email.neq.null%"');
    // The injected commas/dots are inside the quotes, not structural separators.
    expect(term.indexOf('"')).toBeLessThan(term.indexOf(','));
  });

  it('handles null/undefined values safely', () => {
    expect(eqTerm('email', null)).toBe('email.eq.""');
    expect(ilikeContainsTerm('team', undefined)).toBe('team.ilike."%%"');
  });
});
