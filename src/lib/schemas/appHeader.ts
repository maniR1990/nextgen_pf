import { z } from 'zod';

// ─── Primitives ───────────────────────────────────────────────────────────────

const MetricFormatSchema = z.enum([
  'currency-inr',
  'currency-inr-compact',
  'days',
  'number',
  'currency-per-day',
]);

const DataColorSchema = z.enum(['error', 'success', 'info', 'purple', 'warning', 'neutral']);

// ─── Brand ────────────────────────────────────────────────────────────────────

export const AppHeaderBrandSchema = z.object({
  appName: z.string().min(1).max(40),
  logoAbbr: z.string().min(1).max(4),
  homeHref: z.string().min(1),
});

// ─── Nav ──────────────────────────────────────────────────────────────────────

export const AppHeaderNavItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(32),
  href: z.string().min(1),
  disabled: z.boolean().optional(),
});

// ─── Pulse strip ──────────────────────────────────────────────────────────────

export const PulseMetricSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(32),
  dataKey: z.string().min(1),
  changeKey: z.string().optional(),
  metaKey: z.string().optional(),
  unit: z.string().optional(),
  format: MetricFormatSchema.optional(),
  alertWhenZero: z.boolean().optional(),
});

export const MarketTickerSchema = z.object({
  symbols: z.array(z.string()).min(1),
  labels: z.record(z.string(), z.string()),
});

export const PulseStripSchema = z.object({
  collapseAfterScrollPx: z.number().int().positive(),
  metrics: z.array(PulseMetricSchema).min(1).max(6),
  marketTicker: MarketTickerSchema,
});

// ─── Context sub-bar ──────────────────────────────────────────────────────────

export const ContextSubBarItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(32),
  dataKey: z.string().min(1),
  changeKey: z.string().optional(),
  unit: z.string().optional(),
  badge: z.string().optional(),
  format: MetricFormatSchema.optional(),
  href: z.string().optional(),
});

export const ContextSubBarSchema = z.object({
  screens: z.record(z.string(), z.array(ContextSubBarItemSchema)),
});

// ─── Mobile ───────────────────────────────────────────────────────────────────

export const MobileTabItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().max(20),
  icon: z.string().min(1),
  href: z.string().optional(),
  isFab: z.boolean().optional(),
});

export const FabRadialActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(24),
  subtitle: z.string().max(32).optional(),
  icon: z.string().min(1),
  color: DataColorSchema,
  transactionType: z.string().min(1),
});

export const FabRadialSchema = z.object({
  radiusPx: z.number().int().positive(),
  animationMs: z.number().int().positive(),
  actions: z.array(FabRadialActionSchema).min(2).max(6),
});

export const MobileConfigSchema = z.object({
  tabBar: z.array(MobileTabItemSchema).min(3).max(7),
  fabRadial: FabRadialSchema,
});

// ─── Root config ──────────────────────────────────────────────────────────────

export const AppHeaderConfigSchema = z.object({
  brand: AppHeaderBrandSchema,
  nav: z.array(AppHeaderNavItemSchema).min(1).max(10),
  pulseStrip: PulseStripSchema,
  contextSubBar: ContextSubBarSchema,
  mobile: MobileConfigSchema,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppHeaderConfig = z.infer<typeof AppHeaderConfigSchema>;
export type AppHeaderNavItem = z.infer<typeof AppHeaderNavItemSchema>;
export type PulseMetric = z.infer<typeof PulseMetricSchema>;
export type ContextSubBarItem = z.infer<typeof ContextSubBarItemSchema>;
export type MobileTabItem = z.infer<typeof MobileTabItemSchema>;
export type FabRadialAction = z.infer<typeof FabRadialActionSchema>;
export type FabRadialConfig = z.infer<typeof FabRadialSchema>;
export type MobileConfig = z.infer<typeof MobileConfigSchema>;

// ─── Live data shape ──────────────────────────────────────────────────────────
// This is the runtime data that fills in the dynamic values from the config dataKeys.

export interface AppHeaderData {
  // Pulse strip — financial
  netWorth: number;
  netWorthChangePct: number;
  /** False for a brand-new user with no accounts yet — suppresses alert styling on
   *  zero-value metrics that would otherwise read as a false alarm (see PulseStrip). */
  hasAccounts?: boolean;
  readyToAssign: number;
  budgetPeriodLabel: string;
  monthSpend: number;
  spendPaceLabel: string;
  daysUntilClose: number;
  closeDateLabel: string;
  // Pulse strip — market
  market: Record<string, { label: string; value: number; changePct: number }>;
  // Sub-bar / footer shared
  pendingCount: number;
  spendPace: number;
  spendPaceChangePct: number;
  unallocated: number;
  nextRecurringLabel: string;
  monthClosesLabel: string;
  // Budget screen context
  assigned?: number;
  remaining?: number;
  // Transactions screen context
  transactionCount?: number;
  totalOut?: number;
  totalIn?: number;
  // User
  userInitials: string;
  notificationCount: number;
}
