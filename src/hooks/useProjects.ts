'use client';

/**
 * Projects React Query hooks. Mirrors the invalidation shape used by
 * useTransactions.ts — writes invalidate `projects.lists()`, never `.all`
 * directly, so an in-flight detail query isn't needlessly refetched too.
 */

import { useToast } from '@/components/common/ToastProvider/useToast';
import type { TransactionRow } from '@/components/common/TransactionTable';
import { TX_TYPE_META, type TxType } from '@/constants/finance';
import { apiDeleteV1, apiGetV1, apiPostV1, apiPutV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export interface ForecastLineSummary {
  id: string;
  description: string;
  forecastAmount: number;
  actualAmount: number;
  vendorId: string | null;
  vendorLabel: string | null;
  createdAt: string;
}

export type ProjectPaymentType = 'ADVANCE' | 'MILESTONE' | 'FINAL' | 'REFUND';

export interface VendorSummary {
  id: string;
  name: string;
  contractAmount: number;
  notes: string | null;
  balance: number;
  createdAt: string;
}

export type ProjectNoteTag = 'PROGRESS' | 'DECISION' | 'DELIVERY' | 'RETURN' | 'MISC';

export interface TodoSummary {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface ActivityNoteSummary {
  id: string;
  text: string;
  tag: ProjectNoteTag;
  date: string;
  returnOfTransactionId: string | null;
  createdAt: string;
}

export interface ReferenceSummary {
  id: string;
  key: string;
  value: string;
  vendorId: string | null;
  vendorLabel: string | null;
  createdAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  targetCompletionDate: string | null;
  completedAt: string | null;
  notes: string | null;
  fundingAccountId: string | null;
  fundingFundId: string | null;
  fundingLabel: string | null;
  forecastLines: ForecastLineSummary[];
  forecastTotal: number;
  spentTotal: number;
  vendors: VendorSummary[];
  todos: TodoSummary[];
  activityNotes: ActivityNoteSummary[];
  references: ReferenceSummary[];
  /** Planned (matched a forecast line) vs unplanned spend split, for the Reports tab. */
  plannedTotal: number;
  unplannedTotal: number;
  createdAt: string;
  updatedAt: string;
}

// What the list endpoint actually returns — the list page never shows
// forecast/spend totals or per-line/vendor detail, so the API doesn't compute
// them for this path (see toListSummary() server-side) and this type doesn't
// claim to have them. Use ProjectSummary (from useProjectDetail) for anything
// that needs the full picture.
export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  targetCompletionDate: string | null;
  fundingAccountId: string | null;
  fundingFundId: string | null;
  fundingLabel: string | null;
  createdAt: string;
}

export interface ProjectBody {
  name: string;
  description?: string;
  startDate?: string;
  targetCompletionDate?: string;
  notes?: string;
  fundingAccountId?: string;
  fundingFundId?: string;
  status?: Extract<ProjectStatus, 'PLANNING' | 'ACTIVE' | 'ON_HOLD'>;
  /** Initial lines only, set atomically at creation — see projects.schema.ts. */
  forecastLines?: ForecastLineBody[];
}

export interface ForecastLineBody {
  description: string;
  forecastAmount: number;
  vendorId?: string;
}

export interface VendorBody {
  name: string;
  contractAmount: number;
  notes?: string;
}

export function useProjectsList(status?: ProjectStatus) {
  const filters = { status: status ?? null, limit: 100 };
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: () => {
      const params = new URLSearchParams({ limit: '100' });
      if (status) params.set('status', status);
      return apiGetV1<ProjectListItem[]>(`/api/v1/projects?${params.toString()}`);
    },
  });
}

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => apiGetV1<ProjectSummary>(`/api/v1/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (body: ProjectBody) => apiPostV1<ProjectSummary>('/api/v1/projects', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create project');
    },
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (body: Partial<ProjectBody>) =>
      apiPutV1<ProjectSummary>(`/api/v1/projects/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update project');
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => apiDeleteV1<void>(`/api/v1/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      toast.success('Project deleted');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to delete project');
    },
  });
}

export function useAddForecastLine(projectId: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (body: ForecastLineBody) =>
      apiPostV1<ProjectSummary>(`/api/v1/projects/${projectId}/forecast-lines`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to add forecast line');
    },
  });
}

export function useUpdateForecastLine(projectId: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ lineId, ...body }: Partial<ForecastLineBody> & { lineId: string }) =>
      apiPutV1<ProjectSummary>(`/api/v1/projects/${projectId}/forecast-lines/${lineId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update forecast line');
    },
  });
}

export function useRemoveForecastLine(projectId: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (lineId: string) =>
      apiDeleteV1<ProjectSummary>(`/api/v1/projects/${projectId}/forecast-lines/${lineId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to remove forecast line');
    },
  });
}

export function useAddVendor(projectId: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (body: VendorBody) =>
      apiPostV1<ProjectSummary>(`/api/v1/projects/${projectId}/vendors`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to add vendor');
    },
  });
}

export function useUpdateVendor(projectId: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ vendorId, ...body }: Partial<VendorBody> & { vendorId: string }) =>
      apiPutV1<ProjectSummary>(`/api/v1/projects/${projectId}/vendors/${vendorId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update vendor');
    },
  });
}

export function useRemoveVendor(projectId: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (vendorId: string) =>
      apiDeleteV1<ProjectSummary>(`/api/v1/projects/${projectId}/vendors/${vendorId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to remove vendor');
    },
  });
}

export type ActivityKind = 'todo' | 'note' | 'reference';

export interface ActivityItemBody {
  kind: ActivityKind;
  text?: string;
  tag?: ProjectNoteTag;
  date?: string;
  returnOfTransactionId?: string;
  key?: string;
  value?: string;
  vendorId?: string;
}

export function useAddActivityItem(projectId: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (body: ActivityItemBody) =>
      apiPostV1<ProjectSummary>(`/api/v1/projects/${projectId}/activity`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to add activity item');
    },
  });
}

export interface UpdateActivityItemBody {
  done?: boolean;
  text?: string;
  key?: string;
  value?: string;
}

export function useUpdateActivityItem(projectId: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ itemId, ...body }: UpdateActivityItemBody & { itemId: string }) =>
      apiPutV1<ProjectSummary>(`/api/v1/projects/${projectId}/activity/${itemId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update activity item');
    },
  });
}

export function useRemoveActivityItem(projectId: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (itemId: string) =>
      apiDeleteV1<ProjectSummary>(`/api/v1/projects/${projectId}/activity/${itemId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to remove activity item');
    },
  });
}

// ── Ledger — reuses the existing Transactions list endpoint, filtered by
// projectId, mapped into the same TransactionRow shape common/TransactionTable
// already renders. Not a second transaction store — see plan doc Slice 3.

interface ApiLedgerRow {
  id: string;
  type: TxType;
  date: string;
  amount: number;
  merchant?: string;
}

function mapLedgerRow(row: ApiLedgerRow): TransactionRow {
  return {
    id: row.id,
    date: row.date,
    merchant: row.merchant ?? '—',
    amount: row.amount,
    amountSign: TX_TYPE_META[row.type]?.amountSign ?? 'neutral',
  };
}

export function useCloseProject(projectId: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: () => apiPostV1<ProjectSummary>(`/api/v1/projects/${projectId}/close`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      toast.success('Project closed');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to close project');
    },
  });
}

export function useReopenProject(projectId: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: () => apiPostV1<ProjectSummary>(`/api/v1/projects/${projectId}/reopen`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      toast.success('Project reopened');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to reopen project');
    },
  });
}

export function useProjectLedger(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.ledger(projectId),
    queryFn: async () => {
      const rows = await apiGetV1<ApiLedgerRow[]>(
        `/api/v1/transactions?projectId=${projectId}&limit=100&sort=date_desc`,
      );
      return rows.map(mapLedgerRow);
    },
    enabled: !!projectId,
  });
}
