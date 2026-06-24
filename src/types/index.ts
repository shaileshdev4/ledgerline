export type TransactionSource =
  | "bank_csv"
  | "ledger_sheet"
  | "p2p_screenshot"
  | "receipt_image";

export type ExpenseCategory =
  | "program_supplies"
  | "program_services"
  | "administrative"
  | "fundraising"
  | "travel"
  | "technology"
  | "utilities"
  | "personnel"
  | "personal"
  | "uncategorized";

export type AgentRole = "ingestion" | "matcher" | "skeptic" | "reconciler";

export type RunState = "idle" | "running" | "done";

export type AnomalyType =
  | "duplicate_payment"
  | "category_mismatch"
  | "missing_documentation";

export type AnomalySeverity = "low" | "medium" | "high";

export interface Transaction {
  id: string;
  source: TransactionSource;
  date: string;
  amount: number;
  merchant: string;
  description: string;
  category: ExpenseCategory;
  referenceId?: string;
  rawText?: string;
  _plantedAnomaly?: AnomalyType;
}

export interface MatchProposal {
  id: string;
  transactionIds: string[];
  amount: number;
  reason: string;
  confidence: number;
  challenged?: boolean;
}

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  confidence: number;
  evidence: string;
  explanation: string;
  recommendedAction: string;
  transactionIds: string[];
}

export interface TraceEvent {
  id: string;
  timestamp: string;
  type:
    | "agent_started"
    | "agent_completed"
    | "message_sent"
    | "match_proposed"
    | "match_challenged"
    | "match_re_proposed"
    | "anomaly_flagged"
    | "report_ready";
  agentRole: AgentRole;
  message: string;
  data?: Record<string, unknown>;
}

export interface ProvenanceRecord {
  id: string;
  timestamp: string;
  agentRole: AgentRole;
  action: string;
  reason: string;
  transactionIds?: string[];
}

export interface LedgerSnapshot {
  totalDebits: number;
  transactionCount: number;
  matchedCount: number;
  unmatchedCount: number;
  flaggedCount: number;
  computedAt: string;
}

export interface ReconciliationSummary {
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  anomalyCount: number;
  highSeverityCount: number;
  confidence: number;
  requiresHumanReview: boolean;
  reviewReason?: string;
}

export interface ReconciliationResult {
  id: string;
  organizationName: string;
  period: string;
  generatedAt: string;
  transactions: Transaction[];
  anomalies: Anomaly[];
  trace: TraceEvent[];
  provenance: ProvenanceRecord[];
  ledger: LedgerSnapshot;
  summary: ReconciliationSummary;
}

export interface EngineConfig {
  organizationName: string;
  period: string;
  duplicateWindowDays: number;
  documentationThreshold: number;
  matcherConfidenceFloor: number;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  organizationName: "Youth Code Foundation",
  period: "Q1 2026",
  duplicateWindowDays: 7,
  documentationThreshold: 200,
  matcherConfidenceFloor: 0.65,
};

