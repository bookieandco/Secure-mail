import type { Mailbox } from "../mail-types/mailbox";
import type { Domain } from "../mail-types/domain";

export type DmsProjection = {
  accounts: Array<{ address: string; passwordHash: string }>;
  aliases: Array<{ source: string; target: string }>;
};

/**
 * Pure projection only. It never executes setup, writes files, or talks to Docker.
 * Password hashes are supplied by the credential boundary; plaintext passwords are
 * intentionally not accepted here.
 */
export function projectToDms(
  domains: readonly Domain[],
  mailboxes: readonly Mailbox[],
): DmsProjection {
  const activeDomains = new Set(
    domains.filter((d) => d.status === "ACTIVE").map((d) => d.name.toLowerCase()),
  );

  const accounts = mailboxes
    .filter((m) => m.status === "ACTIVE")
    .filter((m) => activeDomains.has(m.address.split("@")[1]?.toLowerCase() ?? ""))
    .map((m) => ({ address: m.address.toLowerCase(), passwordHash: m.passwordHash }));

  return { accounts, aliases: [] };
}
