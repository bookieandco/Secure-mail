export type OutboundDecision = "ALLOW" | "THROTTLE" | "DENY";

export type OutboundState = "ENABLED" | "PAUSED";

export interface MailPolicy {
  readonly accountEnabled: boolean;
  readonly domainVerified: boolean;
  readonly outboundState: OutboundState;
  readonly maxMessagesPerHour: number;
  readonly maxRecipientsPerMessage: number;
}

export interface OutboundEvaluation {
  readonly mailboxId: string;
  readonly sender: string;
  readonly recipientCount: number;
  readonly policy: MailPolicy;
}

export interface OutboundResult {
  readonly decision: OutboundDecision;
  readonly reasons: readonly string[];
}
