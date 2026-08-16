import type { ProjectSort } from '@/constants/projects';
import type {
  Project,
  ProjectForecastLine,
  ProjectNote,
  ProjectNoteTag,
  ProjectReference,
  ProjectStatus,
  ProjectTodo,
  ProjectVendor,
} from '@prisma/client';

export interface ForecastLineSummary extends ProjectForecastLine {
  /** Sum of matched, non-voided transactions tagged with this line's id. */
  actualAmount: number;
  vendorLabel: string | null;
}

export interface VendorSummary extends ProjectVendor {
  /** contractAmount minus the sum of non-REFUND, non-voided transactions tagged with
   *  this vendor's id — see plan doc "cut #1", no netting relationship. */
  balance: number;
}

export interface ReferenceSummary extends ProjectReference {
  vendorLabel: string | null;
}

export type ProjectSummary = Project & {
  fundingLabel: string | null;
  forecastLines: ForecastLineSummary[];
  forecastTotal: number;
  /** Every non-voided transaction tagged to the project, matched to a line or not —
   *  the project's true total spend, not just the sum of forecastLines' actuals. */
  spentTotal: number;
  vendors: VendorSummary[];
  todos: ProjectTodo[];
  activityNotes: ProjectNote[];
  references: ReferenceSummary[];
  /** Planned (matched a forecast line) vs unplanned spend split, for the Reports
   *  tab — reuses isPlanned rather than a new field. No separate /summary
   *  endpoint: this is computed live in the same toSummary() as everything else,
   *  so the Reports tab and the locked Close-project view can never disagree. */
  plannedTotal: number;
  unplannedTotal: number;
};

// What the Projects list page (ProjectCard) actually renders — name, status,
// description, dates, funding label. Deliberately not the same shape as
// ProjectSummary: the list never shows forecast/spend totals or per-line/
// per-vendor detail, so the list endpoint doesn't compute them either (see
// toListSummary() in projects.service.ts) rather than running full
// per-project aggregate queries just to throw the result away in the UI.
export type ProjectListSummary = Pick<
  Project,
  | 'id'
  | 'name'
  | 'description'
  | 'status'
  | 'startDate'
  | 'targetCompletionDate'
  | 'fundingAccountId'
  | 'fundingFundId'
  | 'createdAt'
> & {
  fundingLabel: string | null;
};

export interface ListProjectsQuery {
  page?: number;
  limit?: number;
  sort?: ProjectSort;
  status?: ProjectStatus;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  startDate?: string;
  targetCompletionDate?: string;
  notes?: string;
  fundingAccountId?: string;
  fundingFundId?: string;
  /** Initial lines only — see projects.schema.ts for why editing later goes
   *  through the dedicated forecast-line actions instead. */
  forecastLines?: CreateForecastLineDto[];
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  startDate?: string;
  targetCompletionDate?: string;
  notes?: string;
  fundingAccountId?: string;
  fundingFundId?: string;
  /** COMPLETED/ARCHIVED are deliberately excluded — those only happen via the
   *  close/reopen actions (Slice 6), never a generic field write. */
  status?: Extract<ProjectStatus, 'PLANNING' | 'ACTIVE' | 'ON_HOLD'>;
}

export interface CreateForecastLineDto {
  description: string;
  forecastAmount: number;
  vendorId?: string;
}

export type UpdateForecastLineDto = Partial<CreateForecastLineDto>;

export interface CreateVendorDto {
  name: string;
  contractAmount: number;
  notes?: string;
}

export type UpdateVendorDto = Partial<CreateVendorDto>;

export type ActivityKind = 'todo' | 'note' | 'reference';

export interface CreateActivityItemDto {
  kind: ActivityKind;
  text?: string; // todo, note
  tag?: ProjectNoteTag; // note
  date?: string; // note
  returnOfTransactionId?: string; // note, required when tag === 'RETURN'
  key?: string; // reference
  value?: string; // reference
  vendorId?: string; // reference
}

export interface UpdateActivityItemDto {
  done?: boolean; // todo
  text?: string; // todo, note
  key?: string; // reference
  value?: string; // reference
}
