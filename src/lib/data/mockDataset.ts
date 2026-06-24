import type { Transaction } from "@/types";

function txn(
  id: string,
  source: Transaction["source"],
  date: string,
  amount: number,
  merchant: string,
  category: Transaction["category"],
  description?: string,
  referenceId?: string,
  planted?: Transaction["_plantedAnomaly"],
): Transaction {
  return {
    id,
    source,
    date,
    amount,
    merchant,
    category,
    description: description ?? merchant,
    referenceId,
    _plantedAnomaly: planted,
  };
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  // bank_csv (13)
  txn("bank-001", "bank_csv", "2026-01-03", 1500, "Metro Market", "program_supplies", "Workshop groceries", "BK-1001"),
  txn("bank-002", "bank_csv", "2026-01-07", 220, "City Utilities", "utilities", "January utilities", "BK-1002"),
  txn("bank-003", "bank_csv", "2026-01-11", 145, "CodeCamp Transit", "travel", "Bus cards", "BK-1003"),
  txn("bank-004", "bank_csv", "2026-01-17", 89.99, "Office Depot", "administrative", "Printer ink", "BK-1004"),
  txn("bank-005", "bank_csv", "2026-01-21", 540, "Community Hall", "program_services", "Venue rental", "BK-1005"),
  txn("bank-006", "bank_csv", "2026-01-25", 67.43, "Staples", "program_supplies", "Markers and folders", "BK-1006"),
  txn("bank-007", "bank_csv", "2026-02-01", 129.5, "Zoom", "technology", "Monthly software", "BK-1007"),
  txn("bank-008", "bank_csv", "2026-02-04", 355, "Coach Payroll", "personnel", "Part-time coach stipend", "BK-1008"),
  txn("bank-009", "bank_csv", "2026-02-12", 412.8, "FedEx", "administrative", "Program materials shipping", "BK-1009"),
  txn("bank-010", "bank_csv", "2026-02-20", 780, "Youth Sports Gear", "program_supplies", "Uniforms batch 1", "BK-1010"),
  txn("bank-011", "bank_csv", "2026-03-03", 315, "AWS", "technology", "Cloud hosting", "BK-1011"),
  txn("bank-012", "bank_csv", "2026-03-10", 240, "Volunteer Lunch", "program_services", "Mentor event catering", "BK-1012"),
  txn("bank-013", "bank_csv", "2026-03-23", 197.75, "Canva", "administrative", "Design subscription", "BK-1013"),

  // ledger_sheet (7)
  txn("ledger-001", "ledger_sheet", "2026-01-03", 1500, "Metro Market", "program_supplies", "Workshop groceries", "LG-2001"),
  txn("ledger-002", "ledger_sheet", "2026-01-17", 89.99, "Office Depot", "administrative", "Printer ink", "LG-2002"),
  txn("ledger-003", "ledger_sheet", "2026-02-04", 355, "Coach Payroll", "personnel", "Coach stipend", "LG-2003"),
  txn("ledger-004", "ledger_sheet", "2026-02-20", 780, "Youth Sports Gear", "program_supplies", "Uniforms batch 1", "LG-2004"),
  txn("ledger-005", "ledger_sheet", "2026-03-03", 315, "AWS", "technology", "Cloud hosting", "LG-2005"),
  txn(
    "ledger-006",
    "ledger_sheet",
    "2026-03-14",
    240,
    "Neighborhood Hardware",
    "program_supplies",
    "Emergency repair materials",
    "LG-2006",
    "missing_documentation",
  ),
  txn("ledger-007", "ledger_sheet", "2026-03-23", 197.75, "Canva", "administrative", "Design subscription", "LG-2007"),

  // p2p_screenshot (7)
  txn("p2p-001", "p2p_screenshot", "2026-01-12", 75, "Coach Mia", "personnel", "Stipend transfer", "P2P-3001"),
  txn("p2p-002", "p2p_screenshot", "2026-01-26", 67.43, "Staples", "program_supplies", "Reimbursement for supplies", "P2P-3002", "duplicate_payment"),
  txn("p2p-003", "p2p_screenshot", "2026-02-02", 58.2, "Volunteer Snacks", "program_services", "Volunteer snacks", "P2P-3003"),
  txn("p2p-004", "p2p_screenshot", "2026-02-15", 110, "Field Transport", "travel", "Ride reimbursement", "P2P-3004"),
  txn("p2p-005", "p2p_screenshot", "2026-02-28", 49.99, "Spotify", "program_supplies", "Youth workshop playlist", "P2P-3005", "category_mismatch"),
  txn("p2p-006", "p2p_screenshot", "2026-03-09", 92.35, "Volunteer Fuel", "travel", "Fuel reimbursement", "P2P-3006"),
  txn("p2p-007", "p2p_screenshot", "2026-03-21", 150, "Parent Mentor", "program_services", "Mentor dinner stipend", "P2P-3007"),

  // receipt_image (14)
  txn("rcpt-001", "receipt_image", "2026-01-03", 1500, "Metro Market", "program_supplies", "Receipt: groceries", "RCPT-4001"),
  txn("rcpt-002", "receipt_image", "2026-01-07", 220, "City Utilities", "utilities", "Receipt: utility payment", "RCPT-4002"),
  txn("rcpt-003", "receipt_image", "2026-01-11", 145, "CodeCamp Transit", "travel", "Receipt: bus cards", "RCPT-4003"),
  txn("rcpt-004", "receipt_image", "2026-01-17", 89.99, "Office Depot", "administrative", "Receipt: ink", "RCPT-4004"),
  txn("rcpt-005", "receipt_image", "2026-01-21", 540, "Community Hall", "program_services", "Receipt: venue", "RCPT-4005"),
  txn("rcpt-006", "receipt_image", "2026-01-25", 67.43, "Staples", "program_supplies", "Receipt: markers and folders", "RCPT-4006"),
  txn("rcpt-007", "receipt_image", "2026-02-01", 129.5, "Zoom", "technology", "Receipt: software", "RCPT-4007"),
  txn("rcpt-008", "receipt_image", "2026-02-04", 355, "Coach Payroll", "personnel", "Receipt: stipend disbursement", "RCPT-4008"),
  txn("rcpt-009", "receipt_image", "2026-02-12", 412.8, "FedEx", "administrative", "Receipt: shipping", "RCPT-4009"),
  txn("rcpt-010", "receipt_image", "2026-02-20", 780, "Youth Sports Gear", "program_supplies", "Receipt: uniforms", "RCPT-4010"),
  txn("rcpt-011", "receipt_image", "2026-03-03", 315, "AWS", "technology", "Receipt: hosting", "RCPT-4011"),
  txn("rcpt-012", "receipt_image", "2026-03-10", 240, "Volunteer Lunch", "program_services", "Receipt: mentor catering", "RCPT-4012"),
  txn("rcpt-013", "receipt_image", "2026-03-23", 197.75, "Canva", "administrative", "Receipt: subscription", "RCPT-4013"),
  txn("rcpt-014", "receipt_image", "2026-03-28", 64.1, "Local Print Shop", "fundraising", "Flyers for fundraiser", "RCPT-4014"),
];

