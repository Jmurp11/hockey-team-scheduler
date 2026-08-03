const mockResolveMx = jest.fn();
jest.mock('node:dns', () => ({
  promises: { resolveMx: (domain: string) => mockResolveMx(domain) },
}));

import {
  EmailVerificationService,
  STORE_CONFIDENCE_THRESHOLD,
  CONTACT_TTL_DAYS,
} from './email-verification.service';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;

  beforeEach(() => {
    mockResolveMx.mockReset();
    service = new EmailVerificationService();
  });

  const withMx = () => mockResolveMx.mockResolvedValue([{ exchange: 'mx1', priority: 10 }]);
  const noMx = () => mockResolveMx.mockRejectedValue(new Error('ENOTFOUND'));

  it('rejects malformed addresses without a DNS lookup', async () => {
    const res = await service.verify('not-an-email');
    expect(res.syntaxValid).toBe(false);
    expect(res.deliverable).toBe(false);
    expect(res.confidence).toBe(0);
    expect(mockResolveMx).not.toHaveBeenCalled();
  });

  it('marks a syntactically valid address with MX as deliverable', async () => {
    withMx();
    const res = await service.verify('coach@example.com');
    expect(res.syntaxValid).toBe(true);
    expect(res.hasMx).toBe(true);
    expect(res.deliverable).toBe(true);
    expect(res.confidence).toBeGreaterThanOrEqual(0.7);
    expect(res.confidence).toBeGreaterThanOrEqual(STORE_CONFIDENCE_THRESHOLD);
  });

  it('treats a valid address with no MX as undeliverable and below the store threshold', async () => {
    noMx();
    const res = await service.verify('coach@no-mail-domain.example');
    expect(res.syntaxValid).toBe(true);
    expect(res.hasMx).toBe(false);
    expect(res.deliverable).toBe(false);
    expect(res.confidence).toBeLessThan(STORE_CONFIDENCE_THRESHOLD);
  });

  it('boosts confidence when the address domain matches the source page', async () => {
    withMx();
    const generic = await service.verify('a@gmail.com', {
      sourceUrl: 'https://someclub.org/roster',
    });
    const matched = await service.verify('a@someclub.org', {
      sourceUrl: 'https://www.someclub.org/roster',
    });
    expect(matched.confidence).toBeGreaterThan(generic.confidence);
  });

  it('adds a signal when the team is corroborated by rankings', async () => {
    withMx();
    const unknown = await service.verify('a@example.com', { teamKnown: false });
    const known = await service.verify('a@example.com', { teamKnown: true });
    expect(known.confidence).toBeGreaterThan(unknown.confidence);
  });

  describe('isStale', () => {
    it('is stale when never verified', () => {
      expect(service.isStale(null)).toBe(true);
      expect(service.isStale(undefined)).toBe(true);
      expect(service.isStale('not-a-date')).toBe(true);
    });

    it('is fresh when verified recently', () => {
      expect(service.isStale(new Date().toISOString())).toBe(false);
    });

    it('is stale past the TTL window', () => {
      const old = new Date(
        Date.now() - (CONTACT_TTL_DAYS + 1) * 24 * 60 * 60 * 1000,
      ).toISOString();
      expect(service.isStale(old)).toBe(true);
    });
  });
});
