import { z } from 'zod';

const FilterOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

/** Validates JSON column configuration arrays */
export const DataTableColumnDefSchema = z.object({
  key: z.string().min(1),
  header: z.string().min(1),
  type: z.enum(['text', 'date', 'amount', 'badge', 'transaction']).optional(),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  filterOptions: z.array(FilterOptionSchema).optional(),
  width: z.number().positive().optional(),
  minWidth: z.number().positive().optional(),
  frozen: z.boolean().optional(),
  hidden: z.boolean().optional(),
  align: z.enum(['left', 'right']).optional(),
  badgeVariantKey: z.string().optional(),
  iconKey: z.string().optional(),
  accessor: z.string().optional(),
});

export const DataTableColumnsSchema = z.array(DataTableColumnDefSchema).min(1);

export type DataTableColumnJson = z.infer<typeof DataTableColumnDefSchema>;

export function parseDataTableColumns(json: unknown) {
  return DataTableColumnsSchema.parse(json);
}
