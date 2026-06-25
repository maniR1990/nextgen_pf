export const FLAGS = {
  NEW_DASHBOARD: { key: 'new-dashboard', defaultValue: false },
  AI_INSIGHTS: { key: 'ai-insights', defaultValue: false },
  EXPORT_PDF: { key: 'export-pdf', defaultValue: true },
  BETA_TRANSACTIONS: { key: 'beta-transactions', defaultValue: false },
} as const;

export type FlagKey = keyof typeof FLAGS;
