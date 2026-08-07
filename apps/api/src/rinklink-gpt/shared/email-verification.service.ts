import { Injectable, Logger } from '@nestjs/common';
import { promises as dns } from 'node:dns';

/**
 * Verifies discovered (LLM-scraped) contact emails before they are trusted,
 * stored, or sent to (improvements.md #14). Web-search results are not facts —
 * a plausible-but-hallucinated address must never become permanent cached truth
 * or receive a real email. Verification is: RFC-ish syntax → DNS MX lookup →
 * a confidence score from corroborating signals.
 */

/** Minimum confidence for a discovered contact to be auto-stored / used as a recipient. */
export const STORE_CONFIDENCE_THRESHOLD = 0.5;

/** Days after which a stored contact's verification is considered stale and re-checked on reuse. */
export const CONTACT_TTL_DAYS = 90;

export interface EmailVerificationResult {
  /** Lower-cased, trimmed address that was checked. */
  email: string;
  /** Passed RFC-ish syntax validation. */
  syntaxValid: boolean;
  /** The address domain publishes MX records (i.e. can receive mail). */
  hasMx: boolean;
  /** syntaxValid && hasMx. */
  deliverable: boolean;
  /** 0..1 confidence combining deliverability with corroborating signals. */
  confidence: number;
}

export interface VerifySignals {
  /** Source page the address was scraped from — a domain match raises confidence. */
  sourceUrl?: string;
  /** Whether the associated team resolves to a known ranking (corroborating signal). */
  teamKnown?: boolean;
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  // Deliberately simple: one @, a dot in the domain, no whitespace. Enough to
  // reject the malformed/hallucinated strings models emit without importing a
  // heavyweight RFC 5322 validator.
  private static readonly EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async verify(
    email: string,
    signals: VerifySignals = {},
  ): Promise<EmailVerificationResult> {
    const normalized = (email ?? '').trim().toLowerCase();
    const syntaxValid = EmailVerificationService.EMAIL_RE.test(normalized);
    const hasMx = syntaxValid ? await this.hasMxRecord(normalized) : false;
    const deliverable = syntaxValid && hasMx;
    const confidence = this.scoreConfidence(normalized, syntaxValid, hasMx, signals);
    return { email: normalized, syntaxValid, hasMx, deliverable, confidence };
  }

  /** True if the stored contact should be re-verified before reuse (never verified or past TTL). */
  isStale(verifiedAt: string | null | undefined): boolean {
    if (!verifiedAt) {
      return true;
    }
    const verified = new Date(verifiedAt).getTime();
    if (Number.isNaN(verified)) {
      return true;
    }
    const ageMs = Date.now() - verified;
    return ageMs > CONTACT_TTL_DAYS * 24 * 60 * 60 * 1000;
  }

  private async hasMxRecord(email: string): Promise<boolean> {
    const domain = email.split('@')[1];
    if (!domain) {
      return false;
    }
    try {
      const records = await dns.resolveMx(domain);
      return Array.isArray(records) && records.length > 0;
    } catch {
      // NXDOMAIN / no MX / lookup failure — treat as not deliverable (conservative).
      return false;
    }
  }

  private scoreConfidence(
    email: string,
    syntaxValid: boolean,
    hasMx: boolean,
    signals: VerifySignals,
  ): number {
    if (!syntaxValid) {
      return 0;
    }
    let score = 0.3; // valid syntax
    if (hasMx) {
      score += 0.4; // domain can receive mail
    }
    if (signals.sourceUrl && this.domainMatchesSource(email, signals.sourceUrl)) {
      score += 0.2; // address domain matches the page it was scraped from
    }
    if (signals.teamKnown) {
      score += 0.1; // team corroborated against known rankings
    }
    return Math.min(1, score);
  }

  private domainMatchesSource(email: string, sourceUrl: string): boolean {
    const emailDomain = email.split('@')[1];
    if (!emailDomain) {
      return false;
    }
    let host: string;
    try {
      host = new URL(sourceUrl).hostname.toLowerCase();
    } catch {
      return false;
    }
    const base = host.replace(/^www\./, '');
    // Registrable-domain-ish comparison: email domain is, or is a subdomain of, the source host.
    return emailDomain === base || emailDomain.endsWith(`.${base}`) || base.endsWith(`.${emailDomain}`);
  }
}
