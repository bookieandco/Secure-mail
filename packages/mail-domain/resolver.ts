import type { MailDomain } from "../mail-types/domain";
import type { Mailbox } from "../mail-types/mailbox";

export type ProvisionedMailbox = Mailbox & {
  /** Password verifier/hash owned by the credential boundary. */
  readonly passwordHash: string;
};

export type DmsProjection = {
  accounts: Array<{ address: string; passwordHash: string }>;
  aliases: Array<{ source: string; target: string }>;
};

/**
 * Pure projection only. It never executes setup, writes files, or talks to Docker.
 * Plaintext passwords are intentionally not accepted here.
 */
export function projectToDms(
  domains: readonly MailDomain[],
  mailboxes: readonly ProvisionedMailbox[],
): DmsProjection {
  const domainsById = new Map(domains.map((d) => [d.id, d]));

  const accounts = mailboxes
    .filter((m) => m.status === "ACTIVE")
    .map((m) => {
      const domain = domainsById.get(m.domainId);
      if (!domain || domain.status !== "ACTIVE") return null;

      const address = `${m.localPart}@${domain.name}`.toLowerCase();
      return { address, passwordHash: m.passwordHash };
    })
    .filter((account): account is { address: string; passwordHash: string } => account !== null);

  return { accounts, aliases: [] };
}
