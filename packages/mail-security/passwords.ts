import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Credential boundary for the control plane.
 *
 * Plaintext passwords are accepted only at the edge of a credential operation,
 * never persisted or returned. The stored representation is versioned and
 * uses Node's scrypt implementation with a per-password random salt.
 */

export type PasswordRecord = {
  readonly version: 1;
  readonly scheme: "scrypt";
  readonly salt: string;
  readonly digest: string;
};

const KEY_LENGTH = 64;
const SALT_BYTES = 32;
const SCRYPT = { N: 32768, r: 8, p: 1 } as const;

export function hashPassword(password: string): PasswordRecord {
  assertPassword(password);
  const salt = randomBytes(SALT_BYTES);
  const digest = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: 64 * 1024 * 1024,
  });

  return {
    version: 1,
    scheme: "scrypt",
    salt: salt.toString("base64url"),
    digest: digest.toString("base64url"),
  };
}

export function verifyPassword(password: string, record: PasswordRecord): boolean {
  assertPassword(password);
  if (record.version !== 1 || record.scheme !== "scrypt") return false;

  const salt = Buffer.from(record.salt, "base64url");
  const expected = Buffer.from(record.digest, "base64url");
  if (salt.length !== SALT_BYTES || expected.length !== KEY_LENGTH) return false;

  const actual = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(actual, expected);
}

/** Stable fingerprint for audit correlation; never use as a credential. */
export function credentialFingerprint(record: PasswordRecord): string {
  return createHash("sha256")
    .update(`${record.version}:${record.scheme}:${record.salt}:${record.digest}`)
    .digest("hex");
}

function assertPassword(password: string): void {
  if (typeof password !== "string" || password.length < 12) {
    throw new Error("MAIL_PASSWORD_TOO_SHORT");
  }
  if (password.length > 1024) {
    throw new Error("MAIL_PASSWORD_TOO_LONG");
  }
}
