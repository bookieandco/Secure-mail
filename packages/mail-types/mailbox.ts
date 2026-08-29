export type MailboxStatus =
  | "PROVISIONING"
  | "ACTIVE"
  | "SUSPENDED"
  | "RETENTION"
  | "PURGED";

export interface Mailbox {
  readonly id: string;
  readonly domainId: string;
  readonly localPart: string;
  readonly status: MailboxStatus;
  readonly quotaBytes: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateMailboxInput {
  readonly domainId: string;
  readonly localPart: string;
  readonly quotaBytes?: number | null;
}
