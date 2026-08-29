import type { PasswordRecord } from "./passwords";

/**
 * DMS FILE provisioning needs a Dovecot-compatible password scheme.
 * Keep this adapter separate from the control-plane password record so the
 * application never confuses its verifier with DMS's transport credential.
 *
 * This function intentionally accepts only an already-generated DMS hash.
 * Generation is delegated to the DMS execution boundary, not to API code.
 */
export type DmsPasswordHash = {
  readonly scheme: "dovecot";
  readonly value: string;
};

export function assertDmsPasswordHash(value: string): DmsPasswordHash {
  if (!/^\{[A-Za-z0-9_-]+\}.+/.test(value)) {
    throw new Error("INVALID_DMS_PASSWORD_HASH");
  }
  return { scheme: "dovecot", value };
}

/**
 * Explicitly prevents accidental use of the control-plane verifier as a DMS
 * password. A scrypt record is not a DMS FILE hash and must never be emitted
 * to postfix-accounts.cf.
 */
export function rejectControlPlanePasswordRecord(record: PasswordRecord): never {
  void record;
  throw new Error("CONTROL_PLANE_PASSWORD_CANNOT_BE_PROJECTED_TO_DMS");
}
