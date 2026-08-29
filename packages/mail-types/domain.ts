export type DomainStatus =
  | "PENDING"
  | "VERIFYING"
  | "ACTIVE"
  | "SUSPENDED"
  | "DELETED";

export interface MailDomain {
  readonly id: string;
  readonly name: string;
  readonly status: DomainStatus;
  readonly dkimSelector: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateDomainInput {
  readonly name: string;
  readonly dkimSelector?: string;
}
